#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Configurações da API - Sistema de Plantas Medicinais
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Configurações base da aplicação"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY', 'plantas-medicinais-secret-key-2025')
    JSON_AS_ASCII = False
    
    # Database
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'mysql+pymysql://root:@localhost/db_plantas_medicinais'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False  # True para debug de queries
    
    # CORS
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS', 
        'http://localhost:3000,http://localhost:3001'
    ).split(',')
    
    # Upload de imagens
    UPLOAD_FOLDER = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 
        '..', '..', 'uploads', 'plantas_imagens'
    )
    MAX_CONTENT_LENGTH = 5 * 1024 * 1024  # 5MB
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # Paginação
    DEFAULT_PAGE_SIZE = 20
    MAX_PAGE_SIZE = 100
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')