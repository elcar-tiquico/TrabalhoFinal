#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Admin - Gestão de Famílias
Autor: Sistema de Plantas Medicinais
Descrição: Rotas para consulta e edição de famílias (agora como atributo das plantas)
"""
from flask import Blueprint, jsonify, request
from models.planta import db, Planta_medicinal
from sqlalchemy import func, desc, asc
from sqlalchemy.exc import SQLAlchemyError

admin_familias_bp = Blueprint('admin_familias', __name__)

# ==================== LISTAGEM DE FAMÍLIAS ====================
@admin_familias_bp.route('/familias', methods=['GET'])
def listar_familias():
    """
    Listar todas as famílias (agregadas das plantas) com paginação e busca
    
    Query Params:
        - page (int): Número da página (default: 1)
        - limit (int): Itens por página (default: 10)
        - search (str): Termo de busca no nome da família
        - sort_by (str): Campo de ordenação ('nome_familia' ou 'total_plantas')
        - sort_order (str): Ordem ('asc' ou 'desc')
    
    Returns:
        JSON com lista de famílias agregadas e metadados de paginação
    """
    try:
        # Parâmetros de paginação
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '').strip()
        sort_by = request.args.get('sort_by', 'nome_familia')
        sort_order = request.args.get('sort_order', 'asc')
        
        # Validações
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 10
        if sort_by not in ['nome_familia', 'total_plantas']:
            sort_by = 'nome_familia'
        if sort_order not in ['asc', 'desc']:
            sort_order = 'asc'
        
        # Query base: agregar famílias das plantas
        query = db.session.query(
            Planta_medicinal.familia.label('nome_familia'),
            func.count(Planta_medicinal.id_planta).label('total_plantas')
        ).group_by(Planta_medicinal.familia)
        
        # Aplicar filtro de busca
        if search:
            query = query.filter(Planta_medicinal.familia.ilike(f'%{search}%'))
        
        # Total de famílias (antes da paginação)
        total = query.count()
        
        # Aplicar ordenação
        if sort_by == 'nome_familia':
            order_col = Planta_medicinal.familia
        else:  # total_plantas
            order_col = func.count(Planta_medicinal.id_planta)
        
        if sort_order == 'asc':
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))
        
        # Aplicar paginação
        offset = (page - 1) * limit
        familias = query.offset(offset).limit(limit).all()
        
        # Calcular total de páginas
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        # Formatar resposta
        familias_list = [{
            'nome_familia': f.nome_familia,
            'total_plantas': f.total_plantas
        } for f in familias]
        
        return jsonify({
            'familias': familias_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1,
            'search_applied': search if search else None
        }), 200
        
    except SQLAlchemyError as e:
        print(f"❌ Erro de banco de dados em listar_familias: {e}")
        return jsonify({
            'error': 'Erro ao consultar famílias no banco de dados',
            'details': str(e)
        }), 500
    except Exception as e:
        print(f"❌ Erro inesperado em listar_familias: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Erro interno ao listar famílias',
            'details': str(e)
        }), 500


# ==================== DETALHES DE UMA FAMÍLIA ====================
@admin_familias_bp.route('/familias/<string:nome_familia>', methods=['GET'])
def detalhes_familia(nome_familia):
    """
    Obter detalhes de uma família específica
    
    Path Params:
        - nome_familia (str): Nome da família (usado como identificador único)
    
    Returns:
        JSON com detalhes da família (nome e total de plantas)
    """
    try:
        # Buscar família
        familia_data = db.session.query(
            Planta_medicinal.familia.label('nome_familia'),
            func.count(Planta_medicinal.id_planta).label('total_plantas')
        ).filter(
            Planta_medicinal.familia == nome_familia
        ).group_by(
            Planta_medicinal.familia
        ).first()
        
        if not familia_data:
            return jsonify({
                'error': f'Família "{nome_familia}" não encontrada'
            }), 404
        
        return jsonify({
            'nome_familia': familia_data.nome_familia,
            'total_plantas': familia_data.total_plantas
        }), 200
        
    except SQLAlchemyError as e:
        print(f"❌ Erro de banco de dados em detalhes_familia: {e}")
        return jsonify({
            'error': 'Erro ao consultar família no banco de dados',
            'details': str(e)
        }), 500
    except Exception as e:
        print(f"❌ Erro inesperado em detalhes_familia: {e}")
        return jsonify({
            'error': 'Erro interno ao buscar família',
            'details': str(e)
        }), 500


# ==================== RENOMEAR FAMÍLIA ====================
@admin_familias_bp.route('/familias/rename', methods=['PUT'])
def renomear_familia():
    """
    Renomear uma família em TODAS as plantas que a possuem
    
    Body (JSON):
        {
            "old_name": "Nome Antigo",
            "new_name": "Nome Novo"
        }
    
    Validações:
        - Nomes não podem ser vazios
        - Nomes não podem ser idênticos
        - Nome antigo deve existir
        - Se nome novo já existir, faz MERGE (unifica as famílias)
    
    Returns:
        JSON com mensagem de sucesso e número de plantas afetadas
    """
    try:
        # Obter dados do request
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Corpo da requisição inválido ou vazio'
            }), 400
        
        old_name = data.get('old_name', '').strip()
        new_name = data.get('new_name', '').strip()
        
        # ===== VALIDAÇÕES =====
        
        # 1. Campos obrigatórios
        if not old_name:
            return jsonify({
                'error': 'Campo "old_name" é obrigatório e não pode estar vazio'
            }), 400
        
        if not new_name:
            return jsonify({
                'error': 'Campo "new_name" é obrigatório e não pode estar vazio'
            }), 400
        
        # 2. Nomes idênticos
        if old_name.lower() == new_name.lower():
            return jsonify({
                'error': 'O nome antigo e o novo nome são idênticos',
                'old_name': old_name,
                'new_name': new_name
            }), 400
        
        # 3. Verificar se nome antigo existe
        count_old = Planta_medicinal.query.filter_by(familia=old_name).count()
        
        if count_old == 0:
            return jsonify({
                'error': f'Família "{old_name}" não encontrada no sistema',
                'sugestao': 'Verifique se o nome está correto (case-sensitive)'
            }), 404
        
        # 4. Verificar se nome novo já existe (pode ser merge)
        count_new = Planta_medicinal.query.filter_by(familia=new_name).count()
        
        is_merge = count_new > 0
        
        # ===== EXECUTAR RENOMEAÇÃO =====
        
        # Atualizar TODAS as plantas com a família antiga para o novo nome
        plantas_atualizadas = Planta_medicinal.query.filter_by(familia=old_name).update(
            {'familia': new_name},
            synchronize_session=False  # Performance: não sincronizar sessão durante update em massa
        )
        
        # Commit da transação
        db.session.commit()
        
        # ===== RESPOSTA =====
        
        if is_merge:
            # Caso de merge: famílias unificadas
            total_final = Planta_medicinal.query.filter_by(familia=new_name).count()
            
            return jsonify({
                'message': f'Famílias unificadas com sucesso',
                'operation': 'merge',
                'old_name': old_name,
                'new_name': new_name,
                'plantas_movidas': plantas_atualizadas,
                'total_plantas_familia': total_final,
                'info': f'{plantas_atualizadas} plantas de "{old_name}" foram movidas para "{new_name}" (que já tinha {count_new} plantas)'
            }), 200
        else:
            # Caso de rename simples
            return jsonify({
                'message': f'Família renomeada com sucesso',
                'operation': 'rename',
                'old_name': old_name,
                'new_name': new_name,
                'plantas_afetadas': plantas_atualizadas,
                'info': f'Todas as {plantas_atualizadas} plantas foram atualizadas'
            }), 200
        
    except SQLAlchemyError as e:
        # Rollback em caso de erro
        db.session.rollback()
        print(f"❌ Erro de banco de dados em renomear_familia: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': 'Erro ao renomear família no banco de dados',
            'details': str(e)
        }), 500
        
    except Exception as e:
        # Rollback em caso de erro
        db.session.rollback()
        print(f"❌ Erro inesperado em renomear_familia: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': 'Erro interno ao renomear família',
            'details': str(e)
        }), 500


# ==================== VALIDAR NOME DE FAMÍLIA ====================
@admin_familias_bp.route('/familias/validate', methods=['POST'])
def validar_nome_familia():
    """
    Validar se um nome de família já existe no sistema
    
    Body (JSON):
        {
            "nome_familia": "Nome a validar"
        }
    
    Returns:
        JSON indicando se o nome existe e quantas plantas o usam
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Corpo da requisição inválido ou vazio'
            }), 400
        
        nome_familia = data.get('nome_familia', '').strip()
        
        if not nome_familia:
            return jsonify({
                'error': 'Campo "nome_familia" é obrigatório'
            }), 400
        
        # Verificar se existe
        count = Planta_medicinal.query.filter_by(familia=nome_familia).count()
        
        return jsonify({
            'nome_familia': nome_familia,
            'exists': count > 0,
            'total_plantas': count
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em validar_nome_familia: {e}")
        return jsonify({
            'error': 'Erro ao validar nome de família',
            'details': str(e)
        }), 500


# ==================== ESTATÍSTICAS DE FAMÍLIAS ====================
@admin_familias_bp.route('/familias/stats', methods=['GET'])
def estatisticas_familias():
    """
    Estatísticas gerais sobre famílias
    
    Returns:
        JSON com estatísticas agregadas
    """
    try:
        # Total de famílias únicas
        total_familias = db.session.query(
            func.count(func.distinct(Planta_medicinal.familia))
        ).scalar() or 0
        
        # Total de plantas
        total_plantas = Planta_medicinal.query.count()
        
        # Família com mais plantas
        familia_top = db.session.query(
            Planta_medicinal.familia,
            func.count(Planta_medicinal.id_planta).label('total')
        ).group_by(
            Planta_medicinal.familia
        ).order_by(
            desc('total')
        ).first()
        
        # Média de plantas por família
        media_plantas = total_plantas / total_familias if total_familias > 0 else 0
        
        return jsonify({
            'total_familias': total_familias,
            'total_plantas': total_plantas,
            'media_plantas_por_familia': round(media_plantas, 2),
            'familia_mais_plantas': {
                'nome': familia_top.familia if familia_top else None,
                'total_plantas': familia_top.total if familia_top else 0
            } if familia_top else None
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em estatisticas_familias: {e}")
        return jsonify({
            'error': 'Erro ao calcular estatísticas',
            'details': str(e)
        }), 500