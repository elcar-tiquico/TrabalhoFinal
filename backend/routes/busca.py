#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Busca Avançada - ADAPTADO À NOVA BD
"""
from flask import Blueprint, request, jsonify
from models.planta import db, Planta_medicinal, Nome_comum
from models.localizacao import Provincia, Local_colheita
from models.uso_medicinal import Parte_usada, Indicacao
from models.referencia import Autor
from models.usuario import LogPesquisas
from sqlalchemy import func, or_

busca_bp = Blueprint('busca', __name__)

@busca_bp.route('/busca', methods=['GET'])
def busca_global():
    """
    Busca global no sistema
    ADAPTADO: família agora é campo texto
    """
    try:
        termo = request.args.get('q', '').strip()
        tipo = request.args.get('tipo', 'todos')
        limit = request.args.get('limit', 20, type=int)
        
        if not termo:
            return jsonify({'error': 'Termo de busca é obrigatório'}), 400
        
        resultados = {
            'plantas': [],
            'familias': [],
            'autores': [],
            'provincias': [],
            'total': 0
        }
        
        search_pattern = f'%{termo}%'
        
        # Buscar plantas (por nome científico OU popular)
        if tipo in ['plantas', 'todos']:
            plantas = db.session.query(
                Planta_medicinal.id_planta,
                Planta_medicinal.nome_cientifico,
                Planta_medicinal.familia,
                func.group_concat(Nome_comum.nome.distinct()).label('nomes_comuns')
            ).outerjoin(
                Nome_comum, Planta_medicinal.id_planta == Nome_comum.id_planta
            ).filter(
                or_(
                    Planta_medicinal.nome_cientifico.ilike(search_pattern),
                    Nome_comum.nome.ilike(search_pattern)
                )
            ).group_by(
                Planta_medicinal.id_planta
            ).limit(limit).all()
            
            resultados['plantas'] = [{
                'id_planta': p.id_planta,
                'nome_cientifico': p.nome_cientifico,
                'familia': p.familia,
                'nomes_comuns': p.nomes_comuns.split(',') if p.nomes_comuns else []
            } for p in plantas]
        
        # ✅ MUDOU: Buscar famílias (agora busca diretamente no campo texto)
        if tipo in ['familias', 'todos']:
            familias = db.session.query(
                Planta_medicinal.familia,
                func.count(Planta_medicinal.id_planta).label('total_plantas')
            ).filter(
                Planta_medicinal.familia.ilike(search_pattern)
            ).group_by(
                Planta_medicinal.familia
            ).limit(limit).all()
            
            resultados['familias'] = [{
                'nome_familia': f.familia,
                'total_plantas': f.total_plantas
            } for f in familias]
        
        # Buscar autores
        if tipo in ['autores', 'todos']:
            autores = Autor.query.filter(
                Autor.nome_autor.ilike(search_pattern)
            ).limit(limit).all()
            
            resultados['autores'] = [a.to_dict() for a in autores]
        
        # Buscar províncias
        if tipo in ['provincias', 'todos']:
            provincias = Provincia.query.filter(
                Provincia.provincia.ilike(search_pattern)
            ).limit(limit).all()
            
            resultados['provincias'] = [p.to_dict() for p in provincias]
        
        # Calcular total
        resultados['total'] = (
            len(resultados['plantas']) +
            len(resultados['familias']) +
            len(resultados['autores']) +
            len(resultados['provincias'])
        )
        
        # Registrar busca
        try:
            log = LogPesquisas(
                termo_pesquisa=termo[:255],
                tipo_pesquisa=tipo,
                resultados_encontrados=resultados['total'],
                ip_usuario=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')[:500]
            )
            db.session.add(log)
            db.session.commit()
        except:
            pass
        
        return jsonify(resultados)
        
    except Exception as e:
        print(f"❌ Erro na busca: {e}")
        return jsonify({'error': 'Erro ao realizar busca'}), 500


@busca_bp.route('/busca/autocomplete', methods=['GET'])
def autocomplete():
    """
    Sugestões para autocomplete
    ADAPTADO: busca em nomes comuns e científicos
    """
    try:
        termo = request.args.get('q', '').strip()
        tipo = request.args.get('tipo', 'planta')
        limit = request.args.get('limit', 10, type=int)
        
        if not termo or len(termo) < 2:
            return jsonify([])
        
        search_pattern = f'{termo}%'  # Começa com...
        
        if tipo == 'planta':
            # Buscar nomes científicos
            cientificos = db.session.query(
                Planta_medicinal.nome_cientifico.label('label'),
                Planta_medicinal.id_planta.label('value')
            ).filter(
                Planta_medicinal.nome_cientifico.ilike(search_pattern)
            ).limit(limit // 2).all()
            
            # Buscar nomes comuns
            comuns = db.session.query(
                Nome_comum.nome.label('label'),
                Nome_comum.id_planta.label('value')
            ).filter(
                Nome_comum.nome.ilike(search_pattern)
            ).limit(limit // 2).all()
            
            resultados = [{'label': r.label, 'value': r.value} for r in cientificos + comuns]
            
        elif tipo == 'familia':
            # ✅ MUDOU: Busca famílias únicas no campo texto
            familias = db.session.query(
                Planta_medicinal.familia.label('label')
            ).filter(
                Planta_medicinal.familia.ilike(search_pattern)
            ).distinct().limit(limit).all()
            
            resultados = [{'label': f.label, 'value': f.label} for f in familias]
            
        elif tipo == 'autor':
            autores = Autor.query.filter(
                Autor.nome_autor.ilike(search_pattern)
            ).limit(limit).all()
            
            resultados = [{'label': a.nome_autor, 'value': a.id_autor} for a in autores]
            
        elif tipo == 'provincia':
            provincias = Provincia.query.filter(
                Provincia.provincia.ilike(search_pattern)
            ).limit(limit).all()
            
            resultados = [{'label': p.provincia, 'value': p.id_provincia} for p in provincias]
            
        else:
            resultados = []
        
        return jsonify(resultados)
        
    except Exception as e:
        print(f"❌ Erro no autocomplete: {e}")
        return jsonify([])


@busca_bp.route('/busca/stats', methods=['GET'])
def busca_stats():
    """Estatísticas de buscas realizadas"""
    try:
        # Últimas 100 buscas
        buscas_recentes = LogPesquisas.query.order_by(
            LogPesquisas.data_pesquisa.desc()
        ).limit(100).all()
        
        # Termos mais buscados
        termos_populares = db.session.query(
            LogPesquisas.termo_pesquisa,
            func.count(LogPesquisas.id_pesquisa).label('total')
        ).filter(
            LogPesquisas.termo_pesquisa.isnot(None)
        ).group_by(
            LogPesquisas.termo_pesquisa
        ).order_by(
            func.count(LogPesquisas.id_pesquisa).desc()
        ).limit(10).all()
        
        return jsonify({
            'total_buscas': len(buscas_recentes),
            'termos_populares': [
                {'termo': t.termo_pesquisa, 'total': t.total}
                for t in termos_populares
            ]
        })
        
    except Exception as e:
        print(f"❌ Erro ao buscar stats: {e}")
        return jsonify({'error': 'Erro ao buscar estatísticas'}), 500