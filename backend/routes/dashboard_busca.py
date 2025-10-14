#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Busca do Dashboard
"""
from flask import Blueprint, jsonify, request
from models.planta import db, Planta_medicinal, Nome_comum
from models.referencia import Autor
from sqlalchemy import func, or_

dashboard_busca_bp = Blueprint('dashboard_busca', __name__)

@dashboard_busca_bp.route('/busca', methods=['GET'])
def busca_integrada():
    """Busca integrada (plantas, famílias, autores)"""
    try:
        q = request.args.get('q', '').strip()
        tipo = request.args.get('tipo', 'todos')
        limit = request.args.get('limit', 10, type=int)
        
        if not q:
            return jsonify({'plantas': [], 'familias': [], 'autores': [], 'total_encontrado': 0}), 200
        
        search = f'%{q}%'
        result = {'plantas': [], 'familias': [], 'autores': [], 'total_encontrado': 0}
        
        # Plantas
        if tipo in ['plantas', 'todos']:
            plantas_cientificas = Planta_medicinal.query.filter(
                Planta_medicinal.nome_cientifico.ilike(search)
            ).limit(limit).all()
            
            plantas_comuns = db.session.query(Planta_medicinal).join(Nome_comum).filter(
                Nome_comum.nome.ilike(search)
            ).limit(limit).all()
            
            plantas_unicas = {p.id_planta: p for p in plantas_cientificas + plantas_comuns}
            
            result['plantas'] = [{
                'id': p.id_planta,
                'tipo': 'planta',
                'nome_cientifico': p.nome_cientifico,
                'familia': p.familia,
                'nome_comum': ([nc.nome for nc in p.nomes_comuns] or [None])[0]
            } for p in list(plantas_unicas.values())[:limit]]
        
        # Famílias
        if tipo in ['familias', 'todos']:
            familias = db.session.query(
                Planta_medicinal.familia,
                func.count(Planta_medicinal.id_planta).label('total')
            ).filter(
                Planta_medicinal.familia.ilike(search)
            ).group_by(Planta_medicinal.familia).limit(limit).all()
            
            result['familias'] = [{
                'tipo': 'familia',
                'nome': f.familia,
                'nome_familia': f.familia,
                'total_plantas': f.total
            } for f in familias]
        
        # Autores
        if tipo in ['autores', 'todos']:
            autores = Autor.query.filter(Autor.nome_autor.ilike(search)).limit(limit).all()
            result['autores'] = [{
                'id': a.id_autor,
                'tipo': 'autor',
                'nome': a.nome_autor,
                'nome_autor': a.nome_autor
            } for a in autores]
        
        result['total_encontrado'] = len(result['plantas']) + len(result['familias']) + len(result['autores'])
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500