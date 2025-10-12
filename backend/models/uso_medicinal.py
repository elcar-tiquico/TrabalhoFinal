#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models de Uso Medicinal - ADAPTADO À NOVA BD
MUDANÇA CRÍTICA: Estrutura completamente diferente!
Antes: Planta → uso_planta → indicações
Agora: Planta → Planta_parte → Parte → Parte_indicacao → Indicação
"""
from models.planta import db

class Parte_usada(db.Model):
    """
    Partes da planta usadas medicinalmente
    MANTIDO estrutura similar
    """
    __tablename__ = 'Parte_usada'
    
    id_parte = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_parte = db.Column(db.String(50), nullable=False, unique=True)
    
    # Relationships
    plantas = db.relationship('Planta_parte', backref='parte', lazy=True)
    indicacoes = db.relationship('Parte_indicacao', backref='parte', lazy=True)
    
    metodos_preparacao = db.relationship(
        'Metodo_preparacao_trad',
        secondary='Planta_metodo_trad',
        backref='partes',
        lazy='dynamic'
    )
    
    metodos_extracao = db.relationship(
        'Metodo_extraccao_cientif',
        secondary='Parte_metodo',
        backref='partes',
        lazy='dynamic'
    )

    def to_dict(self):
        return {
            'id_parte': self.id_parte,
            'nome_parte': self.nome_parte,
            'label': self.nome_parte,
            'value': self.id_parte
        }


class Indicacao(db.Model):
    """
    Indicações terapêuticas / Usos tradicionais
    MANTIDO estrutura similar
    """
    __tablename__ = 'Indicacao'
    
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_uso = db.Column(db.Text, nullable=False)
    
    # Relationships
    partes = db.relationship('Parte_indicacao', backref='indicacao', lazy=True)
    
    def to_dict(self):
        return {
            'id_uso': self.id_uso,
            'id_indicacao': self.id_uso,  # Alias para compatibilidade
            'descricao': self.descricao_uso,
            'descricao_uso': self.descricao_uso,
            'label': self.descricao_uso[:100] + '...' if len(self.descricao_uso) > 100 else self.descricao_uso,
            'value': self.id_uso
        }


class Planta_parte(db.Model):
    """
    Associação Planta ↔ Parte Usada
    ✅ NOVO: Substitui parte da estrutura uso_planta
    """
    __tablename__ = 'Planta_parte'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_planta': self.id_planta,
            'id_parte': self.id_parte,
            'nome_parte': self.parte.nome_parte if self.parte else None
        }


class Parte_indicacao(db.Model):
    """
    Associação Parte Usada ↔ Indicação Terapêutica
    ✅ NOVO: Substitui uso_planta_indicacao
    """
    __tablename__ = 'Parte_indicacao'
    
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)
    id_uso = db.Column(db.Integer, db.ForeignKey('Indicacao.id_uso'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_parte': self.id_parte,
            'id_uso': self.id_uso,
            'id_indicacao': self.id_uso,  # Alias para compatibilidade
            'descricao': self.indicacao.descricao_uso if self.indicacao else None
        }


class Metodo_preparacao_trad(db.Model):
    """
    Métodos de preparação tradicional
    ✅ MANTIDO da BD nova
    """
    __tablename__ = 'Metodo_preparacao_trad'
    
    id_metodo_preparacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_metodo_preparacao = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id_metodo_preparacao': self.id_metodo_preparacao,
            'id_preparacao': self.id_metodo_preparacao,  # Alias
            'descricao': self.descricao_metodo_preparacao,
            'label': self.descricao_metodo_preparacao[:100] + '...' if len(self.descricao_metodo_preparacao) > 100 else self.descricao_metodo_preparacao,
            'value': self.id_metodo_preparacao
        }


class Metodo_extraccao_cientif(db.Model):
    """
    Métodos de extração científica
    ✅ MANTIDO da BD nova
    """
    __tablename__ = 'Metodo_extraccao_cientif'
    
    id_metodo_extraccao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_metodo_extraccao = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id_metodo_extraccao': self.id_metodo_extraccao,
            'id_extraccao': self.id_metodo_extraccao,  # Alias
            'descricao': self.descricao_metodo_extraccao,
            'label': self.descricao_metodo_extraccao[:100] + '...' if len(self.descricao_metodo_extraccao) > 100 else self.descricao_metodo_extraccao,
            'value': self.id_metodo_extraccao
        }