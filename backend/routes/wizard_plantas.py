#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas do Wizard para Criação de Plantas Medicinais
Blueprint para integração na porta 5000
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import uuid
import logging

from models.planta_models import (
    db, PlantaMedicinal, Provincia, LocalColheita, ParteUsada,
    Indicacao, Autor, Afiliacao, Referencia, MetodoPreparacaoTrad,
    MetodoExtraccaoCientif
)
from services.planta_service import PlantaService

logger = logging.getLogger(__name__)

# Criar Blueprint
wizard_plantas_bp = Blueprint('wizard_plantas', __name__, url_prefix='/api/wizard')

# Armazenamento de rascunhos em memória
plant_drafts = {}


def clean_expired_drafts():
    """Remove rascunhos expirados (mais de 24h)"""
    now = datetime.utcnow()
    expired_keys = []
    
    for draft_id, draft_data in plant_drafts.items():
        try:
            expires_at = datetime.fromisoformat(draft_data['expires_at'])
            if now > expires_at:
                expired_keys.append(draft_id)
        except:
            expired_keys.append(draft_id)
    
    for key in expired_keys:
        del plant_drafts[key]
    
    if expired_keys:
        logger.info(f"🗑️ {len(expired_keys)} rascunhos expirados removidos")


def handle_error(e, message="Erro interno"):
    """Handler genérico de erros"""
    logger.error(f"❌ {message}: {str(e)}")
    return jsonify({'error': message, 'details': str(e)}), 500


# =====================================================
# ROTAS PARA DADOS (DROPDOWNS/SELECTS)
# =====================================================

