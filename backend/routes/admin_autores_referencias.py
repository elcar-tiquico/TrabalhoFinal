#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Admin - Gestão de Autores e Referências
Adaptado para a nova estrutura de BD com Afiliações separadas
"""
from flask import Blueprint, jsonify, request
from models.planta import db
from models.referencia import Autor, Referencia, Referencia_autor, Planta_referencia, Afiliacao
from sqlalchemy import func, desc, or_, and_, text
from datetime import datetime

admin_autores_refs_bp = Blueprint('admin_autores_refs', __name__, url_prefix='/api/admin')

# ==================== UTILITÁRIOS ====================

def validar_paginacao(page, limit):
    """Valida e retorna parâmetros de paginação seguros"""
    try:
        page = max(1, int(page))
        limit = min(100, max(1, int(limit)))  # Máximo 100 itens por página
        return page, limit
    except (ValueError, TypeError):
        return 1, 10

def contar_plantas_autor(id_autor):
    """Conta quantas plantas únicas estão associadas a um autor"""
    try:
        count = db.session.query(
            func.count(func.distinct(Planta_referencia.id_planta))
        ).join(
            Referencia, Planta_referencia.id_referencia == Referencia.id_referencia
        ).join(
            Referencia_autor, Referencia.id_referencia == Referencia_autor.id_referencia
        ).filter(
            Referencia_autor.id_autor == id_autor
        ).scalar() or 0
        return count
    except Exception as e:
        print(f"⚠️ Erro ao contar plantas do autor {id_autor}: {e}")
        return 0

def contar_referencias_autor(id_autor):
    """Conta quantas referências um autor tem"""
    try:
        count = db.session.query(
            func.count(Referencia_autor.id_referencia)
        ).filter(
            Referencia_autor.id_autor == id_autor
        ).scalar() or 0
        return count
    except Exception as e:
        print(f"⚠️ Erro ao contar referências do autor {id_autor}: {e}")
        return 0

def buscar_afiliacoes_autor(id_autor):
    """Busca todas as afiliações de um autor"""
    try:
        # SQL RAW para evitar problemas com relacionamentos complexos
        query = text("""
            SELECT 
                a.id_afiliacao,
                a.nome_afiliacao,
                a.sigla_afiliacao
            FROM Afiliacao a
            INNER JOIN Autor_afiliacao aa ON a.id_afiliacao = aa.id_afiliacao
            WHERE aa.id_autor = :id_autor
            ORDER BY a.nome_afiliacao
        """)
        
        result = db.session.execute(query, {'id_autor': id_autor}).fetchall()
        
        return [{
            'id_afiliacao': row.id_afiliacao,
            'nome_afiliacao': row.nome_afiliacao,
            'sigla_afiliacao': row.sigla_afiliacao
        } for row in result]
    except Exception as e:
        print(f"⚠️ Erro ao buscar afiliações do autor {id_autor}: {e}")
        return []

# ==================== AUTORES - LISTAR ====================

@admin_autores_refs_bp.route('/autores', methods=['GET'])
def listar_autores():
    """
    Lista autores com paginação, busca e suas afiliações
    
    Query params:
    - page: número da página (padrão: 1)
    - limit: itens por página (padrão: 10, máx: 100)
    - search: termo de busca (nome do autor)
    """
    try:
        # Parâmetros de paginação
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '').strip()
        
        page, limit = validar_paginacao(page, limit)
        
        # Construir WHERE clause
        where_clause = ""
        params = {'limit': limit, 'offset': (page - 1) * limit}
        
        if search:
            where_clause = "WHERE a.nome_autor LIKE :search"
            params['search'] = f'%{search}%'
        
        # ✅ CONSTRUIR QUERIES COMO STRINGS PYTHON PRIMEIRO
        query_str = f"""
            SELECT 
                a.id_autor,
                a.nome_autor,
                GROUP_CONCAT(DISTINCT af.nome_afiliacao ORDER BY af.nome_afiliacao SEPARATOR '|||') as afiliacoes_nomes,
                GROUP_CONCAT(DISTINCT af.sigla_afiliacao ORDER BY af.nome_afiliacao SEPARATOR '|||') as afiliacoes_siglas,
                GROUP_CONCAT(DISTINCT af.id_afiliacao ORDER BY af.nome_afiliacao SEPARATOR '|||') as afiliacoes_ids
            FROM Autor a
            LEFT JOIN Autor_afiliacao aa ON a.id_autor = aa.id_autor
            LEFT JOIN Afiliacao af ON aa.id_afiliacao = af.id_afiliacao
            {where_clause}
            GROUP BY a.id_autor, a.nome_autor
            ORDER BY a.nome_autor ASC
            LIMIT :limit OFFSET :offset
        """
        
        count_str = f"""
            SELECT COUNT(DISTINCT a.id_autor)
            FROM Autor a
            {where_clause}
        """
        
        # ✅ CONVERTER PARA text() DEPOIS
        autores_result = db.session.execute(text(query_str), params).fetchall()
        total = db.session.execute(text(count_str), params).scalar() or 0
        
        # Formatar resultado
        autores = []
        for row in autores_result:
            # Parsear afiliações
            afiliacoes = []
            if row.afiliacoes_ids:
                ids = row.afiliacoes_ids.split('|||')
                nomes = row.afiliacoes_nomes.split('|||') if row.afiliacoes_nomes else []
                siglas = row.afiliacoes_siglas.split('|||') if row.afiliacoes_siglas else []
                
                for i, id_af in enumerate(ids):
                    if id_af:  # Ignorar vazios
                        afiliacoes.append({
                            'id_afiliacao': int(id_af),
                            'nome_afiliacao': nomes[i] if i < len(nomes) else '',
                            'sigla_afiliacao': siglas[i] if i < len(siglas) and siglas[i] else None
                        })
            
            # Contar plantas e referências
            total_plantas = contar_plantas_autor(row.id_autor)
            total_referencias = contar_referencias_autor(row.id_autor)
            
            autores.append({
                'id_autor': row.id_autor,
                'nome_autor': row.nome_autor,
                'afiliacoes': afiliacoes,
                'total_plantas': total_plantas,
                'total_referencias': total_referencias
            })
        
        # Calcular paginação
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return jsonify({
            'autores': autores,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1,
            'search_applied': search if search else None
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em listar_autores: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== AUTORES - DETALHES ====================

@admin_autores_refs_bp.route('/autores/<int:id_autor>', methods=['GET'])
def obter_autor(id_autor):
    """
    Obtém detalhes completos de um autor específico
    Inclui afiliações, contagem de plantas e referências
    """
    try:
        # Buscar autor
        autor = Autor.query.get(id_autor)
        
        if not autor:
            return jsonify({'error': 'Autor não encontrado'}), 404
        
        # Buscar afiliações
        afiliacoes = buscar_afiliacoes_autor(id_autor)
        
        # Contar associações
        total_plantas = contar_plantas_autor(id_autor)
        total_referencias = contar_referencias_autor(id_autor)
        
        # Buscar referências do autor (para detalhes)
        referencias_query = text("""
            SELECT 
                r.id_referencia,
                r.titulo_referencia,
                r.ano_publicacao
            FROM Referencia r
            INNER JOIN Referencia_autor ra ON r.id_referencia = ra.id_referencia
            WHERE ra.id_autor = :id_autor
            ORDER BY r.ano_publicacao DESC, r.titulo_referencia
            LIMIT 10
        """)
        
        referencias_result = db.session.execute(
            referencias_query, 
            {'id_autor': id_autor}
        ).fetchall()
        
        referencias_detalhes = [{
            'id_referencia': ref.id_referencia,
            'titulo_referencia': ref.titulo_referencia,
            'ano_publicacao': ref.ano_publicacao
        } for ref in referencias_result]
        
        return jsonify({
            'id_autor': autor.id_autor,
            'nome_autor': autor.nome_autor,
            'afiliacoes': afiliacoes,
            'total_plantas': total_plantas,
            'total_referencias': total_referencias,
            'referencias_recentes': referencias_detalhes
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em obter_autor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== AUTORES - ATUALIZAR ====================

@admin_autores_refs_bp.route('/autores/<int:id_autor>', methods=['PUT'])
def atualizar_autor(id_autor):
    """
    Atualiza APENAS o nome do autor
    Afiliações são geridas separadamente
    """
    try:
        # Buscar autor
        autor = Autor.query.get(id_autor)
        
        if not autor:
            return jsonify({'error': 'Autor não encontrado'}), 404
        
        # Obter dados do request
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Validar nome_autor
        nome_autor = data.get('nome_autor', '').strip()
        
        if not nome_autor:
            return jsonify({'error': 'Nome do autor é obrigatório'}), 400
        
        if len(nome_autor) > 255:
            return jsonify({'error': 'Nome do autor deve ter no máximo 255 caracteres'}), 400
        
        # Verificar se já existe outro autor com este nome
        autor_existente = Autor.query.filter(
            Autor.nome_autor == nome_autor,
            Autor.id_autor != id_autor
        ).first()
        
        if autor_existente:
            return jsonify({'error': f'Já existe um autor com o nome "{nome_autor}"'}), 409
        
        # Atualizar
        autor.nome_autor = nome_autor
        db.session.commit()
        
        # Retornar autor atualizado com afiliações
        afiliacoes = buscar_afiliacoes_autor(id_autor)
        
        return jsonify({
            'message': 'Autor atualizado com sucesso',
            'autor': {
                'id_autor': autor.id_autor,
                'nome_autor': autor.nome_autor,
                'afiliacoes': afiliacoes,
                'total_plantas': contar_plantas_autor(id_autor),
                'total_referencias': contar_referencias_autor(id_autor)
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em atualizar_autor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== AUTORES - DELETAR ====================

@admin_autores_refs_bp.route('/autores/<int:id_autor>', methods=['DELETE'])
def deletar_autor(id_autor):
    """
    Deleta um autor SE não tiver referências associadas
    Restrição: ON DELETE RESTRICT na FK Referencia_autor
    """
    try:
        # Buscar autor
        autor = Autor.query.get(id_autor)
        
        if not autor:
            return jsonify({'error': 'Autor não encontrado'}), 404
        
        # Verificar se tem referências associadas
        total_referencias = contar_referencias_autor(id_autor)
        
        if total_referencias > 0:
            return jsonify({
                'error': 'Não é possível deletar este autor',
                'message': f'Este autor tem {total_referencias} referência(s) associada(s). Remova as associações primeiro.',
                'total_referencias': total_referencias,
                'pode_deletar': False
            }), 409  # Conflict
        
        # Deletar autor (afiliações serão desassociadas automaticamente - CASCADE)
        db.session.delete(autor)
        db.session.commit()
        
        return jsonify({
            'message': f'Autor "{autor.nome_autor}" deletado com sucesso',
            'id_autor': id_autor
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em deletar_autor: {e}")
        import traceback
        traceback.print_exc()
        
        # Verificar se é erro de constraint
        error_str = str(e).lower()
        if 'foreign key' in error_str or 'constraint' in error_str:
            return jsonify({
                'error': 'Não é possível deletar este autor',
                'message': 'Este autor está associado a referências. Remova as associações primeiro.'
            }), 409
        
        return jsonify({'error': str(e)}), 500

# ==================== REFERÊNCIAS - LISTAR ====================

@admin_autores_refs_bp.route('/referencias', methods=['GET'])
def listar_referencias():
    """
    Lista referências com paginação e busca
    Inclui autores e contagem de plantas
    
    Query params:
    - page: número da página
    - limit: itens por página
    - search: busca por título ou link
    """
    try:
        # Parâmetros
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        search = request.args.get('search', '').strip()
        
        page, limit = validar_paginacao(page, limit)
        
        # Construir WHERE clause
        where_clause = ""
        params = {'limit': limit, 'offset': (page - 1) * limit}
        
        if search:
            where_clause = "WHERE (r.titulo_referencia LIKE :search OR r.link_referencia LIKE :search)"
            params['search'] = f'%{search}%'
        
        # ✅ CONSTRUIR QUERIES COMO STRINGS PRIMEIRO
        query_str = f"""
            SELECT 
                r.id_referencia,
                r.titulo_referencia,
                r.link_referencia,
                r.ano_publicacao,
                GROUP_CONCAT(DISTINCT a.nome_autor ORDER BY a.nome_autor SEPARATOR ', ') as autores,
                COUNT(DISTINCT pr.id_planta) as total_plantas
            FROM Referencia r
            LEFT JOIN Referencia_autor ra ON r.id_referencia = ra.id_referencia
            LEFT JOIN Autor a ON ra.id_autor = a.id_autor
            LEFT JOIN Planta_referencia pr ON r.id_referencia = pr.id_referencia
            {where_clause}
            GROUP BY r.id_referencia, r.titulo_referencia, r.link_referencia, r.ano_publicacao
            ORDER BY r.id_referencia DESC
            LIMIT :limit OFFSET :offset
        """
        
        count_str = f"""
            SELECT COUNT(DISTINCT r.id_referencia)
            FROM Referencia r
            {where_clause}
        """
        
        # ✅ EXECUTAR
        referencias_result = db.session.execute(text(query_str), params).fetchall()
        total = db.session.execute(text(count_str), params).scalar() or 0
        
        # Formatar resultado
        referencias = []
        for row in referencias_result:
            # Determinar tipo baseado no link
            tipo_referencia = 'Outro'
            if row.link_referencia:
                if 'doi.org' in row.link_referencia.lower():
                    tipo_referencia = 'Artigo'
                elif row.link_referencia.startswith('http'):
                    tipo_referencia = 'URL'
            
            referencias.append({
                'id_referencia': row.id_referencia,
                'titulo_referencia': row.titulo_referencia,
                'link_referencia': row.link_referencia,
                'ano_publicacao': row.ano_publicacao,
                'tipo_referencia': tipo_referencia,
                'autores': row.autores.split(', ') if row.autores else [],
                'total_plantas': row.total_plantas or 0
            })
        
        # Paginação
        total_pages = (total + limit - 1) // limit if total > 0 else 1
        
        return jsonify({
            'referencias': referencias,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': total_pages,
            'has_next': page < total_pages,
            'has_prev': page > 1,
            'search_applied': search if search else None
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em listar_referencias: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== REFERÊNCIAS - DETALHES ====================

@admin_autores_refs_bp.route('/referencias/<int:id_referencia>', methods=['GET'])
def obter_referencia(id_referencia):
    """
    Obtém detalhes completos de uma referência
    Inclui autores completos e plantas associadas
    """
    try:
        # Buscar referência
        referencia = Referencia.query.get(id_referencia)
        
        if not referencia:
            return jsonify({'error': 'Referência não encontrada'}), 404
        
        # Buscar autores com detalhes
        autores_query = text("""
            SELECT 
                a.id_autor,
                a.nome_autor,
                GROUP_CONCAT(DISTINCT af.nome_afiliacao SEPARATOR ', ') as afiliacao,
                GROUP_CONCAT(DISTINCT af.sigla_afiliacao SEPARATOR ', ') as sigla
            FROM Autor a
            INNER JOIN Referencia_autor ra ON a.id_autor = ra.id_autor
            LEFT JOIN Autor_afiliacao aa ON a.id_autor = aa.id_autor
            LEFT JOIN Afiliacao af ON aa.id_afiliacao = af.id_afiliacao
            WHERE ra.id_referencia = :id_ref
            GROUP BY a.id_autor, a.nome_autor
            ORDER BY a.nome_autor
        """)
        
        autores_result = db.session.execute(
            autores_query,
            {'id_ref': id_referencia}
        ).fetchall()
        
        autores_especificos = [{
            'id_autor': row.id_autor,
            'nome_autor': row.nome_autor,
            'afiliacao': row.afiliacao,
            'sigla_afiliacao': row.sigla
        } for row in autores_result]
        
        # Contar plantas
        total_plantas = db.session.query(
            func.count(Planta_referencia.id_planta)
        ).filter(
            Planta_referencia.id_referencia == id_referencia
        ).scalar() or 0
        
        # Determinar tipo
        tipo_referencia = 'Outro'
        if referencia.link_referencia:
            if 'doi.org' in referencia.link_referencia.lower():
                tipo_referencia = 'Artigo'
            elif referencia.link_referencia.startswith('http'):
                tipo_referencia = 'URL'
        
        return jsonify({
            'id_referencia': referencia.id_referencia,
            'titulo_referencia': referencia.titulo_referencia,
            'link_referencia': referencia.link_referencia,
            'ano_publicacao': referencia.ano_publicacao,
            'tipo_referencia': tipo_referencia,
            'total_plantas': total_plantas,
            'autores_especificos': autores_especificos
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em obter_referencia: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== REFERÊNCIAS - ATUALIZAR ====================

@admin_autores_refs_bp.route('/referencias/<int:id_referencia>', methods=['PUT'])
def atualizar_referencia(id_referencia):
    """
    Atualiza uma referência
    Campos: titulo_referencia, link_referencia, ano_publicacao
    """
    try:
        # Buscar referência
        referencia = Referencia.query.get(id_referencia)
        
        if not referencia:
            return jsonify({'error': 'Referência não encontrada'}), 404
        
        # Obter dados
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Validar titulo_referencia (obrigatório)
        titulo = data.get('titulo_referencia', '').strip()
        if not titulo:
            return jsonify({'error': 'Título da referência é obrigatório'}), 400
        
        if len(titulo) > 255:
            return jsonify({'error': 'Título deve ter no máximo 255 caracteres'}), 400
        
        # Validar link_referencia (opcional, mas único se fornecido)
        link = data.get('link_referencia', '').strip()
        if link:
            if len(link) > 255:
                return jsonify({'error': 'Link deve ter no máximo 255 caracteres'}), 400
            
            # Verificar se já existe
            ref_existente = Referencia.query.filter(
                Referencia.link_referencia == link,
                Referencia.id_referencia != id_referencia
            ).first()
            
            if ref_existente:
                return jsonify({'error': 'Já existe uma referência com este link'}), 409
        
        # Validar ano_publicacao (opcional)
        ano = data.get('ano_publicacao')
        if ano:
            try:
                ano = int(ano)
                if ano < 1900 or ano > datetime.now().year + 1:
                    return jsonify({'error': 'Ano de publicação inválido'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Ano de publicação deve ser um número'}), 400
        else:
            ano = None
        
        # Atualizar
        referencia.titulo_referencia = titulo
        referencia.link_referencia = link if link else None
        referencia.ano_publicacao = ano
        
        db.session.commit()
        
        # Retornar atualizado
        return jsonify({
            'message': 'Referência atualizada com sucesso',
            'referencia': {
                'id_referencia': referencia.id_referencia,
                'titulo_referencia': referencia.titulo_referencia,
                'link_referencia': referencia.link_referencia,
                'ano_publicacao': referencia.ano_publicacao
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em atualizar_referencia: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== REFERÊNCIAS - DELETAR ====================

@admin_autores_refs_bp.route('/referencias/<int:id_referencia>', methods=['DELETE'])
def deletar_referencia(id_referencia):
    """
    Deleta uma referência SE não tiver plantas associadas
    Restrição: ON DELETE RESTRICT na FK Planta_referencia
    """
    try:
        # Buscar referência
        referencia = Referencia.query.get(id_referencia)
        
        if not referencia:
            return jsonify({'error': 'Referência não encontrada'}), 404
        
        # Verificar plantas associadas
        total_plantas = db.session.query(
            func.count(Planta_referencia.id_planta)
        ).filter(
            Planta_referencia.id_referencia == id_referencia
        ).scalar() or 0
        
        if total_plantas > 0:
            return jsonify({
                'error': 'Não é possível deletar esta referência',
                'message': f'Esta referência tem {total_plantas} planta(s) associada(s). Remova as associações primeiro.',
                'total_plantas': total_plantas,
                'pode_deletar': False
            }), 409
        
        # Deletar (autores serão desassociados automaticamente - CASCADE)
        titulo = referencia.titulo_referencia
        db.session.delete(referencia)
        db.session.commit()
        
        return jsonify({
            'message': f'Referência "{titulo}" deletada com sucesso',
            'id_referencia': id_referencia
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em deletar_referencia: {e}")
        import traceback
        traceback.print_exc()
        
        # Verificar constraint
        error_str = str(e).lower()
        if 'foreign key' in error_str or 'constraint' in error_str:
            return jsonify({
                'error': 'Não é possível deletar esta referência',
                'message': 'Esta referência está associada a plantas. Remova as associações primeiro.'
            }), 409
        
        return jsonify({'error': str(e)}), 500

# ==================== AFILIAÇÕES - LISTAR ====================

@admin_autores_refs_bp.route('/afiliacoes', methods=['GET'])
def listar_afiliacoes():
    """
    Lista todas as afiliações disponíveis
    Útil para selects/dropdowns no frontend
    """
    try:
        afiliacoes = Afiliacao.query.order_by(Afiliacao.nome_afiliacao).all()
        
        return jsonify({
            'afiliacoes': [{
                'id_afiliacao': af.id_afiliacao,
                'nome_afiliacao': af.nome_afiliacao,
                'sigla_afiliacao': af.sigla_afiliacao
            } for af in afiliacoes]
        }), 200
        
    except Exception as e:
        print(f"❌ Erro em listar_afiliacoes: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== AFILIAÇÕES - CRIAR ====================

@admin_autores_refs_bp.route('/afiliacoes', methods=['POST'])
def criar_afiliacao():
    """
    Cria uma nova afiliação
    Body: { nome_afiliacao, sigla_afiliacao }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Validar nome_afiliacao
        nome = data.get('nome_afiliacao', '').strip()
        if not nome:
            return jsonify({'error': 'Nome da afiliação é obrigatório'}), 400
        
        if len(nome) > 255:
            return jsonify({'error': 'Nome deve ter no máximo 255 caracteres'}), 400
        
        # Verificar se já existe
        existe = Afiliacao.query.filter(
            Afiliacao.nome_afiliacao == nome
        ).first()
        
        if existe:
            return jsonify({'error': f'Já existe uma afiliação com o nome "{nome}"'}), 409
        
        # Validar sigla (opcional)
        sigla = data.get('sigla_afiliacao', '').strip()
        if sigla and len(sigla) > 20:
            return jsonify({'error': 'Sigla deve ter no máximo 20 caracteres'}), 400
        
        # Criar
        nova_afiliacao = Afiliacao(
            nome_afiliacao=nome,
            sigla_afiliacao=sigla if sigla else None
        )
        
        db.session.add(nova_afiliacao)
        db.session.commit()
        
        return jsonify({
            'message': 'Afiliação criada com sucesso',
            'afiliacao': {
                'id_afiliacao': nova_afiliacao.id_afiliacao,
                'nome_afiliacao': nova_afiliacao.nome_afiliacao,
                'sigla_afiliacao': nova_afiliacao.sigla_afiliacao
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em criar_afiliacao: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== AUTOR - ADICIONAR AFILIAÇÃO ====================

@admin_autores_refs_bp.route('/autores/<int:id_autor>/afiliacoes', methods=['POST'])
def adicionar_afiliacao_autor(id_autor):
    """
    Adiciona uma afiliação a um autor
    Body: { id_afiliacao }
    """
    try:
        # Verificar se autor existe
        autor = Autor.query.get(id_autor)
        if not autor:
            return jsonify({'error': 'Autor não encontrado'}), 404
        
        # Obter dados
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        id_afiliacao = data.get('id_afiliacao')
        if not id_afiliacao:
            return jsonify({'error': 'ID da afiliação é obrigatório'}), 400
        
        # Verificar se afiliação existe
        afiliacao = Afiliacao.query.get(id_afiliacao)
        if not afiliacao:
            return jsonify({'error': 'Afiliação não encontrada'}), 404
        
        # Verificar se já está associada
        existe_query = text("""
            SELECT COUNT(*) 
            FROM Autor_afiliacao 
            WHERE id_autor = :id_autor AND id_afiliacao = :id_afiliacao
        """)
        
        existe = db.session.execute(
            existe_query, 
            {'id_autor': id_autor, 'id_afiliacao': id_afiliacao}
        ).scalar()
        
        if existe > 0:
            return jsonify({
                'error': f'O autor já está associado à afiliação "{afiliacao.nome_afiliacao}"'
            }), 409
        
        # Adicionar associação
        insert_query = text("""
            INSERT INTO Autor_afiliacao (id_autor, id_afiliacao)
            VALUES (:id_autor, :id_afiliacao)
        """)
        
        db.session.execute(
            insert_query,
            {'id_autor': id_autor, 'id_afiliacao': id_afiliacao}
        )
        db.session.commit()
        
        return jsonify({
            'message': f'Afiliação "{afiliacao.nome_afiliacao}" adicionada ao autor',
            'afiliacao': {
                'id_afiliacao': afiliacao.id_afiliacao,
                'nome_afiliacao': afiliacao.nome_afiliacao,
                'sigla_afiliacao': afiliacao.sigla_afiliacao
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em adicionar_afiliacao_autor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== AUTOR - REMOVER AFILIAÇÃO ====================

@admin_autores_refs_bp.route('/autores/<int:id_autor>/afiliacoes/<int:id_afiliacao>', methods=['DELETE'])
def remover_afiliacao_autor(id_autor, id_afiliacao):
    """
    Remove uma afiliação de um autor
    """
    try:
        # Verificar se autor existe
        autor = Autor.query.get(id_autor)
        if not autor:
            return jsonify({'error': 'Autor não encontrado'}), 404
        
        # Verificar se afiliação existe
        afiliacao = Afiliacao.query.get(id_afiliacao)
        if not afiliacao:
            return jsonify({'error': 'Afiliação não encontrada'}), 404
        
        # Verificar se associação existe
        existe_query = text("""
            SELECT COUNT(*) 
            FROM Autor_afiliacao 
            WHERE id_autor = :id_autor AND id_afiliacao = :id_afiliacao
        """)
        
        existe = db.session.execute(
            existe_query,
            {'id_autor': id_autor, 'id_afiliacao': id_afiliacao}
        ).scalar()
        
        if existe == 0:
            return jsonify({
                'error': f'O autor não está associado à afiliação "{afiliacao.nome_afiliacao}"'
            }), 404
        
        # Remover associação
        delete_query = text("""
            DELETE FROM Autor_afiliacao 
            WHERE id_autor = :id_autor AND id_afiliacao = :id_afiliacao
        """)
        
        db.session.execute(
            delete_query,
            {'id_autor': id_autor, 'id_afiliacao': id_afiliacao}
        )
        db.session.commit()
        
        return jsonify({
            'message': f'Afiliação "{afiliacao.nome_afiliacao}" removida do autor'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erro em remover_afiliacao_autor: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@admin_autores_refs_bp.route('/health', methods=['GET'])
def health_check():
    """Health check do módulo"""
    return jsonify({
        'status': 'healthy',
        'service': 'admin_autores_referencias',
        'database': 'db_plantas_medicinais',
        'endpoints': {
            'autores': ['GET /autores', 'GET /autores/:id', 'PUT /autores/:id', 'DELETE /autores/:id'],
            'referencias': ['GET /referencias', 'GET /referencias/:id', 'PUT /referencias/:id', 'DELETE /referencias/:id'],
            'afiliacoes': ['GET /afiliacoes']
        }
    }), 200