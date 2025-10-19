#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✅ ARQUIVO 1: models/planta_models.py - VERSÃO CORRIGIDA
Substitua TODO o conteúdo do arquivo planta_models.py por este código
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# =====================================================
# TABELAS PRINCIPAIS
# =====================================================

class PlantaMedicinal(db.Model):
    __tablename__ = 'Planta_medicinal'
    
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_cientifico = db.Column(db.String(100), nullable=False, unique=True)
    familia = db.Column(db.String(100), nullable=False)
    infos_adicionais = db.Column(db.Text, nullable=True)
    comp_quimica = db.Column(db.Text, nullable=True)
    prop_farmacologica = db.Column(db.Text, nullable=True)
    
    # Relacionamentos
    nomes_comuns = db.relationship('NomeComum', backref='planta', lazy=True, cascade='all, delete-orphan')
    imagens = db.relationship('Imagem', backref='planta', lazy=True, cascade='all, delete-orphan')
    
    # Relacionamentos N:N
    locais = db.relationship('LocalColheita', secondary='Planta_local', backref='plantas', lazy='select')
    partes = db.relationship('ParteUsada', secondary='Planta_parte', backref='plantas', lazy='select')
    referencias = db.relationship('Referencia', secondary='Planta_referencia', backref='plantas', lazy='select')
    
    def to_dict(self, include_relations=False):
        # ✅ CORREÇÃO 1: Buscar províncias SEMPRE (não só quando include_relations=True)
        provincias = []
        for local in self.locais:
            if local.provincia and local.provincia.provincia not in provincias:
                provincias.append(local.provincia.provincia)
        
        # ✅ CORREÇÃO 2: Buscar nomes comuns como array de strings
        nomes_comuns = [nc.nome for nc in self.nomes_comuns if nc.nome]
        
        # ✅ CORREÇÃO 3: Buscar imagens SEMPRE
        imagens = []
        for img in self.imagens:
            imagens.append({
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'url': img.url_armazenamento,
                'legenda': img.legenda,
                'referencia_img': img.referencia_img
            })
        
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'familia': self.familia,
            'infos_adicionais': self.infos_adicionais,
            'comp_quimica': self.comp_quimica,
            'prop_farmacologica': self.prop_farmacologica,
            'nomes_comuns': nomes_comuns,  # ✅ Array de strings
            'provincias': provincias,       # ✅ Array de strings - ADICIONADO
            'imagens': imagens              # ✅ Array de objetos - ADICIONADO
        }
        
        if include_relations:
            data.update({
                'locais': [{'id': l.id_local, 'nome': l.nome_local, 'provincia': l.provincia.provincia} for l in self.locais],
                'partes': [{'id': p.id_parte, 'nome': p.nome_parte} for p in self.partes],
                'referencias': [ref.to_dict() for ref in self.referencias]
            })
        
        return data


class NomeComum(db.Model):
    __tablename__ = 'Nome_comum'
    
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255), nullable=False)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), nullable=False)


class Provincia(db.Model):
    __tablename__ = 'Provincia'
    
    id_provincia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    provincia = db.Column(db.String(20), nullable=False, unique=True)
    
    locais = db.relationship('LocalColheita', backref='provincia', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id_provincia,
            'label': self.provincia,
            'value': self.id_provincia
        }


class LocalColheita(db.Model):
    __tablename__ = 'Local_colheita'
    
    id_local = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_local = db.Column(db.String(255), nullable=False)
    id_provincia = db.Column(db.Integer, db.ForeignKey('Provincia.id_provincia'), nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id_local,
            'label': f"{self.nome_local} ({self.provincia.provincia})",
            'value': self.id_local,
            'nome_local': self.nome_local,
            'id_provincia': self.id_provincia,
            'provincia': self.provincia.provincia
        }


class ParteUsada(db.Model):
    __tablename__ = 'Parte_usada'
    
    id_parte = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_parte = db.Column(db.String(50), nullable=False, unique=True)
    
    # Relacionamentos N:N
    indicacoes = db.relationship('Indicacao', secondary='Parte_indicacao', backref='partes', lazy='select')
    metodos_preparacao = db.relationship('MetodoPreparacaoTrad', secondary='Planta_metodo_trad', backref='partes', lazy='select')
    metodos_extracao = db.relationship('MetodoExtraccaoCientif', secondary='Parte_metodo', backref='partes', lazy='select')
    
    def to_dict(self):
        return {
            'id': self.id_parte,
            'label': self.nome_parte,
            'value': self.id_parte
        }


class Indicacao(db.Model):
    __tablename__ = 'Indicacao'
    
    id_uso = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_uso = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id_uso,
            'label': self.descricao_uso,
            'value': self.id_uso
        }


