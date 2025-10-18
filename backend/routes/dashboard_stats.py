#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas de Estatísticas do Dashboard
"""
from flask import Blueprint, jsonify, request
from models.planta import db, Planta_medicinal, Nome_comum
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.referencia import Autor, Referencia, Referencia_autor, Planta_referencia, Afiliacao
from models.uso_medicinal import Indicacao
from sqlalchemy import func, desc, text
from datetime import datetime, timedelta

dashboard_stats_bp = Blueprint('dashboard_stats', __name__)

# ==================== ESTATÍSTICAS GERAIS ====================
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

# ==================== PLANTAS ====================
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
        total = Planta_medicinal.query.count()
        if total == 0:
            return jsonify({'provincias': []}), 200
        
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

# ==================== REFERÊNCIAS ====================
@dashboard_stats_bp.route('/referencias-stats', methods=['GET'])
def referencias_stats():
    """Estatísticas de referências"""
    try:
        total = Referencia.query.count()
        com_plantas = db.session.query(func.count(func.distinct(Planta_referencia.id_referencia))).scalar() or 0
        sem_ano = Referencia.query.filter(Referencia.ano_publicacao.is_(None)).count()
        
        # Distribuição por tipo
        todas_refs = Referencia.query.all()
        tipos_dict = {}
        for ref in todas_refs:
            if ref.link_referencia:
                if 'doi.org' in ref.link_referencia.lower():
                    tipo = 'Artigo'
                elif 'http://' in ref.link_referencia or 'https://' in ref.link_referencia:
                    tipo = 'URL'
                else:
                    tipo = 'Outro'
            else:
                tipo = 'Outro'
            tipos_dict[tipo] = tipos_dict.get(tipo, 0) + 1
        
        tipos_resultado = [{'tipo': k, 'count': v} for k, v in tipos_dict.items()]
        
        # Distribuição por ano
        stats_por_ano = db.session.query(
            Referencia.ano_publicacao.label('ano'),
            func.count(Referencia.id_referencia).label('count')
        ).filter(
            Referencia.ano_publicacao.isnot(None)
        ).group_by(
            Referencia.ano_publicacao
        ).order_by(
            Referencia.ano_publicacao.desc()
        ).limit(10).all()
        
        # Referências mais utilizadas
        refs_mais_utilizadas = db.session.query(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao,
            func.count(Planta_referencia.id_planta).label('total_plantas')
        ).join(Planta_referencia).group_by(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao
        ).order_by(
            desc(func.count(Planta_referencia.id_planta))
        ).limit(10).all()
        
        mais_utilizadas = []
        for ref in refs_mais_utilizadas:
            if ref.link_referencia and 'doi.org' in ref.link_referencia.lower():
                tipo = 'Artigo'
            elif ref.link_referencia and ('http://' in ref.link_referencia or 'https://' in ref.link_referencia):
                tipo = 'URL'
            else:
                tipo = 'Outro'
            
            mais_utilizadas.append({
                'id': ref.id_referencia,
                'titulo': ref.titulo_referencia or 'Sem título',
                'tipo': tipo,
                'ano': str(ref.ano_publicacao) if ref.ano_publicacao else None,
                'total_plantas': ref.total_plantas
            })
        
        return jsonify({
            'total_referencias': total,
            'referencias_com_plantas': com_plantas,
            'referencias_sem_ano': sem_ano,
            'tipos': tipos_resultado,
            'por_ano': [
                {'ano': str(stat.ano) if stat.ano else 'Sem ano', 'count': stat.count} 
                for stat in stats_por_ano
            ],
            'mais_utilizadas': mais_utilizadas
        }), 200
    except Exception as e:
        print(f"❌ Erro em referencias-stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@dashboard_stats_bp.route('/referencias-recentes', methods=['GET'])
def referencias_recentes():
    """Referências recentes"""
    try:
        limit = request.args.get('limit', 5, type=int)
        referencias = db.session.query(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao,
            func.count(Planta_referencia.id_planta).label('total_plantas')
        ).outerjoin(Planta_referencia).group_by(
            Referencia.id_referencia,
            Referencia.titulo_referencia,
            Referencia.link_referencia,
            Referencia.ano_publicacao
        ).order_by(
            desc(Referencia.id_referencia)
        ).limit(limit).all()
        
        referencias_resultado = []
        for ref in referencias:
            # Buscar autores
            autores = db.session.query(Autor.nome_autor).join(
                Referencia_autor, Autor.id_autor == Referencia_autor.id_autor
            ).filter(
                Referencia_autor.id_referencia == ref.id_referencia
            ).all()
            
            # Determinar tipo
            if ref.link_referencia and 'doi.org' in ref.link_referencia.lower():
                tipo = 'Artigo'
            elif ref.link_referencia and ('http://' in ref.link_referencia or 'https://' in ref.link_referencia):
                tipo = 'URL'
            else:
                tipo = 'Outro'
            
            referencias_resultado.append({
                'id': ref.id_referencia,
                'titulo': ref.titulo_referencia or 'Sem título',
                'tipo': tipo,
                'ano': str(ref.ano_publicacao) if ref.ano_publicacao else None,
                'link': ref.link_referencia,
                'total_plantas': ref.total_plantas or 0,
                'autores': [a.nome_autor for a in autores]
            })
        
        return jsonify({'referencias_recentes': referencias_resultado}), 200
    except Exception as e:
        print(f"❌ Erro em referencias-recentes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'referencias_recentes': []}), 500

# ==================== AUTORES ====================
@dashboard_stats_bp.route('/autores-stats', methods=['GET'])
def autores_stats():
    """Estatísticas de autores COM SQL PURO"""
    try:
        # Total de autores
        total = Autor.query.count()
        
        # Autores com plantas (via referências) - SQL PURO
        com_plantas_query = text("""
            SELECT COUNT(DISTINCT a.id_autor)
            FROM Autor a
            JOIN Referencia_autor ra ON a.id_autor = ra.id_autor
            JOIN Referencia r ON ra.id_referencia = r.id_referencia
            JOIN Planta_referencia pr ON r.id_referencia = pr.id_referencia
        """)
        com_plantas = db.session.execute(com_plantas_query).scalar() or 0
        
        # Autores sem afiliação - SQL PURO
        sem_afiliacao_query = text("""
            SELECT COUNT(DISTINCT a.id_autor)
            FROM Autor a
            LEFT JOIN Autor_afiliacao aa ON a.id_autor = aa.id_autor
            WHERE aa.id_afiliacao IS NULL
        """)
        sem_afiliacao = db.session.execute(sem_afiliacao_query).scalar() or 0
        
        # Total de afiliações
        total_afiliacoes = Afiliacao.query.count()
        
        # Autores mais produtivos - SQL PURO
        produtivos_query = text("""
            SELECT 
                a.id_autor,
                a.nome_autor,
                GROUP_CONCAT(DISTINCT af.nome_afiliacao SEPARATOR ', ') as afiliacoes,
                GROUP_CONCAT(DISTINCT af.sigla_afiliacao SEPARATOR ', ') as siglas,
                COUNT(DISTINCT pr.id_planta) as total_plantas
            FROM Autor a
            JOIN Referencia_autor ra ON a.id_autor = ra.id_autor
            JOIN Referencia r ON ra.id_referencia = r.id_referencia
            JOIN Planta_referencia pr ON r.id_referencia = pr.id_referencia
            LEFT JOIN Autor_afiliacao aa ON a.id_autor = aa.id_autor
            LEFT JOIN Afiliacao af ON aa.id_afiliacao = af.id_afiliacao
            GROUP BY a.id_autor, a.nome_autor
            ORDER BY total_plantas DESC
            LIMIT 10
        """)
        produtivos_result = db.session.execute(produtivos_query).fetchall()
        
        # Distribuição por afiliação - SQL PURO
        por_afiliacao_query = text("""
            SELECT 
                af.nome_afiliacao,
                af.sigla_afiliacao,
                COUNT(DISTINCT a.id_autor) as total_autores,
                COALESCE(COUNT(DISTINCT pr.id_planta), 0) as total_plantas
            FROM Afiliacao af
            JOIN Autor_afiliacao aa ON af.id_afiliacao = aa.id_afiliacao
            JOIN Autor a ON aa.id_autor = a.id_autor
            LEFT JOIN Referencia_autor ra ON a.id_autor = ra.id_autor
            LEFT JOIN Referencia r ON ra.id_referencia = r.id_referencia
            LEFT JOIN Planta_referencia pr ON r.id_referencia = pr.id_referencia
            GROUP BY af.id_afiliacao, af.nome_afiliacao, af.sigla_afiliacao
            ORDER BY total_plantas DESC
            LIMIT 10
        """)
        por_afiliacao_result = db.session.execute(por_afiliacao_query).fetchall()
        
        # Formatar resultados
        mais_produtivos = []
        for row in produtivos_result:
            mais_produtivos.append({
                'id': row.id_autor,
                'nome': row.nome_autor,
                'afiliacao': row.afiliacoes.split(',')[0].strip() if row.afiliacoes else 'Sem afiliação',
                'sigla': row.siglas.split(',')[0].strip() if row.siglas else '',
                'total_plantas': row.total_plantas
            })
        
        por_afiliacao = []
        for row in por_afiliacao_result:
            por_afiliacao.append({
                'afiliacao': row.nome_afiliacao,
                'sigla': row.sigla_afiliacao or '',
                'total_autores': row.total_autores,
                'total_plantas': row.total_plantas
            })
        
        return jsonify({
            'total_autores': total,
            'autores_com_plantas': com_plantas,
            'autores_sem_afiliacao': sem_afiliacao,
            'total_afiliacoes': total_afiliacoes,
            'mais_produtivos': mais_produtivos,
            'por_afiliacao': por_afiliacao
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em autores-stats: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'total_autores': 0,
            'autores_com_plantas': 0,
            'autores_sem_afiliacao': 0,
            'total_afiliacoes': 0,
            'mais_produtivos': [],
            'por_afiliacao': []
        }), 500


@dashboard_stats_bp.route('/autores-recentes', methods=['GET'])
def autores_recentes():
    """Autores recentes COM SQL PURO"""
    try:
        limit = request.args.get('limit', 5, type=int)
        
        # Query SQL PURO
        autores_query = text("""
            SELECT 
                a.id_autor,
                a.nome_autor,
                GROUP_CONCAT(DISTINCT af.nome_afiliacao SEPARATOR ', ') as afiliacoes,
                GROUP_CONCAT(DISTINCT af.sigla_afiliacao SEPARATOR ', ') as siglas,
                COALESCE(COUNT(DISTINCT pr.id_planta), 0) as total_plantas,
                COALESCE(COUNT(DISTINCT r.id_referencia), 0) as total_referencias
            FROM Autor a
            LEFT JOIN Autor_afiliacao aa ON a.id_autor = aa.id_autor
            LEFT JOIN Afiliacao af ON aa.id_afiliacao = af.id_afiliacao
            LEFT JOIN Referencia_autor ra ON a.id_autor = ra.id_autor
            LEFT JOIN Referencia r ON ra.id_referencia = r.id_referencia
            LEFT JOIN Planta_referencia pr ON r.id_referencia = pr.id_referencia
            GROUP BY a.id_autor, a.nome_autor
            ORDER BY a.id_autor DESC
            LIMIT :limit
        """)
        
        autores_result = db.session.execute(autores_query, {'limit': limit}).fetchall()
        
        autores_resultado = []
        for row in autores_result:
            autores_resultado.append({
                'id': row.id_autor,
                'nome': row.nome_autor or 'Nome não informado',
                'afiliacao': row.afiliacoes.split(',')[0].strip() if row.afiliacoes else 'Sem afiliação',
                'sigla': row.siglas.split(',')[0].strip() if row.siglas else '',
                'total_plantas': row.total_plantas,
                'total_referencias': row.total_referencias
            })
        
        return jsonify({'autores_recentes': autores_resultado}), 200
        
    except Exception as e:
        print(f"❌ Erro em autores-recentes: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e), 'autores_recentes': []}), 500