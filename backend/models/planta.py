#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models relacionados a Plantas Medicinais - ADAPTADO À NOVA BD
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Planta_medicinal(db.Model):
    """
    Tabela principal de plantas - NOVA ESTRUTURA
    MUDANÇA CRÍTICA: familia agora é campo TEXT, não FK!
    """
    __tablename__ = 'Planta_medicinal'
    
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_cientifico = db.Column(db.String(100), nullable=False, unique=True)
    familia = db.Column(db.String(100), nullable=False)  # ✅ MUDOU: agora é texto!
    infos_adicionais = db.Column(db.Text, nullable=True)
    comp_quimica = db.Column(db.Text, nullable=True)
    prop_farmacologica = db.Column(db.Text, nullable=True)
    
    # Relationships (adaptados à nova estrutura)
    nomes_comuns = db.relationship('Nome_comum', backref='planta', lazy=True, cascade="all, delete-orphan")
    imagens = db.relationship('Imagem', backref='planta', lazy=True, cascade="all, delete-orphan")
    locais = db.relationship('Planta_local', backref='planta', lazy=True, cascade="all, delete-orphan")
    partes_usadas = db.relationship('Planta_parte', backref='planta', lazy=True, cascade="all, delete-orphan")
    referencias = db.relationship('Planta_referencia', backref='planta', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=False):
        """
        Conversão para dicionário - ADAPTADO
        ✅ familia agora é campo direto, não join!
        """
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'familia': self.familia,  # ✅ Direto do campo, não de relationship
            'infos_adicionais': self.infos_adicionais,
            'comp_quimica': self.comp_quimica,
            'prop_farmacologica': self.prop_farmacologica,
            'nomes_comuns': [nc.nome for nc in self.nomes_comuns]
        }
        
        if include_relations:
            # Buscar províncias através da nova estrutura
            provincias = []
            for pl in self.locais:
                if pl.local and pl.local.provincia:
                    provincias.append({
                        'id_provincia': pl.local.provincia.id_provincia,
                        'nome_provincia': pl.local.provincia.provincia,
                        'local': pl.local.nome_local
                    })
            
            # Buscar partes usadas e suas indicações
            partes_com_indicacoes = []
            for pp in self.partes_usadas:
                parte_info = {
                    'id_parte': pp.parte.id_parte if pp.parte else None,
                    'nome_parte': pp.parte.nome_parte if pp.parte else None,
                    'indicacoes': []
                }
                
                # Buscar indicações desta parte
                if pp.parte:
                    for pi in pp.parte.indicacoes:
                        if pi.indicacao:
                            parte_info['indicacoes'].append({
                                'id_indicacao': pi.indicacao.id_uso,
                                'descricao': pi.indicacao.descricao_uso
                            })
                
                partes_com_indicacoes.append(parte_info)
            
            # Buscar referências
            referencias_list = []
            for pr in self.referencias:
                if pr.referencia:
                    ref_dict = {
                        'id_referencia': pr.referencia.id_referencia,
                        'titulo': pr.referencia.titulo_referencia,
                        'link': pr.referencia.link_referencia,
                        'ano': pr.referencia.ano_publicacao,
                        'autores': []
                    }
                    
                    # Buscar autores da referência
                    for ra in pr.referencia.autores_relacao:
                        if ra.autor:
                            ref_dict['autores'].append({
                                'id_autor': ra.autor.id_autor,
                                'nome': ra.autor.nome_autor
                            })
                    
                    referencias_list.append(ref_dict)
            
            # Buscar imagens
            imagens_list = [{
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'url': img.url_armazenamento,
                'legenda': img.legenda,
                'referencia': img.referencia_img
            } for img in self.imagens]
            
            data.update({
                'provincias': provincias,
                'partes_usadas': partes_com_indicacoes,
                'referencias': referencias_list,
                'imagens': imagens_list
            })
        
        return data


class Nome_comum(db.Model):
    """
    Nomes populares das plantas
    MUDANÇA: campo renomeado de nome_comum_planta → nome
    """
    __tablename__ = 'Nome_comum'
    
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255), nullable=False)  # ✅ MUDOU: nome do campo
    id_planta = db.Column(db.Integer, db.ForeignKey('Planta_medicinal.id_planta'), nullable=False)
    
    def to_dict(self):
        return {
            'id_nome': self.id_nome,
            'nome': self.nome,
            'id_planta': self.id_planta
        }


class Imagem(db.Model):
    """
    Imagens das plantas
    MANTIDO como estava (compatibilidade)
    """
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


# Alias para compatibilidade com código antigo
PlantaImagem = Imagem