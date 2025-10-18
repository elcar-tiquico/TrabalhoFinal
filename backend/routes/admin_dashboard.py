#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Admin Dashboard - TODOS OS ENDPOINTS do admin_dashboard_api.py
Adaptado para nextsql.sql e integrado com app.py existente
"""
from flask import Blueprint, jsonify, request, send_from_directory
from models.planta import db, Planta_medicinal, Nome_comum, Imagem
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.referencia import Autor, Referencia, Referencia_autor, Planta_referencia, Afiliacao
from models.uso_medicinal import (Indicacao, Parte_usada, Planta_parte, Parte_indicacao,
                                   Metodo_preparacao_trad, Metodo_extraccao_cientif)
from sqlalchemy import func, desc, or_, and_
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
import os
import uuid

admin_dashboard_bp = Blueprint('admin_dashboard', __name__, url_prefix='/api/admin')

# Configurações upload
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads', 'plantas_imagens')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ==================== DASHBOARD STATS ====================
@admin_dashboard_bp.route('/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Estatísticas principais - ADAPTADO"""
    try:
        total_plantas = Planta_medicinal.query.count()
        total_autores = Autor.query.count()
        total_referencias = Referencia.query.count()
        total_provincias = Provincia.query.count()
        total_indicacoes = Indicacao.query.count()
        total_nomes_comuns = Nome_comum.query.count()
        total_familias = db.session.query(func.count(func.distinct(Planta_medicinal.familia))).scalar()
        total_associacoes_local = Planta_local.query.count()
        
        return jsonify({
            'total_plantas': total_plantas,
            'total_familias': total_familias,
            'total_autores': total_autores,
            'total_provincias': total_provincias,
            'total_referencias': total_referencias,
            'total_indicacoes': total_indicacoes,
            'total_nomes_comuns': total_nomes_comuns,
            'total_associacoes_local': total_associacoes_local
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/dashboard/plantas-por-provincia', methods=['GET'])
def get_plantas_por_provincia():
    """Distribuição por província - NOVA QUERY"""
    try:
        resultados = db.session.query(
            Provincia.provincia,
            func.count(Planta_local.id_planta).label('total')
        ).join(Local_colheita).join(Planta_local).group_by(Provincia.provincia).order_by(desc('total')).all()
        return jsonify([{'provincia': r.provincia, 'total': r.total} for r in resultados]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/dashboard/top-familias', methods=['GET'])
def get_top_familias():
    """Top famílias - ADAPTADO (familia agora é campo texto)"""
    try:
        limit = request.args.get('limit', 8, type=int)
        resultados = db.session.query(
            Planta_medicinal.familia,
            func.count(Planta_medicinal.id_planta).label('total')
        ).group_by(Planta_medicinal.familia).order_by(desc('total')).limit(limit).all()
        return jsonify([{'familia': r.familia, 'total': r.total} for r in resultados]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== CRUD PLANTAS ====================
@admin_dashboard_bp.route('/plantas', methods=['GET'])
def get_plantas():
    """Listar plantas com paginação"""
    try:
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '')
        familia = request.args.get('familia', '')
        
        query = Planta_medicinal.query
        
        if search:
            query = query.filter(or_(
                Planta_medicinal.nome_cientifico.ilike(f'%{search}%'),
                Planta_medicinal.familia.ilike(f'%{search}%')
            ))
        
        if familia:
            query = query.filter(Planta_medicinal.familia.ilike(f'%{familia}%'))
        
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        plantas = []
        for p in pagination.items:
            planta_dict = p.to_dict()
            planta_dict['nomes_comuns'] = [nc.nome for nc in p.nomes_comuns]
            plantas.append(planta_dict)
        
        return jsonify({
            'plantas': plantas,
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/plantas/<int:planta_id>', methods=['GET'])
def get_planta_detalhes(planta_id):
    """Detalhes completos de uma planta"""
    try:
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        planta_dict = planta.to_dict()
        planta_dict['nomes_comuns'] = [{'id_nome': nc.id_nome, 'nome': nc.nome} for nc in planta.nomes_comuns]
        planta_dict['imagens'] = [img.to_dict() for img in planta.imagens]
        
        # Locais e províncias
        locais = db.session.query(
            Local_colheita.nome_local, Provincia.provincia
        ).join(Planta_local).join(Provincia).filter(Planta_local.id_planta == planta_id).all()
        planta_dict['locais'] = [{'nome_local': l.nome_local, 'provincia': l.provincia} for l in locais]
        
        return jsonify(planta_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/plantas', methods=['POST'])
def create_planta():
    """Criar nova planta"""
    try:
        data = request.get_json()
        nova_planta = Planta_medicinal(
            nome_cientifico=data['nome_cientifico'],
            familia=data['familia'],
            infos_adicionais=data.get('infos_adicionais'),
            comp_quimica=data.get('comp_quimica'),
            prop_farmacologica=data.get('prop_farmacologica')
        )
        db.session.add(nova_planta)
        db.session.commit()
        return jsonify({'message': 'Planta criada', 'planta': nova_planta.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/plantas/<int:planta_id>', methods=['PUT'])
def update_planta(planta_id):
    """Atualizar planta"""
    try:
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        data = request.get_json()
        for key, value in data.items():
            if hasattr(planta, key):
                setattr(planta, key, value)
        
        db.session.commit()
        return jsonify({'message': 'Planta atualizada', 'planta': planta.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/plantas/<int:planta_id>', methods=['DELETE'])
def delete_planta(planta_id):
    """Deletar planta"""
    try:
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        db.session.delete(planta)
        db.session.commit()
        return jsonify({'message': 'Planta deletada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# ==================== BUSCA ====================
@admin_dashboard_bp.route('/dashboard/busca', methods=['GET'])
def busca_integrada():
    """Busca integrada"""
    try:
        q = request.args.get('q', '').strip()
        tipo = request.args.get('tipo', 'todos')
        limit = request.args.get('limit', 10, type=int)
        
        if not q:
            return jsonify({'plantas': [], 'familias': [], 'autores': []}), 200
        
        search_term = f'%{q}%'
        result = {'plantas': [], 'familias': [], 'autores': []}
        
        if tipo in ['plantas', 'todos']:
            plantas = Planta_medicinal.query.filter(
                Planta_medicinal.nome_cientifico.ilike(search_term)
            ).limit(limit).all()
            result['plantas'] = [{'id_planta': p.id_planta, 'nome_cientifico': p.nome_cientifico, 'familia': p.familia} for p in plantas]
        
        if tipo in ['familias', 'todos']:
            familias = db.session.query(
                Planta_medicinal.familia, func.count(Planta_medicinal.id_planta).label('total')
            ).filter(Planta_medicinal.familia.ilike(search_term)).group_by(Planta_medicinal.familia).limit(limit).all()
            result['familias'] = [{'familia': f.familia, 'total': f.total} for f in familias]
        
        if tipo in ['autores', 'todos']:
            autores = Autor.query.filter(Autor.nome_autor.ilike(search_term)).limit(limit).all()
            result['autores'] = [{'id_autor': a.id_autor, 'nome_autor': a.nome_autor} for a in autores]
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== AUXILIARES ====================
@admin_dashboard_bp.route('/provincias', methods=['GET'])
def get_provincias():
    """Listar províncias"""
    try:
        provincias = Provincia.query.order_by(Provincia.provincia).all()
        return jsonify({'provincias': [p.to_dict() for p in provincias]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/partes-usadas', methods=['GET'])
def get_partes_usadas():
    """Listar partes usadas"""
    try:
        partes = Parte_usada.query.order_by(Parte_usada.nome_parte).all()
        return jsonify({'partes_usadas': [p.to_dict() for p in partes]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/indicacoes', methods=['GET'])
def get_indicacoes():
    """Listar indicações"""
    try:
        indicacoes = Indicacao.query.order_by(Indicacao.descricao_uso).all()
        return jsonify({'indicacoes': [i.to_dict() for i in indicacoes]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== IMAGENS ====================
@admin_dashboard_bp.route('/plantas/<int:planta_id>/imagens', methods=['POST'])
def upload_imagem(planta_id):
    """Upload de imagem"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo'}), 400
        
        file = request.files['file']
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
        
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        # Salvar arquivo
        planta_folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        os.makedirs(planta_folder, exist_ok=True)
        
        filename = secure_filename(f"{uuid.uuid4().hex}.{file.filename.rsplit('.', 1)[1].lower()}")
        filepath = os.path.join(planta_folder, filename)
        file.save(filepath)
        
        # Redimensionar
        with PILImage.open(filepath) as img:
            img.thumbnail((800, 800), PILImage.Resampling.LANCZOS)
            img.save(filepath, optimize=True, quality=85)
        
        # Criar registro
        url_armazenamento = f"/uploads/plantas_imagens/{planta_id}/{filename}"
        nova_imagem = Imagem(
            nome_arquivo=filename,
            url_armazenamento=url_armazenamento,
            legenda=request.form.get('legenda'),
            referencia_img=request.form.get('referencia_img'),
            id_planta=planta_id
        )
        db.session.add(nova_imagem)
        db.session.commit()
        
        return jsonify({'message': 'Imagem enviada', 'imagem': nova_imagem.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/plantas/<int:planta_id>/imagens/<int:imagem_id>', methods=['DELETE'])
def delete_imagem(planta_id, imagem_id):
    """Deletar imagem"""
    try:
        imagem = Imagem.query.get(imagem_id)
        if not imagem:
            return jsonify({'error': 'Imagem não encontrada'}), 404
        
        filepath = os.path.join(UPLOAD_FOLDER, str(planta_id), imagem.nome_arquivo)
        if os.path.exists(filepath):
            os.remove(filepath)
        
        db.session.delete(imagem)
        db.session.commit()
        return jsonify({'message': 'Imagem deletada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@admin_dashboard_bp.route('/uploads/plantas_imagens/<int:planta_id>/<filename>')
def serve_image(planta_id, filename):
    """Servir imagem"""
    try:
        planta_folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        return send_from_directory(planta_folder, filename)
    except:
        return jsonify({'error': 'Imagem não encontrada'}), 404


# ==================== DASHBOARD - ESTATÍSTICAS DE REFERÊNCIAS ====================
@admin_dashboard_bp.route('/dashboard/referencias-stats', methods=['GET'])
def get_referencias_stats():
    """Estatísticas de referências para o dashboard"""
    try:
        # Contagens gerais
        total_referencias = Referencia.query.count()
        
        # Referências com plantas associadas
        referencias_com_plantas = db.session.query(
            func.count(func.distinct(Referencia.id_referencia))
        ).join(Planta_referencia).scalar() or 0
        
        # Referências sem ano
        referencias_sem_ano = Referencia.query.filter(
            Referencia.ano_publicacao.is_(None)
        ).count()
        
        # Distribuição por tipo (baseado no link)
        todas_refs = Referencia.query.all()
        tipos_dict = {}
        
        for ref in todas_refs:
            if ref.link_referencia:
                if 'doi.org' in ref.link_referencia.lower():
                    tipo = 'Artigo'
                elif 'http://' in ref.link_referencia or 'https://' in ref.link_referencia:
                    tipo = 'URL'
                else:
                    tipo = 'Outro'
            else:
                tipo = 'Outro'
            
            tipos_dict[tipo] = tipos_dict.get(tipo, 0) + 1
        
        tipos_resultado = [{'tipo': k, 'count': v} for k, v in tipos_dict.items()]
        
        # Distribuição por ano
        stats_por_ano = db.session.query(
            Referencia.ano_publicacao.label('ano'),
            func.count(Referencia.id_referencia).label('count')
        ).filter(
            Referencia.ano_publicacao.isnot(None)
        ).group_by(
            Referencia.ano_publicacao
        ).order_by(
            Referencia.ano_publicacao.desc()
        ).limit(10).all()
        
        # Referências mais utilizadas
        refs_mais_utilizadas = db.session.query(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao,
            func.count(Planta_referencia.id_planta).label('total_plantas')
        ).join(Planta_referencia).group_by(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao
        ).order_by(
            desc(func.count(Planta_referencia.id_planta))
        ).limit(10).all()
        
        mais_utilizadas = []
        for ref in refs_mais_utilizadas:
            if ref.link_referencia and 'doi.org' in ref.link_referencia.lower():
                tipo = 'Artigo'
            elif ref.link_referencia and ('http://' in ref.link_referencia or 'https://' in ref.link_referencia):
                tipo = 'URL'
            else:
                tipo = 'Outro'
            
            mais_utilizadas.append({
                'id': ref.id_referencia,
                'titulo': ref.titulo_referencia or 'Sem título',
                'tipo': tipo,
                'ano': str(ref.ano_publicacao) if ref.ano_publicacao else None,
                'total_plantas': ref.total_plantas
            })
        
        return jsonify({
            'total_referencias': total_referencias,
            'referencias_com_plantas': referencias_com_plantas,
            'referencias_sem_ano': referencias_sem_ano,
            'tipos': tipos_resultado,
            'por_ano': [
                {
                    'ano': str(stat.ano) if stat.ano else 'Sem ano',
                    'count': stat.count
                } for stat in stats_por_ano
            ],
            'mais_utilizadas': mais_utilizadas
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== DASHBOARD - ESTATÍSTICAS DE AUTORES ====================
@admin_dashboard_bp.route('/dashboard/autores-stats', methods=['GET'])
def get_autores_stats():
    """Estatísticas de autores para o dashboard"""
    try:
        # Contagens gerais
        total_autores = Autor.query.count()
        
        # Autores com plantas (via referências)
        autores_com_plantas = db.session.query(
            func.count(func.distinct(Autor.id_autor))
        ).join(Referencia_autor).join(Referencia).join(Planta_referencia).scalar() or 0
        
        # Autores sem afiliação
        autores_sem_afiliacao = db.session.query(
            func.count(func.distinct(Autor.id_autor))
        ).outerjoin(Autor.afiliacoes_relacao).filter(
            Autor.afiliacoes_relacao == None
        ).scalar() or 0
        
        # Total de afiliações
        total_afiliacoes = Afiliacao.query.count()
        
        # Autores mais produtivos
        autores_produtivos = db.session.query(
            Autor.id_autor,
            Autor.nome_autor,
            func.group_concat(Afiliacao.nome_afiliacao.distinct()).label('afiliacao'),
            func.group_concat(Afiliacao.sigla_afiliacao.distinct()).label('sigla'),
            func.count(func.distinct(Planta_referencia.id_planta)).label('total_plantas')
        ).join(
            Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
        ).join(
            Referencia, Referencia_autor.id_referencia == Referencia.id_referencia
        ).join(
            Planta_referencia, Referencia.id_referencia == Planta_referencia.id_referencia
        ).outerjoin(
            Autor.afiliacoes_relacao
        ).outerjoin(
            Afiliacao
        ).group_by(
            Autor.id_autor,
            Autor.nome_autor
        ).order_by(
            desc(func.count(func.distinct(Planta_referencia.id_planta)))
        ).limit(10).all()
        
        # Distribuição por afiliação
        stats_por_afiliacao = db.session.query(
            Afiliacao.nome_afiliacao.label('afiliacao'),
            func.count(func.distinct(Autor.id_autor)).label('total_autores'),
            func.count(func.distinct(Planta_referencia.id_planta)).label('total_plantas')
        ).join(
            Autor.afiliacoes_relacao
        ).join(
            Autor
        ).outerjoin(
            Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
        ).outerjoin(
            Referencia, Referencia_autor.id_referencia == Referencia.id_referencia
        ).outerjoin(
            Planta_referencia, Referencia.id_referencia == Planta_referencia.id_referencia
        ).filter(
            Afiliacao.nome_afiliacao.isnot(None)
        ).group_by(
            Afiliacao.nome_afiliacao
        ).order_by(
            desc(func.count(func.distinct(Planta_referencia.id_planta)))
        ).limit(10).all()
        
        return jsonify({
            'total_autores': total_autores,
            'autores_com_plantas': autores_com_plantas,
            'autores_sem_afiliacao': autores_sem_afiliacao,
            'total_afiliacoes': total_afiliacoes,
            'mais_produtivos': [
                {
                    'id': autor.id_autor,
                    'nome': autor.nome_autor,
                    'afiliacao': autor.afiliacao.split(',')[0] if autor.afiliacao else 'Sem afiliação',
                    'sigla': autor.sigla.split(',')[0] if autor.sigla else '',
                    'total_plantas': autor.total_plantas
                } for autor in autores_produtivos
            ],
            'por_afiliacao': [
                {
                    'afiliacao': stat.afiliacao,
                    'total_autores': stat.total_autores,
                    'total_plantas': stat.total_plantas or 0
                } for stat in stats_por_afiliacao
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== DASHBOARD - REFERÊNCIAS RECENTES ====================
@admin_dashboard_bp.route('/dashboard/referencias-recentes', methods=['GET'])
def get_referencias_recentes():
    """Referências recentes para o dashboard"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        referencias = db.session.query(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao,
            func.count(Planta_referencia.id_planta).label('total_plantas')
        ).outerjoin(Planta_referencia).group_by(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao
        ).order_by(
            desc(Referencia.id_referencia)
        ).limit(limit).all()
        
        referencias_resultado = []
        for ref in referencias:
            # Buscar autores
            autores = db.session.query(
                Autor.nome_autor
            ).join(
                Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
            ).filter(
                Referencia_autor.id_referencia == ref.id_referencia
            ).all()
            
            lista_autores = [autor.nome_autor for autor in autores]
            
            # Determinar tipo
            if ref.link_referencia and 'doi.org' in ref.link_referencia.lower():
                tipo = 'Artigo'
            elif ref.link_referencia and ('http://' in ref.link_referencia or 'https://' in ref.link_referencia):
                tipo = 'URL'
            else:
                tipo = 'Outro'
            
            referencias_resultado.append({
                'id': ref.id_referencia,
                'titulo': ref.titulo_referencia or 'Sem título',
                'tipo': tipo,
                'ano': str(ref.ano_publicacao) if ref.ano_publicacao else None,
                'link': ref.link_referencia,
                'total_plantas': ref.total_plantas or 0,
                'autores': lista_autores
            })
        
        return jsonify({
            'referencias_recentes': referencias_resultado,
            'total': len(referencias_resultado)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== DASHBOARD - AUTORES RECENTES ====================
@admin_dashboard_bp.route('/dashboard/autores-recentes', methods=['GET'])
def get_autores_recentes():
    """Autores recentes para o dashboard"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        autores = db.session.query(
            Autor.id_autor,
            Autor.nome_autor,
            func.group_concat(Afiliacao.nome_afiliacao.distinct()).label('afiliacao'),
            func.group_concat(Afiliacao.sigla_afiliacao.distinct()).label('sigla'),
            func.count(func.distinct(Planta_referencia.id_planta)).label('total_plantas'),
            func.count(func.distinct(Referencia.id_referencia)).label('total_referencias')
        ).outerjoin(
            Autor.afiliacoes_relacao
        ).outerjoin(
            Afiliacao
        ).outerjoin(
            Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
        ).outerjoin(
            Referencia, Referencia_autor.id_referencia == Referencia.id_referencia
        ).outerjoin(
            Planta_referencia, Referencia.id_referencia == Planta_referencia.id_referencia
        ).group_by(
            Autor.id_autor,
            Autor.nome_autor
        ).order_by(
            desc(Autor.id_autor)
        ).limit(limit).all()
        
        autores_resultado = []
        for autor in autores:
            autores_resultado.append({
                'id': autor.id_autor,
                'nome': autor.nome_autor or 'Nome não informado',
                'afiliacao': autor.afiliacao.split(',')[0] if autor.afiliacao else 'Sem afiliação',
                'sigla': autor.sigla.split(',')[0] if autor.sigla else '',
                'total_plantas': autor.total_plantas or 0,
                'total_referencias': autor.total_referencias or 0
            })
        
        return jsonify({
            'autores_recentes': autores_resultado,
            'total': len(autores_resultado)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================
@admin_dashboard_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'admin_dashboard', 'database': 'db_plantas_medicinais'}), 200