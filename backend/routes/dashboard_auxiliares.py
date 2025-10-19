#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Auxiliares (Províncias, Partes Usadas, Indicações, etc)
"""
from flask import Blueprint, jsonify
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.uso_medicinal import Parte_usada, Indicacao
from models.planta import db
from sqlalchemy import func, distinct

dashboard_auxiliares_bp = Blueprint('dashboard_auxiliares', __name__)

@dashboard_auxiliares_bp.route('/provincias', methods=['GET'])
def get_provincias():
    """Listar províncias com contagem de plantas"""
    try:
        # ✅ Query que conta plantas por província através de Local_colheita
        provincias_com_count = db.session.query(
            Provincia,
            func.count(distinct(Planta_local.id_planta)).label('total_plantas')
        ).outerjoin(
            Local_colheita, Local_colheita.id_provincia == Provincia.id_provincia
        ).outerjoin(
            Planta_local, Planta_local.id_local == Local_colheita.id_local
        ).group_by(
            Provincia.id_provincia
        ).order_by(
            Provincia.provincia
        ).all()
        
        # Formatar resultado
        result = []
        for provincia, total in provincias_com_count:
            provincia_dict = provincia.to_dict()
            provincia_dict['total_plantas'] = total
            result.append(provincia_dict)
        
        return jsonify({'provincias': result}), 200
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