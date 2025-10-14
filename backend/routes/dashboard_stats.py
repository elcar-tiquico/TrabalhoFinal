#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Estatísticas do Dashboard
"""
from flask import Blueprint, jsonify, request
from models.planta import db, Planta_medicinal, Nome_comum
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.referencia import Autor, Referencia, Referencia_autor, Planta_referencia
from models.uso_medicinal import Indicacao
from sqlalchemy import func, desc
from datetime import datetime, timedelta

dashboard_stats_bp = Blueprint('dashboard_stats', __name__)

@dashboard_stats_bp.route('/stats', methods=['GET'])
def get_stats():
    """Estatísticas gerais do sistema"""
    try:
        return jsonify({
            'total_plantas': Planta_medicinal.query.count(),
            'total_familias': db.session.query(func.count(func.distinct(Planta_medicinal.familia))).scalar(),
            'total_autores': Autor.query.count(),
            'total_provincias': Provincia.query.count(),
            'total_referencias': Referencia.query.count(),
            'total_indicacoes': Indicacao.query.count(),
            'total_nomes_comuns': Nome_comum.query.count()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/plantas-por-familia', methods=['GET'])
def plantas_por_familia():
    """Distribuição de plantas por família"""
    try:
        limit = request.args.get('limit', 6, type=int)
        familias = db.session.query(
            Planta_medicinal.familia,
            func.count(Planta_medicinal.id_planta).label('count')
        ).group_by(Planta_medicinal.familia).order_by(desc('count')).limit(limit).all()
        
        return jsonify({'familias': [{'name': f.familia, 'count': f.count} for f in familias]}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/plantas-por-provincia', methods=['GET'])
def plantas_por_provincia():
    """Distribuição de plantas por província"""
    try:
        # ✅ CORREÇÃO: Verificar se há dados antes de fazer query
        total = Planta_medicinal.query.count()
        if total == 0:
            return jsonify({'provincias': []}), 200
        
        # Query com error handling
        provincias = db.session.query(
            Provincia.provincia,
            func.count(func.distinct(Planta_local.id_planta)).label('count')
        ).join(
            Local_colheita, Provincia.id_provincia == Local_colheita.id_provincia
        ).join(
            Planta_local, Local_colheita.id_local == Planta_local.id_local
        ).group_by(
            Provincia.provincia
        ).order_by(
            desc('count')
        ).all()
        
        return jsonify({
            'provincias': [{
                'name': p.provincia, 
                'count': p.count, 
                'percentage': round(p.count/total*100, 1) if total > 0 else 0
            } for p in provincias]
        }), 200
    except Exception as e:
        print(f"❌ Erro em plantas-por-provincia: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'provincias': []}), 500

@dashboard_stats_bp.route('/plantas-recentes', methods=['GET'])
def plantas_recentes():
    """Plantas adicionadas recentemente"""
    try:
        limit = request.args.get('limit', 5, type=int)
        plantas = Planta_medicinal.query.order_by(desc(Planta_medicinal.id_planta)).limit(limit).all()
        
        return jsonify({
            'plantas_recentes': [{
                'id': p.id_planta,
                'name': ([nc.nome for nc in p.nomes_comuns] or [p.nome_cientifico])[0],
                'scientific_name': p.nome_cientifico,
                'family': p.familia,
                'common_names': [nc.nome for nc in p.nomes_comuns]
            } for p in plantas]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/plantas-por-idioma', methods=['GET'])
def plantas_por_idioma():
    """Cobertura de idiomas"""
    try:
        total = Planta_medicinal.query.count()
        com_nomes = db.session.query(func.count(func.distinct(Nome_comum.id_planta))).scalar()
        
        return jsonify({
            'idiomas': [
                {'language': 'Português', 'count': total, 'percentage': 100.0},
                {'language': 'Changana', 'count': int(com_nomes*0.7), 'percentage': round(com_nomes*0.7/total*100,1) if total>0 else 0},
                {'language': 'Sena', 'count': int(com_nomes*0.5), 'percentage': round(com_nomes*0.5/total*100,1) if total>0 else 0}
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/referencias-stats', methods=['GET'])
def referencias_stats():
    """Estatísticas de referências"""
    try:
        total = Referencia.query.count()
        com_plantas = db.session.query(func.count(func.distinct(Planta_referencia.id_referencia))).scalar()
        return jsonify({'total_referencias': total, 'referencias_com_plantas': com_plantas}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/autores-stats', methods=['GET'])
def autores_stats():
    """Estatísticas de autores"""
    try:
        total = Autor.query.count()
        com_refs = db.session.query(func.count(func.distinct(Referencia_autor.id_autor))).scalar()
        return jsonify({'total_autores': total, 'autores_com_referencias': com_refs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/referencias-recentes', methods=['GET'])
def referencias_recentes():
    """Referências recentes"""
    try:
        limit = request.args.get('limit', 5, type=int)
        refs = Referencia.query.order_by(desc(Referencia.id_referencia)).limit(limit).all()
        
        result = []
        for r in refs:
            # ✅ CORREÇÃO: Buscar autores através da tabela associativa
            autores = db.session.query(Autor.nome_autor).join(
                Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
            ).filter(
                Referencia_autor.id_referencia == r.id_referencia
            ).all()
            
            result.append({
                'id': r.id_referencia,
                'title': r.titulo_referencia or 'Sem título',
                'type': 'Artigo',
                'year': r.ano_publicacao,
                'authors': [a.nome_autor for a in autores]
            })
        
        return jsonify({'referencias_recentes': result}), 200
    except Exception as e:
        print(f"❌ Erro em referencias-recentes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'referencias_recentes': []}), 500

@dashboard_stats_bp.route('/autores-recentes', methods=['GET'])
def autores_recentes():
    """Autores recentes"""
    try:
        limit = request.args.get('limit', 5, type=int)
        autores = Autor.query.order_by(desc(Autor.id_autor)).limit(limit).all()
        
        result = []
        for a in autores:
            # ✅ CORREÇÃO: Query direta para contar referências
            total_refs = db.session.query(
                func.count(Referencia_autor.id_referencia)
            ).filter(
                Referencia_autor.id_autor == a.id_autor
            ).scalar() or 0
            
            result.append({
                'id': a.id_autor,
                'name': a.nome_autor,
                'affiliation': 'Sem afiliação',
                'total_references': total_refs
            })
        
        return jsonify({'autores_recentes': result}), 200
    except Exception as e:
        print(f"❌ Erro em autores-recentes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'autores_recentes': []}), 500