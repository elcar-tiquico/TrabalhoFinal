#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Upload/Gestão de Imagens
"""
from flask import Blueprint, jsonify, request, send_from_directory
from models.planta import db, Planta_medicinal, Imagem
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
import os, uuid

dashboard_imagens_bp = Blueprint('dashboard_imagens', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'uploads', 'plantas_imagens')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@dashboard_imagens_bp.route('/plantas/<int:planta_id>/imagens', methods=['POST'])
def upload_imagem(planta_id):
    """Upload de imagem"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'Nenhum arquivo'}), 400
        
        file = request.files['file']
        if not allowed_file(file.filename):
            return jsonify({'error': 'Tipo não permitido'}), 400
        
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        # Salvar
        folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        os.makedirs(folder, exist_ok=True)
        
        filename = secure_filename(f"{uuid.uuid4().hex}.{file.filename.rsplit('.', 1)[1].lower()}")
        filepath = os.path.join(folder, filename)
        file.save(filepath)
        
        # Redimensionar
        with PILImage.open(filepath) as img:
            img.thumbnail((800, 800), PILImage.Resampling.LANCZOS)
            img.save(filepath, optimize=True, quality=85)
        
        # DB
        url = f"/uploads/plantas_imagens/{planta_id}/{filename}"
        nova = Imagem(
            nome_arquivo=filename,
            url_armazenamento=url,
            legenda=request.form.get('legenda'),
            referencia_img=request.form.get('referencia_img'),
            id_planta=planta_id
        )
        db.session.add(nova)
        db.session.commit()
        
        return jsonify({'message': 'Imagem enviada', 'imagem': nova.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@dashboard_imagens_bp.route('/plantas/<int:planta_id>/imagens/<int:imagem_id>', methods=['DELETE'])
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
        return jsonify({'message': 'Deletada'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@dashboard_imagens_bp.route('/uploads/plantas_imagens/<int:planta_id>/<filename>')
def serve_image(planta_id, filename):
    """Servir imagem"""
    try:
        folder = os.path.join(UPLOAD_FOLDER, str(planta_id))
        return send_from_directory(folder, filename)
    except:
        return jsonify({'error': 'Não encontrada'}), 404