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
        provincia = request.args.get('provincia', '')  # ✅ NOVO
        
        query = Planta_medicinal.query
        
        # ✅ CORREÇÃO: Buscar também nos nomes comuns
        if search:
            # Subquery para buscar plantas que tenham nomes comuns correspondentes
            plantas_com_nome_comum = db.session.query(Nome_comum.id_planta).filter(
                Nome_comum.nome.ilike(f'%{search}%')
            ).distinct().subquery()
            
            query = query.filter(or_(
                Planta_medicinal.nome_cientifico.ilike(f'%{search}%'),
                Planta_medicinal.familia.ilike(f'%{search}%'),
                Planta_medicinal.id_planta.in_(plantas_com_nome_comum)  # ✅ BUSCA NOS NOMES COMUNS
            ))
        
        if familia:
            query = query.filter(Planta_medicinal.familia.ilike(f'%{familia}%'))
        
        # ✅ NOVO: Filtrar por província através de Local_colheita
        if provincia:
            from models.localizacao import Provincia, Local_colheita, Planta_local
            
            # Subquery para buscar plantas que estão em locais desta província
            plantas_da_provincia = db.session.query(Planta_local.id_planta).join(
                Local_colheita, Planta_local.id_local == Local_colheita.id_local
            ).join(
                Provincia, Local_colheita.id_provincia == Provincia.id_provincia
            ).filter(
                Provincia.provincia.ilike(f'%{provincia}%')
            ).distinct().subquery()
            
            query = query.filter(Planta_medicinal.id_planta.in_(plantas_da_provincia))
        
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        plantas = []
        for p in pagination.items:
            planta_dict = p.to_dict()
            planta_dict['nomes_comuns'] = [nc.nome for nc in p.nomes_comuns]
            plantas.append(planta_dict)
        
        return jsonify({
            'plantas': plantas,
            'total': pagination.total,  # ✅ ADICIONADO
            'page': pagination.page,
            'limit': pagination.per_page,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
            # Mantém compatibilidade com formato antigo
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


# ✅ NOVA ROTA: Busca Avançada (movida de dashboard_busca.py)
@dashboard_crud_bp.route('/plantas/busca-avancada', methods=['GET'])
def busca_avancada():
    """
    Busca avançada de plantas por diferentes critérios
    Parâmetros: autor, parte_usada, indicacao, page, limit
    """
    try:
        from models.referencia import Autor, Referencia, Referencia_autor, Planta_referencia
        from models.uso_medicinal import Parte_usada, Indicacao, Parte_indicacao, Planta_parte
        from models.localizacao import Provincia, Local_colheita, Planta_local
        from sqlalchemy import distinct
        
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 10, type=int)
        
        # Parâmetros de busca
        autor = request.args.get('autor', '')
        parte_usada = request.args.get('parte_usada', '')
        indicacao = request.args.get('indicacao', '')
        
        query = Planta_medicinal.query
        
        # ✅ Busca por AUTOR (através de Referências)
        if autor:
            # Caminho: Planta → Planta_referencia → Referencia → Referencia_autor → Autor
            plantas_do_autor = db.session.query(distinct(Planta_referencia.id_planta)).join(
                Referencia, Planta_referencia.id_referencia == Referencia.id_referencia
            ).join(
                Referencia_autor, Referencia.id_referencia == Referencia_autor.id_referencia
            ).join(
                Autor, Referencia_autor.id_autor == Autor.id_autor
            ).filter(
                Autor.nome_autor.ilike(f'%{autor}%')
            ).subquery()
            
            query = query.filter(Planta_medicinal.id_planta.in_(plantas_do_autor))
        
        # ✅ Busca por PARTE USADA
        if parte_usada:
            # Subquery: plantas que usam esta parte
            plantas_com_parte = db.session.query(Planta_parte.id_planta).join(
                Parte_usada, Planta_parte.id_parte == Parte_usada.id_parte
            ).filter(
                Parte_usada.nome_parte.ilike(f'%{parte_usada}%')
            ).distinct().subquery()
            
            query = query.filter(Planta_medicinal.id_planta.in_(plantas_com_parte))
        
        # ✅ Busca por INDICAÇÃO
        if indicacao:
            # Subquery: plantas que têm esta indicação
            # Planta → Planta_parte → Parte_indicacao → Indicacao
            plantas_com_indicacao = db.session.query(distinct(Planta_parte.id_planta)).join(
                Parte_indicacao, Planta_parte.id_parte == Parte_indicacao.id_parte
            ).join(
                Indicacao, Parte_indicacao.id_uso == Indicacao.id_uso
            ).filter(
                Indicacao.descricao_uso.ilike(f'%{indicacao}%')
            ).subquery()
            
            query = query.filter(Planta_medicinal.id_planta.in_(plantas_com_indicacao))
        
        # Paginação
        pagination = query.paginate(page=page, per_page=limit, error_out=False)
        
        # Formatar resultado
        plantas = []
        for p in pagination.items:
            planta_dict = p.to_dict()
            planta_dict['nomes_comuns'] = [nc.nome for nc in p.nomes_comuns]
            plantas.append(planta_dict)
        
        return jsonify({
            'plantas': plantas,
            'total': pagination.total,  # ✅ ADICIONADO
            'page': pagination.page,
            'limit': pagination.per_page,
            'total_pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev,
            # Mantém compatibilidade
            'pagination': {
                'page': pagination.page,
                'per_page': pagination.per_page,
                'total': pagination.total,
                'pages': pagination.pages
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Erro na busca avançada: {e}")
        return jsonify({'error': str(e)}), 500