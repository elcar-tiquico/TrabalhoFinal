#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Imagens - Upload e gestão
MANTIDO da estrutura antiga (sem mudanças)
"""
import os
import uuid
import base64
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image as PILImage
from io import BytesIO
from models.planta import db, Planta_medicinal, Imagem
from config import Config

imagens_bp = Blueprint('imagens', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    """Verificar se extensão é permitida"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def handle_error(e, message="Erro ao processar requisição"):
    """Tratamento de erros padronizado"""
    print(f"❌ Erro: {e}")
    return jsonify({'error': message, 'details': str(e)}), 500

# =====================================================
# GET - LISTAR IMAGENS DE UMA PLANTA
# =====================================================
@imagens_bp.route('/plantas/<int:planta_id>/imagens', methods=['GET'])
def get_imagens_planta(planta_id):
    """Buscar todas as imagens de uma planta"""
    try:
        planta = Planta_medicinal.query.get_or_404(planta_id)
        imagens = Imagem.query.filter_by(id_planta=planta_id).all()
        
        return jsonify({
            'imagens': [img.to_dict() for img in imagens],
            'total': len(imagens),
            'planta_id': planta_id,
            'planta_nome': planta.nome_cientifico
        })
    except Exception as e:
        return handle_error(e, "Erro ao buscar imagens")

# =====================================================
# POST - UPLOAD DE IMAGEM
# =====================================================
@imagens_bp.route('/plantas/<int:planta_id>/imagens', methods=['POST'])
def upload_imagem(planta_id):
    """
    Upload de imagem para uma planta
    Aceita: multipart/form-data OU base64
    """
    try:
        planta = Planta_medicinal.query.get_or_404(planta_id)
        
        # Criar pasta da planta se não existir
        planta_folder = os.path.join(Config.UPLOAD_FOLDER, str(planta_id))
        os.makedirs(planta_folder, exist_ok=True)
        
        # Verificar se é upload por arquivo ou base64
        if 'file' in request.files:
            # Upload tradicional
            file = request.files['file']
            
            if file.filename == '':
                return jsonify({'error': 'Nenhum arquivo selecionado'}), 400
            
            if not allowed_file(file.filename):
                return jsonify({'error': 'Tipo de arquivo não permitido'}), 400
            
            # Gerar nome único
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(planta_folder, filename)
            
            # Salvar arquivo
            file.save(filepath)
            
        elif request.is_json:
            # Upload base64
            data = request.get_json()
            
            if 'image_base64' not in data:
                return jsonify({'error': 'image_base64 é obrigatório'}), 400
            
            # Decodificar base64
            image_data = data['image_base64']
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            image_bytes = base64.b64decode(image_data)
            
            # Abrir imagem com PIL
            img = PILImage.open(BytesIO(image_bytes))
            
            # Determinar formato
            format_map = {'JPEG': 'jpg', 'PNG': 'png', 'GIF': 'gif', 'WEBP': 'webp'}
            ext = format_map.get(img.format, 'jpg')
            
            # Gerar nome único
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(planta_folder, filename)
            
            # Salvar imagem
            img.save(filepath)
            
        else:
            return jsonify({'error': 'Formato de upload inválido'}), 400
        
        # Salvar metadados no BD
        url_armazenamento = f"/uploads/plantas_imagens/{planta_id}/{filename}"
        
        imagem = Imagem(
            nome_arquivo=filename,
            url_armazenamento=url_armazenamento,
            legenda=request.form.get('legenda') if 'file' in request.files else data.get('legenda'),
            referencia_img=request.form.get('referencia') if 'file' in request.files else data.get('referencia'),
            id_planta=planta_id
        )
        
        db.session.add(imagem)
        db.session.commit()
        
        return jsonify({
            'message': 'Imagem enviada com sucesso',
            'imagem': imagem.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao fazer upload da imagem")

# =====================================================
# PUT - ATUALIZAR METADADOS DA IMAGEM
# =====================================================
@imagens_bp.route('/imagens/<int:imagem_id>', methods=['PUT'])
def update_imagem(imagem_id):
    """Atualizar legenda/referência da imagem"""
    try:
        imagem = Imagem.query.get_or_404(imagem_id)
        data = request.get_json()
        
        if 'legenda' in data:
            imagem.legenda = data['legenda']
        if 'referencia' in data:
            imagem.referencia_img = data['referencia']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Imagem atualizada com sucesso',
            'imagem': imagem.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao atualizar imagem")

# =====================================================
# DELETE - EXCLUIR IMAGEM
# =====================================================
@imagens_bp.route('/imagens/<int:imagem_id>', methods=['DELETE'])
def delete_imagem(imagem_id):
    """Excluir imagem (arquivo e registro)"""
    try:
        imagem = Imagem.query.get_or_404(imagem_id)
        
        # Deletar arquivo físico
        filepath = os.path.join(
            Config.UPLOAD_FOLDER,
            str(imagem.id_planta),
            imagem.nome_arquivo
        )
        
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Deletar registro do BD
        db.session.delete(imagem)
        db.session.commit()
        
        return jsonify({'message': 'Imagem excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao excluir imagem")

# =====================================================
# GET - SERVIR ARQUIVO DE IMAGEM
# =====================================================
@imagens_bp.route('/uploads/plantas_imagens/<int:planta_id>/<filename>')
def serve_imagem(planta_id, filename):
    """Servir arquivo de imagem"""
    try:
        planta_folder = os.path.join(Config.UPLOAD_FOLDER, str(planta_id))
        return send_from_directory(planta_folder, filename)
    except Exception as e:
        return jsonify({'error': 'Imagem não encontrada'}), 404