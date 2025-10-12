#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models de Localização - ADAPTADO À NOVA BD
MUDANÇA CRÍTICA: Agora usa Local_colheita como intermediário
"""
from models.planta import db

class Provincia(db.Model):
    """
    Províncias de Moçambique
    MANTIDO igual à BD antiga
    """
    __tablename__ = 'Provincia'
    
    id_provincia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    provincia = db.Column(db.String(20), nullable=False, unique=True)
    
    # Relationships
    locais = db.relationship('Local_colheita', backref='provincia', lazy=True)
    regioes = db.relationship('Regiao', backref='provincia', lazy=True)
    
    def to_dict(self):
        return {
            'id_provincia': self.id_provincia,
            'nome_provincia': self.provincia,
            'label': self.provincia,
            'value': self.id_provincia
        }


class Local_colheita(db.Model):
    """
    Locais de colheita das plantas
    ✅ NOVO: Tabela intermediária entre Planta e Provincia
    """
    __tablename__ = 'Local_colheita'
    
    id_local = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_local = db.Column(db.String(255), nullable=False)
    id_provincia = db.Column(db.Integer, db.ForeignKey('Provincia.id_provincia'), nullable=False)
    
    # Relationships
    plantas = db.relationship('Planta_local', backref='local', lazy=True)
    
    def to_dict(self):
        return {
            'id_local': self.id_local,
            'nome_local': self.nome_local,
            'id_provincia': self.id_provincia,
            'provincia': self.provincia.provincia if self.provincia else None
        }


class Planta_local(db.Model):
    """
    Associação Planta ↔ Local de Colheita
    ✅ NOVO: Substitui a relação direta planta_provincia
    """
    __tablename__ = 'Planta_local'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_local = db.Column(db.Integer, db.ForeignKey('Local_colheita.id_local'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_planta': self.id_planta,
            'id_local': self.id_local
        }


class Regiao(db.Model):
    """
    Regiões dentro de províncias
    MANTIDO igual à BD antiga
    """
    __tablename__ = 'regiao'
    
    id_regiao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_regiao = db.Column(db.String(100), nullable=True)
    id_provincia = db.Column(db.Integer, db.ForeignKey('Provincia.id_provincia'), nullable=True)
    
    def to_dict(self):
        return {
            'id_regiao': self.id_regiao,
            'nome_regiao': self.nome_regiao,
            'id_provincia': self.id_provincia,
            'provincia': self.provincia.provincia if self.provincia else None
        }