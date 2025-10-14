#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas CRUD de Plantas (Dashboard Admin)
"""
from flask import Blueprint, jsonify, request
from models.planta import db, Planta_medicinal, Nome_comum
from models.localizacao import Provincia, Local_colheita, Planta_local
from sqlalchemy import or_

dashboard_crud_bp = Blueprint('dashboard_crud', __name__)

@dashboard_crud_bp.route('/plantas', methods=['GET'])
def get_plantas():
    """Listar plantas com paginação e filtros"""
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

@dashboard_crud_bp.route('/plantas/<int:planta_id>', methods=['GET'])
def get_planta(planta_id):
    """Detalhes de uma planta"""
    try:
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        planta_dict = planta.to_dict(include_relations=True)
        return jsonify(planta_dict), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_crud_bp.route('/plantas', methods=['POST'])
def create_planta():
    """Criar nova planta"""
    try:
        data = request.get_json()
        
        if not data.get('nome_cientifico') or not data.get('familia'):
            return jsonify({'error': 'Campos obrigatórios faltando'}), 400
        
        nova = Planta_medicinal(
            nome_cientifico=data['nome_cientifico'],
            familia=data['familia'],
            infos_adicionais=data.get('infos_adicionais'),
            comp_quimica=data.get('comp_quimica'),
            prop_farmacologica=data.get('prop_farmacologica')
        )
        
        db.session.add(nova)
        db.session.commit()
        
        return jsonify({'message': 'Planta criada', 'planta': nova.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@dashboard_crud_bp.route('/plantas/<int:planta_id>', methods=['PUT'])
def update_planta(planta_id):
    """Atualizar planta"""
    try:
        planta = Planta_medicinal.query.get(planta_id)
        if not planta:
            return jsonify({'error': 'Planta não encontrada'}), 404
        
        data = request.get_json()
        for key in ['nome_cientifico', 'familia', 'infos_adicionais', 'comp_quimica', 'prop_farmacologica']:
            if key in data:
                setattr(planta, key, data[key])
        
        db.session.commit()
        return jsonify({'message': 'Atualizada', 'planta': planta.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@dashboard_crud_bp.route('/plantas/<int:planta_id>', methods=['DELETE'])
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