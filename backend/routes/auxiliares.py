#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Rotas Auxiliares - Províncias, Partes Usadas, Indicações, etc.
ADAPTADO À NOVA BD
"""
from flask import Blueprint, request, jsonify
from models.planta import db, Planta_medicinal
from models.localizacao import Provincia, Local_colheita, Regiao
from models.uso_medicinal import (
    Parte_usada, Indicacao, Metodo_preparacao_trad, Metodo_extraccao_cientif
)
from models.referencia import Autor, Afiliacao, Referencia
from sqlalchemy import func

auxiliares_bp = Blueprint('auxiliares', __name__)

def handle_error(e, message="Erro ao processar requisição"):
    """Tratamento de erros padronizado"""
    print(f"❌ Erro: {e}")
    return jsonify({'error': message, 'details': str(e)}), 500

# =====================================================
# PROVÍNCIAS
# =====================================================
@auxiliares_bp.route('/provincias', methods=['GET'])
def get_provincias():
    """Listar todas as províncias"""
    try:
        provincias = Provincia.query.all()
        return jsonify([p.to_dict() for p in provincias])
    except Exception as e:
        return handle_error(e, "Erro ao buscar províncias")

@auxiliares_bp.route('/provincias', methods=['POST'])
def create_provincia():
    """Criar nova província"""
    try:
        data = request.get_json()
        if not data or 'provincia' not in data:
            return jsonify({'error': 'Nome da província é obrigatório'}), 400
        
        provincia = Provincia(provincia=data['provincia'])
        db.session.add(provincia)
        db.session.commit()
        return jsonify(provincia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar província")

# =====================================================
# LOCAIS DE COLHEITA (NOVO)
# =====================================================
@auxiliares_bp.route('/locais-colheita', methods=['GET'])
def get_locais():
    """Listar locais de colheita"""
    try:
        provincia_id = request.args.get('provincia_id', type=int)
        
        query = Local_colheita.query
        if provincia_id:
            query = query.filter_by(id_provincia=provincia_id)
        
        locais = query.all()
        return jsonify([l.to_dict() for l in locais])
    except Exception as e:
        return handle_error(e, "Erro ao buscar locais")

@auxiliares_bp.route('/locais-colheita', methods=['POST'])
def create_local():
    """Criar novo local de colheita"""
    try:
        data = request.get_json()
        if not data or 'nome_local' not in data or 'id_provincia' not in data:
            return jsonify({'error': 'Nome do local e província são obrigatórios'}), 400
        
        local = Local_colheita(
            nome_local=data['nome_local'],
            id_provincia=data['id_provincia']
        )
        db.session.add(local)
        db.session.commit()
        return jsonify(local.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar local")

# =====================================================
# REGIÕES
# =====================================================
@auxiliares_bp.route('/regioes', methods=['GET'])
def get_regioes():
    """Listar regiões"""
    try:
        provincia_id = request.args.get('provincia_id', type=int)
        
        query = Regiao.query
        if provincia_id:
            query = query.filter_by(id_provincia=provincia_id)
        
        regioes = query.all()
        return jsonify([r.to_dict() for r in regioes])
    except Exception as e:
        return handle_error(e, "Erro ao buscar regiões")

@auxiliares_bp.route('/regioes', methods=['POST'])
def create_regiao():
    """Criar nova região"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        regiao = Regiao(
            nome_regiao=data.get('nome_regiao'),
            id_provincia=data.get('id_provincia')
        )
        db.session.add(regiao)
        db.session.commit()
        return jsonify(regiao.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar região")

# =====================================================
# FAMÍLIAS (ADAPTADO - agora lista valores únicos do campo)
# =====================================================
@auxiliares_bp.route('/familias', methods=['GET'])
def get_familias():
    """
    Listar famílias únicas
    ✅ MUDOU: Agora busca valores únicos do campo 'familia'
    """
    try:
        familias = db.session.query(
            Planta_medicinal.familia,
            func.count(Planta_medicinal.id_planta).label('total_plantas')
        ).group_by(
            Planta_medicinal.familia
        ).order_by(
            Planta_medicinal.familia
        ).all()
        
        return jsonify([
            {
                'nome_familia': f.familia,
                'label': f.familia,
                'value': f.familia,
                'total_plantas': f.total_plantas
            }
            for f in familias if f.familia  # Ignorar vazios
        ])
    except Exception as e:
        return handle_error(e, "Erro ao buscar famílias")

# =====================================================
# PARTES USADAS
# =====================================================
@auxiliares_bp.route('/partes-usadas', methods=['GET'])
def get_partes_usadas():
    """Listar partes usadas"""
    try:
        partes = Parte_usada.query.all()
        return jsonify([p.to_dict() for p in partes])
    except Exception as e:
        return handle_error(e, "Erro ao buscar partes usadas")

@auxiliares_bp.route('/partes-usadas/<int:id_uso>', methods=['GET'])
def get_parte_usada(id_uso):
    """Buscar parte usada específica"""
    try:
        parte = Parte_usada.query.get_or_404(id_uso)
        return jsonify(parte.to_dict())
    except Exception as e:
        return handle_error(e, "Erro ao buscar parte usada")

@auxiliares_bp.route('/partes-usadas', methods=['POST'])
def create_parte_usada():
    """Criar nova parte usada"""
    try:
        data = request.get_json()
        if not data or 'nome_parte' not in data:
            return jsonify({'error': 'Nome da parte é obrigatório'}), 400
        
        parte = Parte_usada(nome_parte=data['nome_parte'])
        db.session.add(parte)
        db.session.commit()
        return jsonify(parte.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar parte usada")

# =====================================================
# INDICAÇÕES
# =====================================================
@auxiliares_bp.route('/indicacoes', methods=['GET'])
def get_indicacoes():
    """Listar indicações terapêuticas"""
    try:
        indicacoes = Indicacao.query.all()
        return jsonify([i.to_dict() for i in indicacoes])
    except Exception as e:
        return handle_error(e, "Erro ao buscar indicações")

@auxiliares_bp.route('/indicacoes/<int:id_uso>', methods=['GET'])
def get_indicacao(id_uso):
    """Buscar indicação específica"""
    try:
        indicacao = Indicacao.query.get_or_404(id_uso)
        return jsonify(indicacao.to_dict())
    except Exception as e:
        return handle_error(e, "Erro ao buscar indicação")

@auxiliares_bp.route('/indicacoes', methods=['POST'])
def create_indicacao():
    """Criar nova indicação"""
    try:
        data = request.get_json()
        if not data or 'descricao_uso' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        indicacao = Indicacao(descricao_uso=data['descricao_uso'])
        db.session.add(indicacao)
        db.session.commit()
        return jsonify(indicacao.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar indicação")

# =====================================================
# MÉTODOS DE PREPARAÇÃO
# =====================================================
@auxiliares_bp.route('/metodos-preparacao', methods=['GET'])
def get_metodos_preparacao():
    """Listar métodos de preparação tradicional"""
    try:
        metodos = Metodo_preparacao_trad.query.all()
        return jsonify([m.to_dict() for m in metodos])
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos")

@auxiliares_bp.route('/metodos-preparacao', methods=['POST'])
def create_metodo_preparacao():
    """Criar novo método de preparação"""
    try:
        data = request.get_json()
        if not data or 'descricao_metodo_preparacao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        metodo = Metodo_preparacao_trad(
            descricao_metodo_preparacao=data['descricao_metodo_preparacao']
        )
        db.session.add(metodo)
        db.session.commit()
        return jsonify(metodo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar método")

# =====================================================
# MÉTODOS DE EXTRAÇÃO
# =====================================================
@auxiliares_bp.route('/metodos-extracao', methods=['GET'])
def get_metodos_extracao():
    """Listar métodos de extração científica"""
    try:
        metodos = Metodo_extraccao_cientif.query.all()
        return jsonify([m.to_dict() for m in metodos])
    except Exception as e:
        return handle_error(e, "Erro ao buscar métodos")

@auxiliares_bp.route('/metodos-extracao', methods=['POST'])
def create_metodo_extracao():
    """Criar novo método de extração"""
    try:
        data = request.get_json()
        if not data or 'descricao_metodo_extraccao' not in data:
            return jsonify({'error': 'Descrição é obrigatória'}), 400
        
        metodo = Metodo_extraccao_cientif(
            descricao_metodo_extraccao=data['descricao_metodo_extraccao']
        )
        db.session.add(metodo)
        db.session.commit()
        return jsonify(metodo.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar método")

# =====================================================
# AUTORES
# =====================================================
@auxiliares_bp.route('/autores', methods=['GET'])
def get_autores():
    """Listar autores"""
    try:
        autores = Autor.query.all()
        return jsonify([a.to_dict() for a in autores])
    except Exception as e:
        return handle_error(e, "Erro ao buscar autores")

@auxiliares_bp.route('/autores/<int:id_autor>', methods=['GET'])
def get_autor(id_autor):
    """Buscar autor específico"""
    try:
        autor = Autor.query.get_or_404(id_autor)
        return jsonify(autor.to_dict(include_stats=True))
    except Exception as e:
        return handle_error(e, "Erro ao buscar autor")

@auxiliares_bp.route('/autores', methods=['POST'])
def create_autor():
    """Criar novo autor"""
    try:
        data = request.get_json()
        if not data or 'nome_autor' not in data:
            return jsonify({'error': 'Nome do autor é obrigatório'}), 400
        
        autor = Autor(nome_autor=data['nome_autor'])
        db.session.add(autor)
        db.session.commit()
        return jsonify(autor.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar autor")

# =====================================================
# REFERÊNCIAS
# =====================================================
@auxiliares_bp.route('/referencias', methods=['GET'])
def get_referencias():
    """Listar referências"""
    try:
        referencias = Referencia.query.all()
        return jsonify([r.to_dict(include_autores=True) for r in referencias])
    except Exception as e:
        return handle_error(e, "Erro ao buscar referências")

@auxiliares_bp.route('/referencias/<int:id_referencia>', methods=['GET'])
def get_referencia(id_referencia):
    """Buscar referência específica"""
    try:
        referencia = Referencia.query.get_or_404(id_referencia)
        return jsonify(referencia.to_dict(include_autores=True))
    except Exception as e:
        return handle_error(e, "Erro ao buscar referência")

@auxiliares_bp.route('/referencias', methods=['POST'])
def create_referencia():
    """Criar nova referência"""
    try:
        data = request.get_json()
        if not data or 'titulo_referencia' not in data:
            return jsonify({'error': 'Título é obrigatório'}), 400
        
        referencia = Referencia(
            titulo_referencia=data['titulo_referencia'],
            link_referencia=data.get('link_referencia'),
            ano_publicacao=data.get('ano_publicacao')
        )
        db.session.add(referencia)
        db.session.commit()
        return jsonify(referencia.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return handle_error(e, "Erro ao criar referência")