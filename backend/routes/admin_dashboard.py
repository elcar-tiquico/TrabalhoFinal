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

# ==================== HEALTH CHECK ====================
@admin_dashboard_bp.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'admin_dashboard', 'database': 'db_plantas_medicinais'}), 200