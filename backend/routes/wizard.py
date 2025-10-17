#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas do Wizard de Criação de Plantas - ADAPTADO À NOVA BD
Porta: Integrado na API principal (5000)
MUDANÇAS CRÍTICAS:
- Família agora é campo TEXT (não FK)
- Províncias via Local_colheita (não direto)
- Composição/Propriedades em campos TEXT (não tabelas)
"""

from flask import Blueprint, request, jsonify
from models.planta import db, Planta_medicinal, Nome_comum, Imagem
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.uso_medicinal import (
    Parte_usada, Indicacao, Planta_parte, Parte_indicacao,
    Metodo_preparacao_trad, Metodo_extraccao_cientif
)
from models.referencia import Autor, Afiliacao, Referencia, Referencia_autor, Planta_referencia
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, distinct
from datetime import datetime, timedelta
import uuid
import os
import base64
from PIL import Image as PILImage
from io import BytesIO
from config import Config
import json

wizard_bp = Blueprint('wizard', __name__)

# =====================================================
# ARMAZENAMENTO TEMPORÁRIO DE RASCUNHOS
# =====================================================
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

def handle_error(e, message="Erro ao processar requisição"):
    """Tratamento de erros padronizado"""
    print(f"❌ Erro: {e}")
    return jsonify({'error': message, 'details': str(e)}), 500

# =====================================================
# ROTAS DE DADOS AUXILIARES (SELECT OPTIONS)
# =====================================================

@wizard_bp.route('/data/familias', methods=['GET'])
def get_familias_wizard():
    """
    Buscar famílias DISTINTAS
    ✅ ADAPTADO: agora busca do campo TEXT, não de tabela separada
    """
    try:
        # Buscar famílias distintas que já existem
        familias_query = db.session.query(
            distinct(Planta_medicinal.familia)
        ).filter(
            Planta_medicinal.familia.isnot(None),
            Planta_medicinal.familia != ''
        ).order_by(Planta_medicinal.familia).all()
        
        familias = [
            {
                'id': idx + 1,
                'nome_familia': familia[0],
                'label': familia[0],
                'value': familia[0]
            }
            for idx, familia in enumerate(familias_query)
        ]
        
        return jsonify(familias)
    except Exception as e:
        return handle_error(e, "Erro ao buscar famílias")

@wizard_bp.route('/data/provincias', methods=['GET'])
def get_provincias_wizard():
    """Buscar todas as províncias"""
    try:
        provincias = Provincia.query.order_by(Provincia.provincia).all()
        return jsonify([p.to_dict() for p in provincias])
    except Exception as e:
        return handle_error(e, "Erro ao buscar províncias")

@wizard_bp.route('/data/locais', methods=['GET'])
def get_locais_wizard():
    """
    Buscar locais de colheita
    ✅ NOVO: necessário para a nova estrutura
    """
    try:
        provincia_id = request.args.get('provincia_id', type=int)
        
        query = Local_colheita.query
        if provincia_id:
            query = query.filter_by(id_provincia=provincia_id)
        
        locais = query.order_by(Local_colheita.nome_local).all()
        return jsonify([local.to_dict() for local in locais])
    except Exception as e:
        return handle_error(e, "Erro ao buscar locais")

@wizard_bp.route('/data/partes-usadas', methods=['GET'])
def get_partes_usadas_wizard():
    """Buscar partes usadas"""
    try:
        partes = Parte_usada.query.order_by(Parte_usada.nome_parte).all()
        return jsonify([p.to_dict() for p in partes])
    except Exception as e:
        return handle_error(e, "Erro ao buscar partes usadas")

@wizard_bp.route('/data/indicacoes', methods=['GET'])
def get_indicacoes_wizard():
    """Buscar indicações terapêuticas"""
    try:
        indicacoes = Indicacao.query.order_by(Indicacao.descricao_uso).all()
        return jsonify([i.to_dict() for i in indicacoes])
    except Exception as e:
        return handle_error(e, "Erro ao buscar indicações")

@wizard_bp.route('/data/metodos-preparacao', methods=['GET'])
def get_metodos_preparacao_wizard():
    """Buscar métodos de preparação tradicional"""
    try:
        metodos = Metodo_preparacao_trad.query.order_by(
            Metodo_preparacao_trad.descricao_metodo_preparacao
        ).all()
        return jsonify([
            {
                'id_preparacao': m.id_metodo_preparacao,
                'descricao': m.descricao_metodo_preparacao,
                'label': m.descricao_metodo_preparacao,
                'value': m.id_metodo_preparacao
            }
            for m in metodos
        ])
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos de preparação")

@wizard_bp.route('/data/metodos-extracao', methods=['GET'])
def get_metodos_extracao_wizard():
    """Buscar métodos de extração científica"""
    try:
        metodos = Metodo_extraccao_cientif.query.order_by(
            Metodo_extraccao_cientif.descricao_metodo_extraccao
        ).all()
        return jsonify([
            {
                'id_extraccao': m.id_metodo_extraccao,
                'descricao': m.descricao_metodo_extraccao,
                'label': m.descricao_metodo_extraccao,
                'value': m.id_metodo_extraccao
            }
            for m in metodos
        ])
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos de extração")

@wizard_bp.route('/data/autores', methods=['GET'])
def get_autores_wizard():
    """Buscar autores"""
    try:
        autores = Autor.query.order_by(Autor.nome_autor).all()
        return jsonify([a.to_dict() for a in autores])
    except Exception as e:
        return handle_error(e, "Erro ao buscar autores")

@wizard_bp.route('/data/referencias', methods=['GET'])
def get_referencias_wizard():
    """Buscar referências bibliográficas"""
    try:
        referencias = Referencia.query.order_by(
            Referencia.ano_publicacao.desc(),
            Referencia.titulo_referencia
        ).all()
        
        return jsonify([
            {
                'id_referencia': r.id_referencia,
                'titulo': r.titulo_referencia,
                'ano': r.ano_publicacao,
                'link': r.link_referencia,
                'autores': [
                    {'id_autor': ra.autor.id_autor, 'nome_autor': ra.autor.nome_autor}
                    for ra in r.autores_relacao
                ],
                'label': f"{r.titulo_referencia} ({r.ano_publicacao})",
                'value': r.id_referencia
            }
            for r in referencias
        ])
    except Exception as e:
        return handle_error(e, "Erro ao buscar referências")

# =====================================================
# RASCUNHOS (DRAFTS)
# =====================================================

@wizard_bp.route('/draft/save', methods=['POST'])
def save_draft():
    """Salvar rascunho do wizard"""
    try:
        clean_expired_drafts()
        
        data = request.get_json()
        draft_id = data.get('draft_id', str(uuid.uuid4()))
        
        plant_drafts[draft_id] = {
            'data': data.get('form_data', {}),
            'current_step': data.get('current_step', 1),
            'expires_at': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        return jsonify({
            'draft_id': draft_id,
            'message': 'Rascunho salvo com sucesso',
            'expires_at': plant_drafts[draft_id]['expires_at']
        })
    except Exception as e:
        return handle_error(e, "Erro ao salvar rascunho")

@wizard_bp.route('/draft/<draft_id>', methods=['GET'])
def get_draft(draft_id):
    """Recuperar rascunho"""
    try:
        clean_expired_drafts()
        
        if draft_id not in plant_drafts:
            return jsonify({'error': 'Rascunho não encontrado ou expirado'}), 404
        
        return jsonify({
            'draft_id': draft_id,
            'data': plant_drafts[draft_id]['data'],
            'current_step': plant_drafts[draft_id]['current_step'],
            'expires_at': plant_drafts[draft_id]['expires_at']
        })
    except Exception as e:
        return handle_error(e, "Erro ao recuperar rascunho")

@wizard_bp.route('/draft/<draft_id>', methods=['DELETE'])
def delete_draft(draft_id):
    """Deletar rascunho"""
    try:
        if draft_id in plant_drafts:
            del plant_drafts[draft_id]
            return jsonify({'message': 'Rascunho removido com sucesso'})
        return jsonify({'error': 'Rascunho não encontrado'}), 404
    except Exception as e:
        return handle_error(e, "Erro ao deletar rascunho")

# =====================================================
# VALIDAÇÃO DE STEPS
# =====================================================

@wizard_bp.route('/validate/step', methods=['POST'])
def validate_step():
    """
    Validar dados de um step específico
    ✅ ADAPTADO: validações para nova estrutura
    """
    try:
        data = request.get_json()
        step = data.get('step')
        form_data = data.get('form_data', {})
        
        errors = {}
        warnings = []
        
        # Step 1: Informações Básicas
        if step == 1:
            # ✅ MUDOU: familia agora é texto obrigatório
            if not form_data.get('familia') or not form_data['familia'].strip():
                errors['familia'] = 'Família é obrigatória'
            
            if not form_data.get('nome_cientifico') or not form_data['nome_cientifico'].strip():
                errors['nome_cientifico'] = 'Nome científico é obrigatório'
            else:
                # Verificar duplicidade
                existing = Planta_medicinal.query.filter_by(
                    nome_cientifico=form_data['nome_cientifico']
                ).first()
                if existing:
                    errors['nome_cientifico'] = 'Planta com este nome científico já existe'
        
        # Step 2: Identificação e Localização
        elif step == 2:
            nomes_comuns = form_data.get('nomes_comuns', [])
            nomes_validos = [nome.strip() for nome in nomes_comuns if nome and nome.strip()]
            if len(nomes_validos) == 0:
                errors['nomes_comuns'] = 'Pelo menos um nome comum é obrigatório'
            
            # ✅ MUDOU: agora valida locais ao invés de províncias
            locais = form_data.get('locais', [])
            if len(locais) == 0:
                errors['locais'] = 'Pelo menos um local de colheita deve ser selecionado'
        
        # Step 3: Usos Medicinais
        elif step == 3:
            partes = form_data.get('partes_usadas', [])
            if len(partes) == 0:
                errors['partes_usadas'] = 'Pelo menos uma parte usada deve ser adicionada'
            else:
                for i, parte in enumerate(partes):
                    if not parte.get('id_parte'):
                        errors[f'partes_usadas[{i}].id_parte'] = 'Parte da planta é obrigatória'
                    if not parte.get('indicacoes') or len(parte.get('indicacoes', [])) == 0:
                        errors[f'partes_usadas[{i}].indicacoes'] = 'Pelo menos uma indicação é necessária'
        
        # Step 4: Composição Científica
        elif step == 4:
            # ✅ Opcional agora
            comp_quimica = form_data.get('comp_quimica', '')
            prop_farmacologica = form_data.get('prop_farmacologica', '')
            
            if not comp_quimica and not prop_farmacologica:
                warnings.append('Considere adicionar informações sobre composição química ou propriedades farmacológicas')
        
        # Step 5: Imagens
        elif step == 5:
            imagens = form_data.get('imagens', [])
            if len(imagens) == 0:
                errors['imagens'] = 'Pelo menos uma imagem da planta é obrigatória'
        
        # Step 6: Referências
        elif step == 6:
            referencias = form_data.get('referencias', [])
            if len(referencias) == 0:
                errors['referencias'] = 'Pelo menos uma referência bibliográfica é obrigatória'
        
        # Retornar resultado da validação
        is_valid = len(errors) == 0
        return jsonify({
            'valid': is_valid,
            'errors': errors,
            'warnings': warnings
        }), 200 if is_valid else 400
        
    except Exception as e:
        return handle_error(e, "Erro ao validar step")

# =====================================================
# CRIAR PLANTA COMPLETA
# =====================================================

@wizard_bp.route('/plantas', methods=['POST'])
def create_planta_wizard():
    """
    Criar planta completa com todos os relacionamentos
    ✅ TOTALMENTE ADAPTADO para nova estrutura BD
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        print(f"🌿 Iniciando criação de planta: {data.get('nome_cientifico')}")
        
        # ============================================
        # 1. CRIAR PLANTA PRINCIPAL
        # ============================================
        planta = Planta_medicinal(
            nome_cientifico=data['nome_cientifico'],
            familia=data['familia'],  # ✅ Agora é campo texto direto!
            infos_adicionais=data.get('infos_adicionais'),
            comp_quimica=data.get('comp_quimica'),  # ✅ Campo TEXT
            prop_farmacologica=data.get('prop_farmacologica')  # ✅ Campo TEXT
        )
        
        db.session.add(planta)
        db.session.flush()
        
        print(f"✅ Planta criada com ID: {planta.id_planta}")
        
        # ============================================
        # 2. ADICIONAR NOMES COMUNS
        # ============================================
        for nome_comum in data.get('nomes_comuns', []):
            if nome_comum and nome_comum.strip():
                nome = Nome_comum(
                    nome=nome_comum.strip(),
                    id_planta=planta.id_planta
                )
                db.session.add(nome)
        
        print(f"✅ Nomes comuns adicionados: {len(data.get('nomes_comuns', []))}")
        
        # ============================================
        # 3. ADICIONAR LOCAIS DE COLHEITA
        # ✅ NOVA ESTRUTURA: Planta → Planta_local → Local_colheita
        # ============================================
        for id_local in data.get('locais', []):
            local = Local_colheita.query.get(id_local)
            if local:
                planta_local = Planta_local(
                    id_planta=planta.id_planta,
                    id_local=id_local
                )
                db.session.add(planta_local)
        
        print(f"✅ Locais de colheita vinculados: {len(data.get('locais', []))}")
        
        # ============================================
        # 4. ADICIONAR PARTES USADAS E INDICAÇÕES
        # ✅ NOVA ESTRUTURA: Planta → Planta_parte → Parte → Parte_indicacao → Indicação
        # ============================================
        for parte_data in data.get('partes_usadas', []):
            id_parte = parte_data.get('id_parte')
            if not id_parte:
                continue
            
            # Vincular parte à planta
            planta_parte = Planta_parte(
                id_planta=planta.id_planta,
                id_parte=id_parte
            )
            db.session.add(planta_parte)
            
            # Adicionar indicações para esta parte
            for id_indicacao in parte_data.get('indicacoes', []):
                # Verificar se já existe a relação Parte_indicacao
                existing = Parte_indicacao.query.filter_by(
                    id_parte=id_parte,
                    id_uso=id_indicacao
                ).first()
                
                if not existing:
                    parte_indicacao = Parte_indicacao(
                        id_parte=id_parte,
                        id_uso=id_indicacao
                    )
                    db.session.add(parte_indicacao)
        
        print(f"✅ Partes usadas e indicações vinculadas: {len(data.get('partes_usadas', []))}")
        
        # ============================================
        # 5. ADICIONAR REFERÊNCIAS E AUTORES
        # ✅ MANTIDO: lógica de autores via referências
        # ============================================
        autores_das_referencias = set()
        
        for id_referencia in data.get('referencias', []):
            # Suporte para formato dict ou int
            if isinstance(id_referencia, dict):
                ref_id = id_referencia.get('id')
            else:
                ref_id = id_referencia
            
            if ref_id:
                referencia = Referencia.query.get(ref_id)
                if referencia:
                    # Vincular referência à planta
                    planta_ref = Planta_referencia(
                        id_planta=planta.id_planta,
                        id_referencia=ref_id
                    )
                    db.session.add(planta_ref)
                    
                    # Coletar autores desta referência
                    for autor_ref in referencia.autores_relacao:
                        autores_das_referencias.add(autor_ref.autor)
        
        print(f"✅ Referências vinculadas: {len(data.get('referencias', []))}")
        print(f"✅ Autores coletados das referências: {len(autores_das_referencias)}")
        
        # ============================================
        # 6. PROCESSAR IMAGENS
        # ============================================
        imagens_data = data.get('imagens', [])
        if imagens_data:
            print(f"🖼️ Processando {len(imagens_data)} imagens...")
            
            try:
                # Criar diretório para imagens da planta
                planta_folder = os.path.join(Config.UPLOAD_FOLDER, str(planta.id_planta))
                os.makedirs(planta_folder, exist_ok=True)
                
                for ordem, imagem_info in enumerate(imagens_data, 1):
                    try:
                        # Extrair dados da imagem
                        file_data = imagem_info.get('file_data', '')
                        file_extension = imagem_info.get('file_extension', 'jpg')
                        legenda = imagem_info.get('legenda', '')
                        
                        if not file_data:
                            continue
                        
                        # Gerar nome único para o arquivo
                        filename = f"{uuid.uuid4().hex}.{file_extension}"
                        filepath = os.path.join(planta_folder, filename)
                        
                        # Decodificar base64 e salvar
                        if ',' in file_data:
                            file_data = file_data.split(',')[1]
                        
                        image_bytes = base64.b64decode(file_data)
                        
                        # Processar imagem com PIL (validar/otimizar)
                        img = PILImage.open(BytesIO(image_bytes))
                        
                        # Converter RGBA para RGB se necessário
                        if img.mode == 'RGBA':
                            img = img.convert('RGB')
                        
                        # Salvar imagem
                        img.save(filepath, quality=85, optimize=True)
                        
                        # Criar registro no BD
                        imagem = Imagem(
                            id_planta=planta.id_planta,
                            nome_arquivo=filename,
                            url_armazenamento=f'/uploads/plantas_imagens/{planta.id_planta}/{filename}',
                            legenda=legenda,
                            referencia_img=None
                        )
                        db.session.add(imagem)
                        
                        print(f"  ✅ Imagem {ordem} salva: {filename}")
                        
                    except Exception as img_error:
                        print(f"  ⚠️ Erro ao processar imagem {ordem}: {img_error}")
                        continue
                
            except Exception as e:
                print(f"❌ Erro ao processar imagens: {e}")
        
        # ============================================
        # 7. COMMIT FINAL
        # ============================================
        db.session.commit()
        
        print(f"🎉 Planta criada com sucesso! ID: {planta.id_planta}")
        
        return jsonify({
            'message': 'Planta criada com sucesso!',
            'id_planta': planta.id_planta,
            'nome_cientifico': planta.nome_cientifico,
            'familia': planta.familia,
            'total_nomes_comuns': len(data.get('nomes_comuns', [])),
            'total_locais': len(data.get('locais', [])),
            'total_partes': len(data.get('partes_usadas', [])),
            'total_referencias': len(data.get('referencias', [])),
            'total_imagens': len(imagens_data)
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        print(f"❌ Erro de integridade: {e}")
        
        if 'Duplicate entry' in str(e):
            return jsonify({
                'error': 'Planta com este nome científico já existe',
                'details': str(e)
            }), 400
        
        return jsonify({
            'error': 'Erro de integridade no banco de dados',
            'details': str(e)
        }), 400
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro geral: {e}")
        return handle_error(e, "Erro ao criar planta")

# =====================================================
# HEALTH CHECK DO WIZARD
# =====================================================

@wizard_bp.route('/health', methods=['GET'])
def wizard_health():
    """Verificar se wizard está funcionando"""
    return jsonify({
        'status': 'ok',
        'message': 'Wizard API funcionando',
        'active_drafts': len(plant_drafts),
        'endpoints': {
            'data': '/api/wizard/data/*',
            'draft': '/api/wizard/draft/*',
            'validate': '/api/wizard/validate/step',
            'create': '/api/wizard/plantas'
        }
    })