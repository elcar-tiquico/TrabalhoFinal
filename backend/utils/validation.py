#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Utilitários de Validação - Wizard de Plantas
Funções auxiliares para validação e processamento de dados
"""

import os
import re
import base64
from datetime import datetime, timedelta
from PIL import Image as PILImage
from io import BytesIO

# Extensões de arquivo permitidas para imagens
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

# =====================================================
# VALIDAÇÃO DE ARQUIVOS
# =====================================================

def allowed_file(filename):
    """
    Verificar se a extensão do arquivo é permitida
    
    Args:
        filename (str): Nome do arquivo
    
    Returns:
        bool: True se permitido, False caso contrário
    """
    if not filename or '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS


def validate_image_size(image_bytes):
    """
    Validar tamanho da imagem
    
    Args:
        image_bytes (bytes): Bytes da imagem
    
    Returns:
        tuple: (bool, str) - (válido, mensagem_erro)
    """
    size = len(image_bytes)
    
    if size > MAX_FILE_SIZE:
        size_mb = size / (1024 * 1024)
        return False, f"Imagem muito grande ({size_mb:.2f}MB). Máximo permitido: 5MB"
    
    return True, ""


def process_image_base64(image_data, validate_only=False):
    """
    Processar imagem em base64
    
    Args:
        image_data (str): String base64 da imagem
        validate_only (bool): Se True, apenas valida sem processar
    
    Returns:
        tuple: (bool, data/error) - (sucesso, dados_ou_erro)
    """
    try:
        # Remover prefixo data:image se existir
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        # Decodificar base64
        try:
            image_bytes = base64.b64decode(image_data)
        except Exception as e:
            return False, f"Erro ao decodificar base64: {str(e)}"
        
        # Validar tamanho
        valid_size, error_msg = validate_image_size(image_bytes)
        if not valid_size:
            return False, error_msg
        
        # Se apenas validação, retornar aqui
        if validate_only:
            return True, {"size": len(image_bytes)}
        
        # Processar com PIL
        try:
            img = PILImage.open(BytesIO(image_bytes))
            
            # Validar formato
            if img.format.lower() not in ['png', 'jpg', 'jpeg', 'gif', 'webp']:
                return False, f"Formato de imagem não suportado: {img.format}"
            
            # Converter RGBA para RGB se necessário
            if img.mode == 'RGBA':
                img = img.convert('RGB')
            
            # Retornar dados processados
            return True, {
                'image': img,
                'format': img.format,
                'size': img.size,
                'mode': img.mode,
                'bytes': image_bytes
            }
            
        except Exception as e:
            return False, f"Erro ao processar imagem: {str(e)}"
        
    except Exception as e:
        return False, f"Erro inesperado: {str(e)}"


# =====================================================
# VALIDAÇÃO DE CAMPOS
# =====================================================

def validate_nome_cientifico(nome):
    """
    Validar formato de nome científico (básico)
    Exemplo: "Zingiber officinale"
    
    Args:
        nome (str): Nome científico
    
    Returns:
        tuple: (bool, str) - (válido, mensagem_erro)
    """
    if not nome or not nome.strip():
        return False, "Nome científico é obrigatório"
    
    nome = nome.strip()
    
    # Mínimo 2 palavras (gênero + espécie)
    palavras = nome.split()
    if len(palavras) < 2:
        return False, "Nome científico deve conter pelo menos gênero e espécie"
    
    # Primeira letra maiúscula no gênero
    if not palavras[0][0].isupper():
        return False, "Primeira letra do gênero deve ser maiúscula"
    
    return True, ""


def validate_familia(familia):
    """
    Validar nome de família
    
    Args:
        familia (str): Nome da família
    
    Returns:
        tuple: (bool, str) - (válido, mensagem_erro)
    """
    if not familia or not familia.strip():
        return False, "Família é obrigatória"
    
    familia = familia.strip()
    
    # Mínimo 3 caracteres
    if len(familia) < 3:
        return False, "Nome da família muito curto"
    
    return True, ""


def validate_nomes_comuns(nomes_comuns):
    """
    Validar lista de nomes comuns
    
    Args:
        nomes_comuns (list): Lista de nomes comuns
    
    Returns:
        tuple: (bool, str, list) - (válido, mensagem_erro, nomes_válidos)
    """
    if not nomes_comuns or not isinstance(nomes_comuns, list):
        return False, "Pelo menos um nome comum é obrigatório", []
    
    # Filtrar e limpar nomes válidos
    nomes_validos = []
    for nome in nomes_comuns:
        if nome and isinstance(nome, str) and nome.strip():
            nomes_validos.append(nome.strip())
    
    if len(nomes_validos) == 0:
        return False, "Pelo menos um nome comum válido é obrigatório", []
    
    return True, "", nomes_validos


def validate_locais_colheita(locais):
    """
    Validar lista de locais de colheita
    
    Args:
        locais (list): Lista de IDs de locais
    
    Returns:
        tuple: (bool, str) - (válido, mensagem_erro)
    """
    if not locais or not isinstance(locais, list):
        return False, "Pelo menos um local de colheita é obrigatório"
    
    # Filtrar IDs válidos
    locais_validos = [l for l in locais if isinstance(l, int) and l > 0]
    
    if len(locais_validos) == 0:
        return False, "Pelo menos um local de colheita válido é obrigatório"
    
    return True, ""


def validate_partes_usadas(partes):
    """
    Validar estrutura de partes usadas com indicações
    
    Args:
        partes (list): Lista de dicts com parte e indicações
    
    Returns:
        tuple: (bool, dict) - (válido, dicionário_de_erros)
    """
    if not partes or not isinstance(partes, list):
        return False, {'partes_usadas': 'Pelo menos uma parte usada é obrigatória'}
    
    errors = {}
    
    for idx, parte in enumerate(partes):
        if not isinstance(parte, dict):
            errors[f'partes_usadas[{idx}]'] = 'Formato inválido'
            continue
        
        # Validar id_parte
        if not parte.get('id_parte'):
            errors[f'partes_usadas[{idx}].id_parte'] = 'Parte da planta é obrigatória'
        
        # Validar indicações
        indicacoes = parte.get('indicacoes', [])
        if not indicacoes or len(indicacoes) == 0:
            errors[f'partes_usadas[{idx}].indicacoes'] = 'Pelo menos uma indicação é obrigatória'
    
    if errors:
        return False, errors
    
    return True, {}


def validate_referencias(referencias):
    """
    Validar lista de referências
    
    Args:
        referencias (list): Lista de IDs ou dicts de referências
    
    Returns:
        tuple: (bool, str) - (válido, mensagem_erro)
    """
    if not referencias or not isinstance(referencias, list):
        return False, "Pelo menos uma referência bibliográfica é obrigatória"
    
    # Extrair IDs válidos
    ids_validos = []
    for ref in referencias:
        if isinstance(ref, int) and ref > 0:
            ids_validos.append(ref)
        elif isinstance(ref, dict) and ref.get('id'):
            ids_validos.append(ref['id'])
    
    if len(ids_validos) == 0:
        return False, "Pelo menos uma referência válida é obrigatória"
    
    return True, ""


def validate_imagens(imagens):
    """
    Validar lista de imagens
    
    Args:
        imagens (list): Lista de dicts com dados de imagens
    
    Returns:
        tuple: (bool, dict) - (válido, dicionário_de_erros)
    """
    if not imagens or not isinstance(imagens, list):
        return False, {'imagens': 'Pelo menos uma imagem é obrigatória'}
    
    errors = {}
    
    for idx, imagem in enumerate(imagens):
        if not isinstance(imagem, dict):
            errors[f'imagens[{idx}]'] = 'Formato inválido'
            continue
        
        # Validar file_data
        file_data = imagem.get('file_data', '')
        if not file_data:
            errors[f'imagens[{idx}].file_data'] = 'Dados da imagem são obrigatórios'
            continue
        
        # Validar base64
        success, result = process_image_base64(file_data, validate_only=True)
        if not success:
            errors[f'imagens[{idx}].file_data'] = result
    
    if errors:
        return False, errors
    
    return True, {}


# =====================================================
# VALIDAÇÃO COMPLETA DE STEP
# =====================================================

def validate_wizard_step(step, form_data, db_session=None):
    """
    Validar dados completos de um step do wizard
    
    Args:
        step (int): Número do step (1-6)
        form_data (dict): Dados do formulário
        db_session: Sessão do SQLAlchemy (opcional, para validações que precisam de BD)
    
    Returns:
        dict: {'valid': bool, 'errors': dict, 'warnings': list}
    """
    errors = {}
    warnings = []
    
    # Step 1: Informações Básicas
    if step == 1:
        # Validar família
        valid, error = validate_familia(form_data.get('familia', ''))
        if not valid:
            errors['familia'] = error
        
        # Validar nome científico
        valid, error = validate_nome_cientifico(form_data.get('nome_cientifico', ''))
        if not valid:
            errors['nome_cientifico'] = error
        else:
            # Verificar duplicidade (se db_session fornecido)
            if db_session:
                from models.planta import Planta_medicinal
                existing = db_session.query(Planta_medicinal).filter_by(
                    nome_cientifico=form_data['nome_cientifico']
                ).first()
                if existing:
                    errors['nome_cientifico'] = 'Planta com este nome científico já existe'
    
    # Step 2: Identificação e Localização
    elif step == 2:
        # Validar nomes comuns
        valid, error, _ = validate_nomes_comuns(form_data.get('nomes_comuns', []))
        if not valid:
            errors['nomes_comuns'] = error
        
        # Validar locais
        valid, error = validate_locais_colheita(form_data.get('locais', []))
        if not valid:
            errors['locais'] = error
    
    # Step 3: Usos Medicinais
    elif step == 3:
        valid, error_dict = validate_partes_usadas(form_data.get('partes_usadas', []))
        if not valid:
            errors.update(error_dict)
    
    # Step 4: Composição Científica (opcional)
    elif step == 4:
        comp_quimica = form_data.get('comp_quimica', '')
        prop_farmacologica = form_data.get('prop_farmacologica', '')
        
        if not comp_quimica and not prop_farmacologica:
            warnings.append('Considere adicionar informações sobre composição química ou propriedades farmacológicas')
    
    # Step 5: Imagens
    elif step == 5:
        valid, error_dict = validate_imagens(form_data.get('imagens', []))
        if not valid:
            errors.update(error_dict)
    
    # Step 6: Referências
    elif step == 6:
        valid, error = validate_referencias(form_data.get('referencias', []))
        if not valid:
            errors['referencias'] = error
    
    return {
        'valid': len(errors) == 0,
        'errors': errors,
        'warnings': warnings
    }


# =====================================================
# LIMPEZA DE RASCUNHOS
# =====================================================

def clean_expired_drafts(drafts_dict, expiry_hours=24):
    """
    Remover rascunhos expirados
    
    Args:
        drafts_dict (dict): Dicionário de rascunhos
        expiry_hours (int): Horas até expiração
    
    Returns:
        int: Número de rascunhos removidos
    """
    now = datetime.utcnow()
    expired_keys = []
    
    for draft_id, draft_data in drafts_dict.items():
        try:
            expires_at_str = draft_data.get('expires_at')
            if expires_at_str:
                expires_at = datetime.fromisoformat(expires_at_str)
                if now > expires_at:
                    expired_keys.append(draft_id)
            else:
                # Se não tem data de expiração, marcar como expirado
                expired_keys.append(draft_id)
        except Exception:
            # Se erro ao processar, marcar como expirado
            expired_keys.append(draft_id)
    
    # Remover rascunhos expirados
    for key in expired_keys:
        del drafts_dict[key]
    
    return len(expired_keys)


# =====================================================
# SANITIZAÇÃO DE DADOS
# =====================================================

def sanitize_text(text, max_length=None):
    """
    Sanitizar texto de entrada
    
    Args:
        text (str): Texto a sanitizar
        max_length (int): Comprimento máximo (opcional)
    
    Returns:
        str: Texto sanitizado
    """
    if not text:
        return ""
    
    # Remover espaços extras
    text = ' '.join(text.split())
    
    # Truncar se necessário
    if max_length and len(text) > max_length:
        text = text[:max_length]
    
    return text.strip()


def sanitize_filename(filename):
    """
    Sanitizar nome de arquivo
    
    Args:
        filename (str): Nome do arquivo
    
    Returns:
        str: Nome sanitizado
    """
    if not filename:
        return "unnamed"
    
    # Remover caracteres perigosos
    filename = re.sub(r'[^\w\s\-\.]', '', filename)
    filename = re.sub(r'[\s]+', '_', filename)
    
    return filename.lower()


# =====================================================
# CONVERSÃO DE DADOS
# =====================================================

def extract_ids_from_list(items):
    """
    Extrair IDs de uma lista de items (int ou dict)
    
    Args:
        items (list): Lista de ints ou dicts
    
    Returns:
        list: Lista de IDs válidos
    """
    if not items or not isinstance(items, list):
        return []
    
    ids = []
    for item in items:
        if isinstance(item, int) and item > 0:
            ids.append(item)
        elif isinstance(item, dict):
            item_id = item.get('id') or item.get('value')
            if item_id and isinstance(item_id, int) and item_id > 0:
                ids.append(item_id)
    
    return ids


def parse_json_field(value):
    """
    Parser seguro para campos JSON
    
    Args:
        value: Valor a parsear (str, dict, list)
    
    Returns:
        str: JSON string ou None
    """
    if not value:
        return None
    
    if isinstance(value, str):
        return value
    
    import json
    try:
        return json.dumps(value, ensure_ascii=False)
    except:
        return None