class Autor(db.Model):
    __tablename__ = 'Autor'
    
    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_autor = db.Column(db.String(255), nullable=False)
    
    # Relacionamento N:N com Afiliacao
    afiliacoes = db.relationship('Afiliacao', secondary='Autor_afiliacao', backref='autores', lazy='select')
    referencias = db.relationship('Referencia', secondary='Referencia_autor', backref='autores', lazy='select')
    
    def to_dict(self):
        afiliacoes_list = [
            {
                'id': af.id_afiliacao,
                'nome': af.nome_afiliacao,
                'sigla': af.sigla_afiliacao
            } for af in self.afiliacoes
        ]
        
        return {
            'id': self.id_autor,
            'label': f"{self.nome_autor}" + (f" ({afiliacoes_list[0]['nome']})" if afiliacoes_list else ""),
            'value': self.id_autor,
            'nome': self.nome_autor,
            'afiliacoes': afiliacoes_list
        }


class Afiliacao(db.Model):
    __tablename__ = 'Afiliacao'
    
    id_afiliacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_afiliacao = db.Column(db.String(255), nullable=False)
    sigla_afiliacao = db.Column(db.String(20), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id_afiliacao,
            'label': f"{self.nome_afiliacao}" + (f" ({self.sigla_afiliacao})" if self.sigla_afiliacao else ""),
            'value': self.id_afiliacao,
            'nome': self.nome_afiliacao,
            'sigla': self.sigla_afiliacao
        }


class Referencia(db.Model):
    __tablename__ = 'Referencia'
    
    id_referencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo_referencia = db.Column(db.String(255), nullable=False)
    link_referencia = db.Column(db.String(255), nullable=True, unique=True)
    ano_publicacao = db.Column(db.String(4), nullable=True)
    
    def to_dict(self):
        autores_list = [
            {
                'id_autor': autor.id_autor,
                'nome_autor': autor.nome_autor,
                'afiliacoes': [{'nome': af.nome_afiliacao, 'sigla': af.sigla_afiliacao} for af in autor.afiliacoes]
            } for autor in self.autores
        ]
        
        return {
            'id': self.id_referencia,
            'label': self.titulo_referencia[:80] + ('...' if len(self.titulo_referencia) > 80 else ''),
            'value': self.id_referencia,
            'titulo': self.titulo_referencia,
            'link': self.link_referencia,
            'ano': self.ano_publicacao,
            'autores': autores_list
        }


class Imagem(db.Model):
    __tablename__ = 'Imagem'
    
    id_imagem = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_arquivo = db.Column(db.String(255), nullable=False)
    url_armazenamento = db.Column(db.String(255), nullable=False, unique=True)
    legenda = db.Column(db.String(255), nullable=True)
    referencia_img = db.Column(db.String(255), nullable=True)
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), nullable=False)
    
    def to_dict(self):
        return {
            'id_imagem': self.id_imagem,
            'nome_arquivo': self.nome_arquivo,
            'url': self.url_armazenamento,
            'legenda': self.legenda,
            'referencia': self.referencia_img,
            'id_planta': self.id_planta
        }


class MetodoPreparacaoTrad(db.Model):
    __tablename__ = 'Metodo_preparacao_trad'
    
    id_metodo_preparacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_metodo_preparacao = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id_metodo_preparacao,
            'label': self.descricao_metodo_preparacao,
            'value': self.id_metodo_preparacao
        }


class MetodoExtraccaoCientif(db.Model):
    __tablename__ = 'Metodo_extraccao_cientif'
    
    id_metodo_extraccao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    descricao_metodo_extraccao = db.Column(db.Text, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id_metodo_extraccao,
            'label': self.descricao_metodo_extraccao,
            'value': self.id_metodo_extraccao
        }


# =====================================================
# TABELAS ASSOCIATIVAS (N:N)
# =====================================================

class PlantaLocal(db.Model):
    __tablename__ = 'Planta_local'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_local = db.Column(db.Integer, db.ForeignKey('Local_colheita.id_local'), primary_key=True)


class PlantaParte(db.Model):
    __tablename__ = 'Planta_parte'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)


class ParteIndicacao(db.Model):
    __tablename__ = 'Parte_indicacao'
    
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)
    id_uso = db.Column(db.Integer, db.ForeignKey('Indicacao.id_uso'), primary_key=True)


class ReferenciaAutor(db.Model):
    __tablename__ = 'Referencia_autor'
    
    id_referencia = db.Column(db.Integer, db.ForeignKey('Referencia.id_referencia'), primary_key=True)
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)


class AutorAfiliacao(db.Model):
    __tablename__ = 'Autor_afiliacao'
    
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)
    id_afiliacao = db.Column(db.Integer, db.ForeignKey('Afiliacao.id_afiliacao'), primary_key=True)


class PlantaReferencia(db.Model):
    __tablename__ = 'Planta_referencia'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('Referencia.id_referencia'), primary_key=True)


class PlantaMetodoTrad(db.Model):
    __tablename__ = 'Planta_metodo_trad'
    
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)
    id_metodo_preparacao = db.Column(db.Integer, db.ForeignKey('Metodo_preparacao_trad.id_metodo_preparacao'), primary_key=True)


class ParteMetodo(db.Model):
    __tablename__ = 'Parte_metodo'
    
    id_parte = db.Column(db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True)
    id_metodo_extraccao = db.Column(db.Integer, db.ForeignKey('Metodo_extraccao_cientif.id_metodo_extraccao'), primary_key=True)