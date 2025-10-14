#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Auxiliares (Províncias, Partes Usadas, Indicações, etc)
"""
from flask import Blueprint, jsonify
from models.localizacao import Provincia
from models.uso_medicinal import Parte_usada, Indicacao

dashboard_auxiliares_bp = Blueprint('dashboard_auxiliares', __name__)

@dashboard_auxiliares_bp.route('/provincias', methods=['GET'])
def get_provincias():
    """Listar províncias"""
    try:
        provincias = Provincia.query.order_by(Provincia.provincia).all()
        return jsonify({'provincias': [p.to_dict() for p in provincias]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_auxiliares_bp.route('/partes-usadas', methods=['GET'])
def get_partes_usadas():
    """Listar partes usadas"""
    try:
        partes = Parte_usada.query.order_by(Parte_usada.nome_parte).all()
        return jsonify({'partes_usadas': [p.to_dict() for p in partes]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_auxiliares_bp.route('/indicacoes', methods=['GET'])
def get_indicacoes():
    """Listar indicações"""
    try:
        indicacoes = Indicacao.query.order_by(Indicacao.descricao_uso).all()
        return jsonify({'indicacoes': [i.to_dict() for i in indicacoes]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_auxiliares_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'healthy', 'service': 'dashboard', 'database': 'db_plantas_medicinais'}), 200