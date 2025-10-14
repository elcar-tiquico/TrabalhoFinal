#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Principal - Sistema de Plantas Medicinais
"""
import os
from flask import Flask
from flask_cors import CORS
from config import Config

# Criar aplicação
app = Flask(__name__)
app.config.from_object(Config)

# Inicializar CORS
CORS(app, origins=Config.CORS_ORIGINS)

# Criar pasta de uploads
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# ===== INICIALIZAR DB ANTES de importar models =====
from models.planta import db
db.init_app(app)

# ===== Importar models (APÓS inicializar db) =====
from models import *

# ===== Importar Blueprints EXISTENTES =====
from routes.plantas import plantas_bp
from routes.busca import busca_bp
from routes.auxiliares import auxiliares_bp
from routes.imagens import imagens_bp

# ===== Importar Blueprints NOVOS (Dashboard) =====
from routes.dashboard_stats import dashboard_stats_bp
from routes.dashboard_crud import dashboard_crud_bp
from routes.dashboard_busca import dashboard_busca_bp
from routes.dashboard_imagens import dashboard_imagens_bp
from routes.dashboard_auxiliares import dashboard_auxiliares_bp

# ===== Registrar Blueprints EXISTENTES =====
app.register_blueprint(plantas_bp, url_prefix='/api')
app.register_blueprint(busca_bp, url_prefix='/api')
app.register_blueprint(auxiliares_bp, url_prefix='/api')
app.register_blueprint(imagens_bp, url_prefix='/api')

# ===== Registrar Blueprints NOVOS (Dashboard) =====
app.register_blueprint(dashboard_stats_bp, url_prefix='/api/admin/dashboard')
app.register_blueprint(dashboard_crud_bp, url_prefix='/api/admin')
app.register_blueprint(dashboard_busca_bp, url_prefix='/api/admin/dashboard')
app.register_blueprint(dashboard_imagens_bp, url_prefix='/api/admin')
app.register_blueprint(dashboard_auxiliares_bp, url_prefix='/api/admin')

# ===== Rota de health check =====
@app.route('/health')
def health_check():
    return {'status': 'ok', 'message': 'API Plantas Medicinais - Nova Estrutura'}, 200

@app.route('/')
def index():
    return {
        'api': 'Plantas Medicinais de Moçambique',
        'versao': '2.0',
        'estrutura': 'modular',
        'endpoints': {
            'plantas': '/api/plantas',
            'busca': '/api/busca',
            'dashboard': '/api/admin/dashboard/stats',
            'provincias': '/api/provincias',
            'partes_usadas': '/api/partes-usadas',
            'indicacoes': '/api/indicacoes',
            'autores': '/api/autores',
            'referencias': '/api/referencias'
        }
    }, 200

# ===== Error handlers =====
@app.errorhandler(404)
def not_found(error):
    return {'error': 'Endpoint não encontrado'}, 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return {'error': 'Erro interno do servidor'}, 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    
    print("=" * 60)
    print("🌿 API PLANTAS MEDICINAIS - NOVA ESTRUTURA")
    print("=" * 60)
    print(f"🚀 Servidor: http://localhost:5000")
    print(f"📊 Dashboard: http://localhost:5000/api/admin/dashboard/stats")
    print(f"📁 Estrutura: Modular (arquivos separados)")
    print(f"🗄️  Database: {Config.SQLALCHEMY_DATABASE_URI}")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)