#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Utilitários para processamento de imagens
"""

import os
import uuid
import base64
import logging
from PIL import Image
from io import BytesIO

logger = logging.getLogger(__name__)

# Diretório base para uploads
UPLOAD_BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'uploads', 'plantas_imagens')
os.makedirs(UPLOAD_BASE, exist_ok=True)


def resize_image(image_path, max_size=(800, 800), quality=85):
    """
    Redimensiona uma imagem mantendo a proporção
    
    Args:
        image_path: Caminho completo do arquivo de imagem
        max_size: Tupla (largura, altura) máxima
        quality: Qualidade JPEG (0-100)
    """
    try:
        with Image.open(image_path) as img:
            # Converter para RGB se necessário
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Redimensionar mantendo proporção
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Salvar com qualidade otimizada
            img.save(image_path, 'JPEG', quality=quality, optimize=True)
            
            logger.info(f"✅ Imagem redimensionada: {os.path.basename(image_path)}")
            return True
            
    except Exception as e:
        logger.error(f"❌ Erro ao redimensionar imagem {image_path}: {e}")
        return False


def save_plant_image(id_planta, image_data, file_extension='jpg'):
    """
    Salva imagem de uma planta
    
    Args:
        id_planta: ID da planta
        image_data: String base64 da imagem
        file_extension: Extensão do arquivo (jpg, png, etc)
    
    Returns:
        dict com nome_arquivo e url_armazenamento ou None em caso de erro
    """
    try:
        # Criar diretório da planta
        planta_folder = os.path.join(UPLOAD_BASE, str(id_planta))
        os.makedirs(planta_folder, exist_ok=True)
        
        # Gerar nome único
        filename = f"{uuid.uuid4().hex}.{file_extension}"
        file_path = os.path.join(planta_folder, filename)
        
        # Decodificar base64
        if 'data:' in image_data:
            base64_data = image_data.split(',')[1]
        else:
            base64_data = image_data
        
        image_binary = base64.b64decode(base64_data)
        
        # Salvar arquivo
        with open(file_path, 'wb') as f:
            f.write(image_binary)
        
        # Redimensionar
        resize_image(file_path)
        
        # URL relativo
        url_armazenamento = f"/uploads/plantas_imagens/{id_planta}/{filename}"
        
        logger.info(f"✅ Imagem salva: {filename}")
        
        return {
            'nome_arquivo': filename,
            'url_armazenamento': url_armazenamento
        }
        
    except Exception as e:
        logger.error(f"❌ Erro ao salvar imagem: {e}")
        return None


def delete_plant_images(id_planta):
    """
    Remove todas as imagens de uma planta
    
    Args:
        id_planta: ID da planta
    """
    try:
        planta_folder = os.path.join(UPLOAD_BASE, str(id_planta))
        
        if os.path.exists(planta_folder):
            import shutil
            shutil.rmtree(planta_folder)
            logger.info(f"✅ Imagens da planta {id_planta} removidas")
            return True
            
    except Exception as e:
        logger.error(f"❌ Erro ao remover imagens da planta {id_planta}: {e}")
        return False


def validate_image_data(image_data):
    """
    Valida dados de imagem base64
    
    Returns:
        tuple (is_valid, error_message)
    """
    if not image_data:
        return False, "Dados da imagem não fornecidos"
    
    try:
        # Extrair base64
        if 'data:' in image_data:
            base64_data = image_data.split(',')[1]
        else:
            base64_data = image_data
        
        # Tentar decodificar
        image_binary = base64.b64decode(base64_data)
        
        # Tentar abrir como imagem
        img = Image.open(BytesIO(image_binary))
        
        # Verificar formato
        if img.format not in ['JPEG', 'PNG', 'GIF', 'BMP']:
            return False, f"Formato não suportado: {img.format}"
        
        # Verificar tamanho (max 10MB)
        if len(image_binary) > 10 * 1024 * 1024:
            return False, "Imagem muito grande (máx 10MB)"
        
        return True, None
        
    except Exception as e:
        return False, f"Imagem inválida: {str(e)}"