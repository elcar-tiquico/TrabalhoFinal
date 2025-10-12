#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas CRUD de Plantas - ADAPTADO À NOVA BD
"""
from flask import Blueprint, request, jsonify
from models.planta import db, Planta_medicinal, Nome_comum, Imagem
from models.localizacao import Provincia, Local_colheita, Planta_local
from models.uso_medicinal import Parte_usada, Indicacao, Planta_parte, Parte_indicacao
from models.referencia import Autor, Referencia, Planta_referencia, Referencia_autor
from models.usuario import LogPesquisas
from sqlalchemy import or_

plantas_bp = Blueprint('plantas', __name__)

def handle_error(e, message="Erro ao processar requisição"):
    """Tratamento de erros padronizado"""
    print(f"❌ Erro: {e}")
    return jsonify({'error': message, 'details': str(e)}), 500

# =====================================================
# GET - LISTAR PLANTAS (com filtros avançados)
# =====================================================
@plantas_bp.route('/plantas', methods=['GET'])
def get_plantas():
    """
    Buscar plantas com filtros
    ADAPTADO: familia agora é campo texto, não FK
    """
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Parâmetros de busca
        search_popular = request.args.get('search_popular', '')
        search_cientifico = request.args.get('search_cientifico', '')
        search = request.args.get('search', '')
        
        # Filtros específicos
        autor_id = request.args.get('autor_id', type=int)
        provincia_id = request.args.get('provincia_id', type=int)
        familia_nome = request.args.get('familia', '')  # ✅ MUDOU: agora busca por nome
        parte_usada = request.args.get('parte_usada', '')
        indicacao_id = request.args.get('indicacao_id', type=int)
        
        # Query base
        query = Planta_medicinal.query
        
        # Filtro por nome popular
        if search_popular:
            query = query.join(Planta_medicinal.nomes_comuns).filter(
                Nome_comum.nome.ilike(f'%{search_popular}%')
            )
        
        # Filtro por nome científico
        if search_cientifico:
            query = query.filter(
                Planta_medicinal.nome_cientifico.ilike(f'%{search_cientifico}%')
            )
        
        # Filtro geral (científico OU popular)
        if search and not search_popular and not search_cientifico:
            query = query.outerjoin(Planta_medicinal.nomes_comuns).filter(
                or_(
                    Planta_medicinal.nome_cientifico.ilike(f'%{search}%'),
                    Nome_comum.nome.ilike(f'%{search}%')
                )
            )
        
        # ✅ NOVO: Filtro por família (agora é campo texto!)
        if familia_nome:
            query = query.filter(
                Planta_medicinal.familia.ilike(f'%{familia_nome}%')
            )
        
        # Filtro por província (ADAPTADO: precisa de 2 JOINs agora!)
        if provincia_id:
            query = query.join(Planta_medicinal.locais).join(
                Local_colheita
            ).filter(Local_colheita.id_provincia == provincia_id)
        
# Filtro por parte usada - CORRIGIDO
        if parte_usada:
            try:
                # Se vier ID (número), buscar por ID
                parte_id = int(parte_usada)
                query = query.join(Planta_medicinal.partes_usadas).join(
                    Parte_usada
                ).filter(Parte_usada.id_parte == parte_id)
            except ValueError:
                # Se vier texto, buscar por nome
                query = query.join(Planta_medicinal.partes_usadas).join(
                    Parte_usada
                ).filter(Parte_usada.nome_parte.ilike(f'%{parte_usada}%'))
        
        # Filtro por indicação (ADAPTADO: nova estrutura)
        if indicacao_id:
            query = query.join(Planta_medicinal.partes_usadas).join(
                Parte_usada
            ).join(Parte_usada.indicacoes).filter(
                Parte_indicacao.id_uso == indicacao_id
            )
        
        # Filtro por autor (mantido)
        if autor_id:
            query = query.join(Planta_medicinal.referencias).join(
                Referencia
            ).join(Referencia.autores_relacao).filter(
                Referencia_autor.id_autor == autor_id
            )
        
        # Remover duplicatas
        query = query.distinct()
        
        # Executar query com paginação
        plantas = query.paginate(page=page, per_page=per_page, error_out=False)
        
        return jsonify({
            'plantas': [planta.to_dict() for planta in plantas.items],
            'total': plantas.total,
            'pages': plantas.pages,
            'current_page': page,
            'per_page': per_page
        })
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar plantas")


# =====================================================
# GET - DETALHES DE UMA PLANTA
# =====================================================
@plantas_bp.route('/plantas/<int:planta_id>', methods=['GET'])
def get_planta_detalhes(planta_id):
    """
    Buscar detalhes completos de uma planta
    ADAPTADO: inclui todas as relações da nova estrutura
    """
    try:
        planta = Planta_medicinal.query.get_or_404(planta_id)
        
        # Registrar visualização
        try:
            log = LogPesquisas(
                termo_pesquisa=planta.nome_cientifico,
                tipo_pesquisa='visualizacao_detalhes',
                resultados_encontrados=1,
                ip_usuario=request.remote_addr,
                user_agent=request.headers.get('User-Agent', '')[:500]
            )
            db.session.add(log)
            db.session.commit()
        except:
            pass  # Não falhar se log der erro
        
        return jsonify(planta.to_dict(include_relations=True))
        
    except Exception as e:
        return handle_error(e, "Erro ao buscar detalhes da planta")


# =====================================================
# POST - CRIAR PLANTA
# =====================================================
@plantas_bp.route('/plantas', methods=['POST'])
def create_planta():
    """
    Criar nova planta
    ADAPTADO: família agora é texto, localização usa Local_colheita
    """
    try:
        data = request.get_json()
        
        if not data or 'nome_cientifico' not in data:
            return jsonify({'error': 'Nome científico é obrigatório'}), 400
        
        # ✅ Criar planta (familia agora é STRING!)
        planta = Planta_medicinal(
            nome_cientifico=data['nome_cientifico'],
            familia=data.get('familia', ''),  # ✅ MUDOU: texto direto
            infos_adicionais=data.get('infos_adicionais'),
            comp_quimica=data.get('comp_quimica'),
            prop_farmacologica=data.get('prop_farmacologica')
        )
        
        db.session.add(planta)
        db.session.flush()  # Para obter o ID
        
        # Adicionar nomes comuns
        if 'nomes_comuns' in data:
            for nome in data['nomes_comuns']:
                if nome:  # Ignorar strings vazias
                    nc = Nome_comum(nome=nome, id_planta=planta.id_planta)
                    db.session.add(nc)
        
        # ✅ MUDOU: Adicionar localização (agora precisa criar Local_colheita)
        if 'provincias' in data:
            for prov_data in data['provincias']:
                provincia_id = prov_data if isinstance(prov_data, int) else prov_data.get('id_provincia')
                local_nome = prov_data.get('local', 'Local não especificado') if isinstance(prov_data, dict) else 'Local não especificado'
                
                # Criar ou buscar local
                local = Local_colheita(
                    nome_local=local_nome,
                    id_provincia=provincia_id
                )
                db.session.add(local)
                db.session.flush()
                
                # Associar planta ao local
                pl = Planta_local(
                    id_planta=planta.id_planta,
                    id_local=local.id_local
                )
                db.session.add(pl)
        
        # ✅ MUDOU: Adicionar partes usadas (nova estrutura)
        if 'partes_usadas' in data:
            for parte_data in data['partes_usadas']:
                parte_id = parte_data if isinstance(parte_data, int) else parte_data.get('id_parte')
                
                # Criar associação planta-parte
                pp = Planta_parte(
                    id_planta=planta.id_planta,
                    id_parte=parte_id
                )
                db.session.add(pp)
                
                # Se tem indicações, associar parte-indicação
                if isinstance(parte_data, dict) and 'indicacoes' in parte_data:
                    for ind_id in parte_data['indicacoes']:
                        pi = Parte_indicacao(
                            id_parte=parte_id,
                            id_uso=ind_id
                        )
                        db.session.add(pi)
        
        # Adicionar referências
        if 'referencias' in data:
            for ref_id in data['referencias']:
                pr = Planta_referencia(
                    id_planta=planta.id_planta,
                    id_referencia=ref_id
                )
                db.session.add(pr)
        
        db.session.commit()
        
        return jsonify(planta.to_dict(include_relations=True)), 201
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar planta")


# =====================================================
# PUT - ATUALIZAR PLANTA
# =====================================================
@plantas_bp.route('/plantas/<int:planta_id>', methods=['PUT'])
def update_planta(planta_id):
    """
    Atualizar planta existente
    ADAPTADO: nova estrutura de relações
    """
    try:
        planta = Planta_medicinal.query.get_or_404(planta_id)
        data = request.get_json()
        
        # Atualizar campos simples
        if 'nome_cientifico' in data:
            planta.nome_cientifico = data['nome_cientifico']
        if 'familia' in data:
            planta.familia = data['familia']  # ✅ MUDOU: campo texto
        if 'infos_adicionais' in data:
            planta.infos_adicionais = data['infos_adicionais']
        if 'comp_quimica' in data:
            planta.comp_quimica = data['comp_quimica']
        if 'prop_farmacologica' in data:
            planta.prop_farmacologica = data['prop_farmacologica']
        
        # Atualizar nomes comuns (se fornecidos)
        if 'nomes_comuns' in data:
            # Remover nomes antigos
            Nome_comum.query.filter_by(id_planta=planta_id).delete()
            
            # Adicionar novos
            for nome in data['nomes_comuns']:
                if nome:
                    nc = Nome_comum(nome=nome, id_planta=planta_id)
                    db.session.add(nc)
        
        db.session.commit()
        
        return jsonify(planta.to_dict(include_relations=True))
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao atualizar planta")


# =====================================================
# DELETE - EXCLUIR PLANTA
# =====================================================
@plantas_bp.route('/plantas/<int:planta_id>', methods=['DELETE'])
def delete_planta(planta_id):
    """Excluir planta (CASCADE remove relações automaticamente)"""
    try:
        planta = Planta_medicinal.query.get_or_404(planta_id)
        
        db.session.delete(planta)
        db.session.commit()
        
        return jsonify({'message': 'Planta excluída com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao excluir planta")
    
    