#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models de Autores e Referências - ADAPTADO À NOVA BD
"""
from models.planta import db

class Autor(db.Model):
    """
    Autores de pesquisas/publicações
    MANTIDO estrutura similar
    """
    __tablename__ = 'Autor'
    
    id_autor = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_autor = db.Column(db.String(255), nullable=False)
    
    # Relationships
    afiliacoes = db.relationship('Autor_afiliacao', backref='autor', lazy=True)
    referencias = db.relationship('Referencia_autor', backref='autor', lazy=True)
    
    def to_dict(self, include_stats=False, include_afiliacoes=True):
        data = {
            'id_autor': self.id_autor,
            'nome_autor': self.nome_autor,
            'label': self.nome_autor,
            'value': self.id_autor
        }
        
        # ✅ SEMPRE incluir afiliações (não só quando include_stats=True)
        if include_afiliacoes:
            afiliacoes_list = []
            for aa in self.afiliacoes:
                if aa.afiliacao:
                    afiliacoes_list.append({
                        'id_afiliacao': aa.afiliacao.id_afiliacao,
                        'nome_afiliacao': aa.afiliacao.nome_afiliacao,
                        'sigla_afiliacao': aa.afiliacao.sigla_afiliacao
                    })
            data['afiliacoes'] = afiliacoes_list
            
            # ✅ ADICIONAR: campos compatíveis com frontend antigo
            # (para não quebrar código que espera afiliacao/sigla_afiliacao direto no autor)
            if len(afiliacoes_list) > 0:
                data['afiliacao'] = afiliacoes_list[0]['nome_afiliacao']
                data['sigla_afiliacao'] = afiliacoes_list[0]['sigla_afiliacao']
            else:
                data['afiliacao'] = None
                data['sigla_afiliacao'] = None
        
        if include_stats:
            # Contar publicações
            data['total_referencias'] = len(self.referencias)
        
        return data


class Afiliacao(db.Model):
    """
    Afiliações institucionais dos autores
    MANTIDO da BD nova
    """
    __tablename__ = 'Afiliacao'
    
    id_afiliacao = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_afiliacao = db.Column(db.String(255), nullable=False)
    sigla_afiliacao = db.Column(db.String(20), nullable=True)
    
    # Relationships
    autores = db.relationship('Autor_afiliacao', backref='afiliacao', lazy=True)
    
    def to_dict(self):
        return {
            'id_afiliacao': self.id_afiliacao,
            'nome_afiliacao': self.nome_afiliacao,
            'sigla_afiliacao': self.sigla_afiliacao,
            'label': self.nome_afiliacao,
            'value': self.id_afiliacao
        }


class Autor_afiliacao(db.Model):
    """
    Associação Autor ↔ Afiliação
    MANTIDO da BD nova
    """
    __tablename__ = 'Autor_afiliacao'
    
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)
    id_afiliacao = db.Column(db.Integer, db.ForeignKey('Afiliacao.id_afiliacao'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_autor': self.id_autor,
            'id_afiliacao': self.id_afiliacao
        }


class Referencia(db.Model):
    """
    Referências bibliográficas
    MANTIDO estrutura similar
    """
    __tablename__ = 'Referencia'
    
    id_referencia = db.Column(db.Integer, primary_key=True, autoincrement=True)
    titulo_referencia = db.Column(db.String(255), nullable=False)
    link_referencia = db.Column(db.String(255), nullable=True, unique=True)
    ano_publicacao = db.Column(db.Integer, nullable=True)  # YEAR convertido para INTEGER
    
    # Relationships
    autores_relacao = db.relationship('Referencia_autor', backref='referencia', lazy=True)
    plantas = db.relationship('Planta_referencia', backref='referencia', lazy=True)
    
    def to_dict(self, include_autores=False):
        data = {
            'id_referencia': self.id_referencia,
            'titulo': self.titulo_referencia,
            'titulo_referencia': self.titulo_referencia,
            'link': self.link_referencia,
            'link_referencia': self.link_referencia,
            'ano': self.ano_publicacao,
            'ano_publicacao': self.ano_publicacao
        }
        
        if include_autores:
            autores_list = []
            for ra in self.autores_relacao:
                if ra.autor:
                    autor_dict = {
                        'id_autor': ra.autor.id_autor,
                        'nome_autor': ra.autor.nome_autor,
                        'afiliacoes': []
                    }
                    
                    # ✅ Incluir TODAS as afiliações do autor
                    for aa in ra.autor.afiliacoes:
                        if aa.afiliacao:
                            autor_dict['afiliacoes'].append({
                                'id_afiliacao': aa.afiliacao.id_afiliacao,
                                'nome_afiliacao': aa.afiliacao.nome_afiliacao,
                                'sigla_afiliacao': aa.afiliacao.sigla_afiliacao
                            })
                    
                    # ✅ Manter compatibilidade: primeira afiliação nos campos antigos
                    if len(autor_dict['afiliacoes']) > 0:
                        autor_dict['afiliacao'] = autor_dict['afiliacoes'][0]['nome_afiliacao']
                        autor_dict['sigla_afiliacao'] = autor_dict['afiliacoes'][0]['sigla_afiliacao']
                    else:
                        autor_dict['afiliacao'] = None
                        autor_dict['sigla_afiliacao'] = None
                    
                    autores_list.append(autor_dict)
            
            data['autores'] = autores_list
        
        return data


class Referencia_autor(db.Model):
    """
    Associação Referência ↔ Autor
    MANTIDO da BD nova
    """
    __tablename__ = 'Referencia_autor'
    
    id_referencia = db.Column(db.Integer, db.ForeignKey('Referencia.id_referencia'), primary_key=True)
    id_autor = db.Column(db.Integer, db.ForeignKey('Autor.id_autor'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_referencia': self.id_referencia,
            'id_autor': self.id_autor
        }


class Planta_referencia(db.Model):
    """
    Associação Planta ↔ Referência
    MANTIDO da BD nova
    """
    __tablename__ = 'Planta_referencia'
    
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), primary_key=True)
    id_referencia = db.Column(db.Integer, db.ForeignKey('Referencia.id_referencia'), primary_key=True)
    
    def to_dict(self):
        return {
            'id_planta': self.id_planta,
            'id_referencia': self.id_referencia
        }