@wizard_plantas_bp.route('/data/provincias', methods=['GET'])
def get_provincias():
    """Retorna lista de províncias"""
    try:
        provincias = Provincia.query.order_by(Provincia.provincia).all()
        return jsonify([p.to_dict() for p in provincias]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar províncias")


@wizard_plantas_bp.route('/data/locais', methods=['GET'])
def get_locais():
    """Retorna lista de locais de colheita"""
    try:
        id_provincia = request.args.get('id_provincia', type=int)
        
        query = LocalColheita.query
        if id_provincia:
            query = query.filter_by(id_provincia=id_provincia)
        
        locais = query.order_by(LocalColheita.nome_local).all()
        return jsonify([l.to_dict() for l in locais]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar locais")


@wizard_plantas_bp.route('/data/partes-usadas', methods=['GET'])
def get_partes_usadas():
    """Retorna lista de partes usadas"""
    try:
        partes = ParteUsada.query.order_by(ParteUsada.nome_parte).all()
        return jsonify([p.to_dict() for p in partes]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar partes usadas")


@wizard_plantas_bp.route('/data/indicacoes', methods=['GET'])
def get_indicacoes():
    """Retorna lista de indicações"""
    try:
        indicacoes = Indicacao.query.order_by(Indicacao.descricao_uso).all()
        return jsonify([i.to_dict() for i in indicacoes]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar indicações")


@wizard_plantas_bp.route('/data/metodos-preparacao', methods=['GET'])
def get_metodos_preparacao():
    """Retorna lista de métodos de preparação tradicional"""
    try:
        metodos = MetodoPreparacaoTrad.query.order_by(
            MetodoPreparacaoTrad.descricao_metodo_preparacao
        ).all()
        return jsonify([m.to_dict() for m in metodos]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos de preparação")


@wizard_plantas_bp.route('/data/metodos-extracao', methods=['GET'])
def get_metodos_extracao():
    """Retorna lista de métodos de extração científica"""
    try:
        metodos = MetodoExtraccaoCientif.query.order_by(
            MetodoExtraccaoCientif.descricao_metodo_extraccao
        ).all()
        return jsonify([m.to_dict() for m in metodos]), 200
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos de extração")


# =====================================================
# ROTAS DE RASCUNHOS
# =====================================================

@wizard_plantas_bp.route('/plantas/draft', methods=['POST'])
def save_draft():
    """Salva rascunho de planta"""
    try:
        clean_expired_drafts()
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        draft_id = data.get('draft_id') or str(uuid.uuid4())
        
        draft_data = {
            **data,
            'draft_id': draft_id,
            'updated_at': datetime.utcnow().isoformat(),
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        plant_drafts[draft_id] = draft_data
        
        logger.info(f"💾 Rascunho salvo: {draft_id}")
        
        return jsonify({
            'success': True,
            'draft_id': draft_id,
            'message': 'Rascunho guardado com sucesso'
        }), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao guardar rascunho")


@wizard_plantas_bp.route('/plantas/draft/<draft_id>', methods=['GET'])
def get_draft(draft_id):
    """Recupera rascunho"""
    try:
        clean_expired_drafts()
        
        if draft_id not in plant_drafts:
            return jsonify({'error': 'Rascunho não encontrado'}), 404
        
        draft = plant_drafts[draft_id]
        
        # Verificar expiração
        expires_at = datetime.fromisoformat(draft['expires_at'])
        if datetime.utcnow() > expires_at:
            del plant_drafts[draft_id]
            return jsonify({'error': 'Rascunho expirado'}), 410
        
        return jsonify(draft), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao recuperar rascunho")


@wizard_plantas_bp.route('/plantas/draft/<draft_id>', methods=['DELETE'])
def delete_draft(draft_id):
    """Elimina rascunho"""
    try:
        if draft_id in plant_drafts:
            del plant_drafts[draft_id]
            logger.info(f"🗑️ Rascunho eliminado: {draft_id}")
        
        return jsonify({'message': 'Rascunho eliminado com sucesso'}), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao eliminar rascunho")


# =====================================================
# VALIDAÇÃO E CRIAÇÃO
# =====================================================

@wizard_plantas_bp.route('/plantas/validate', methods=['POST'])
def validate_step():
    """Valida dados de um step específico"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        step = data.get('step')
        form_data = data.get('data', {})
        
        result = PlantaService.validate_step(step, form_data)
        
        return jsonify(result), 200
        
    except Exception as e:
        return handle_error(e, "Erro na validação")


@wizard_plantas_bp.route('/plantas/create', methods=['POST'])
def create_planta():
    """Cria nova planta medicinal"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Validar campos obrigatórios
        if not data.get('nome_cientifico'):
            return jsonify({'error': 'Nome científico é obrigatório'}), 400
        
        if not data.get('familia'):
            return jsonify({'error': 'Família é obrigatória'}), 400
        
        if not data.get('referencias') or len(data.get('referencias', [])) == 0:
            return jsonify({'error': 'Pelo menos uma referência é obrigatória'}), 400
        
        # Criar planta
        planta = PlantaService.create_planta(data)
        
        # Eliminar rascunho se existir
        draft_id = data.get('draft_id')
        if draft_id and draft_id in plant_drafts:
            del plant_drafts[draft_id]
        
        return jsonify({
            'success': True,
            'planta': planta.to_dict(include_relations=True),
            'message': f'Planta "{planta.nome_cientifico}" criada com sucesso!'
        }), 201
        
    except Exception as e:
        return handle_error(e, "Erro ao criar planta")


# =====================================================
# CRIAÇÃO DE NOVAS ENTIDADES
# =====================================================

@wizard_plantas_bp.route('/referencias', methods=['POST'])
def create_referencia():
    """Cria nova referência com autores"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        referencia = PlantaService.create_referencia(data)
        
        return jsonify({
            'success': True,
            'referencia': referencia.to_dict(),
            'message': f'Referência "{referencia.titulo_referencia}" criada com sucesso!'
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return handle_error(e, "Erro ao criar referência")


@wizard_plantas_bp.route('/locais', methods=['POST'])
def create_local():
    """Cria novo local de colheita"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        nome_local = data.get('nome_local', '').strip()
        id_provincia = data.get('id_provincia')
        
        if not nome_local:
            return jsonify({'error': 'Nome do local é obrigatório'}), 400
        
        if not id_provincia:
            return jsonify({'error': 'Província é obrigatória'}), 400
        
        local = PlantaService.create_local_colheita(nome_local, id_provincia)
        
        return jsonify({
            'success': True,
            'local': local.to_dict(),
            'message': f'Local "{nome_local}" criado com sucesso!'
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return handle_error(e, "Erro ao criar local")


# =====================================================
# AUTOCOMPLETE E BUSCA
# =====================================================

@wizard_plantas_bp.route('/autocomplete/autores', methods=['GET'])
def autocomplete_autores():
    """Busca autores para autocomplete"""
    try:
        search = request.args.get('search', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        query = Autor.query
        if search:
            query = query.filter(Autor.nome_autor.ilike(f'%{search}%'))
        
        autores = query.order_by(Autor.nome_autor).limit(limit).all()
        return jsonify([a.to_dict() for a in autores]), 200
        
    except Exception as e:
        return handle_error(e, "Erro no autocomplete")


@wizard_plantas_bp.route('/autocomplete/referencias', methods=['GET'])
def autocomplete_referencias():
    """Busca referências para autocomplete"""
    try:
        search = request.args.get('search', '').strip()
        limit = request.args.get('limit', 10, type=int)
        
        query = Referencia.query
        if search:
            query = query.filter(
                db.or_(
                    Referencia.titulo_referencia.ilike(f'%{search}%'),
                    Referencia.link_referencia.ilike(f'%{search}%')
                )
            )
        
        referencias = query.order_by(
            Referencia.ano_publicacao.desc()
        ).limit(limit).all()
        
        return jsonify([r.to_dict() for r in referencias]), 200
        
    except Exception as e:
        return handle_error(e, "Erro no autocomplete")


@wizard_plantas_bp.route('/search/nome-cientifico', methods=['GET'])
def search_nome_cientifico():
    """Verifica se nome científico já existe"""
    try:
        nome = request.args.get('nome', '').strip()
        if not nome:
            return jsonify({'exists': False}), 200
        
        result = PlantaService.check_nome_cientifico_exists(nome)
        return jsonify(result), 200
        
    except Exception as e:
        return handle_error(e, "Erro na busca")


@wizard_plantas_bp.route('/plantas/similar', methods=['GET'])
def get_plantas_similares():
    """Busca plantas similares por família"""
    try:
        familia = request.args.get('familia', '').strip()
        if not familia:
            return jsonify([]), 200
        
        plantas = PlantaService.get_plantas_by_familia(familia)
        
        return jsonify([{
            'id_planta': p.id_planta,
            'nome_cientifico': p.nome_cientifico,
            'nomes_comuns': [nc.nome for nc in p.nomes_comuns[:2]],
            'total_partes': len(p.partes),
            'total_referencias': len(p.referencias)
        } for p in plantas]), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar plantas similares")


# =====================================================
# ESTATÍSTICAS E UTILITÁRIOS
# =====================================================

@wizard_plantas_bp.route('/stats', methods=['GET'])
def get_stats():
    """Retorna estatísticas do sistema"""
    try:
        clean_expired_drafts()
        
        stats = {
            'totais': {
                'plantas': PlantaMedicinal.query.count(),
                'provincias': Provincia.query.count(),
                'locais': LocalColheita.query.count(),
                'autores': Autor.query.count(),
                'referencias': Referencia.query.count(),
                'partes_usadas': ParteUsada.query.count(),
                'indicacoes': Indicacao.query.count()
            },
            'rascunhos_ativos': len(plant_drafts),
            'plantas_recentes': PlantaMedicinal.query.order_by(
                PlantaMedicinal.id_planta.desc()
            ).limit(5).count()
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return handle_error(e, "Erro ao obter estatísticas")


@wizard_plantas_bp.route('/health', methods=['GET'])
def health_check():
    """Health check do wizard"""
    try:
        # Testar conexão com BD
        db.session.execute(db.text('SELECT 1'))
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'Wizard de Plantas Medicinais',
            'database': 'connected',
            'total_drafts': len(plant_drafts)
        }), 200
        
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }), 500


@wizard_plantas_bp.route('/info', methods=['GET'])
def api_info():
    """Informações sobre a API do wizard"""
    return jsonify({
        'name': 'Wizard de Criação de Plantas Medicinais',
        'version': '1.0.0',
        'description': 'API integrada para criar plantas medicinais passo a passo',
        'endpoints': {
            'data': [
                'GET /api/wizard/data/provincias',
                'GET /api/wizard/data/locais',
                'GET /api/wizard/data/partes-usadas',
                'GET /api/wizard/data/indicacoes',
                'GET /api/wizard/data/metodos-preparacao',
                'GET /api/wizard/data/metodos-extracao'
            ],
            'drafts': [
                'POST /api/wizard/plantas/draft',
                'GET /api/wizard/plantas/draft/<id>',
                'DELETE /api/wizard/plantas/draft/<id>'
            ],
            'wizard': [
                'POST /api/wizard/plantas/validate',
                'POST /api/wizard/plantas/create'
            ],
            'entities': [
                'POST /api/wizard/referencias',
                'POST /api/wizard/locais'
            ],
            'search': [
                'GET /api/wizard/search/nome-cientifico',
                'GET /api/wizard/autocomplete/autores',
                'GET /api/wizard/autocomplete/referencias',
                'GET /api/wizard/plantas/similar'
            ],
            'utils': [
                'GET /api/wizard/stats',
                'GET /api/wizard/health',
                'GET /api/wizard/info'
            ]
        },
        'features': [
            'Wizard passo a passo (6 steps)',
            'Auto-save de rascunhos (24h)',
            'Validação rigorosa por step',
            'Upload e processamento de imagens',
            'Criação de referências com autores',
            'Autocomplete inteligente',
            'Prevenção de duplicatas'
        ],
        'steps': [
            '1. Informações Básicas (nome científico, família)',
            '2. Identificação (nomes comuns, locais)',
            '3. Usos Medicinais (partes, indicações, métodos)',
            '4. Composição Científica (química, farmacológica)',
            '5. Imagens (upload obrigatório)',
            '6. Referências (bibliográficas obrigatórias)'
        ]
    }), 200


# =====================================================
# TRATAMENTO DE ERROS
# =====================================================

@wizard_plantas_bp.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint não encontrado'}), 404


@wizard_plantas_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({'error': 'Método não permitido'}), 405


@wizard_plantas_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Erro interno do servidor'}), 500