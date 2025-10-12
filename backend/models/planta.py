#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models relacionados a Plantas Medicinais - ADAPTADO À NOVA BD
CORREÇÃO COMPLETA: Método to_dict alinhado com a ESTRUTURA REAL da nova BD
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Table

db = SQLAlchemy()

# ✅ Definir tabelas associativas que NÃO têm model próprio
Planta_metodo_trad = Table('Planta_metodo_trad', db.metadata,
    db.Column('id_parte', db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True),
    db.Column('id_metodo_preparacao', db.Integer, db.ForeignKey('Metodo_preparacao_trad.id_metodo_preparacao'), primary_key=True)
)

Parte_metodo = Table('Parte_metodo', db.metadata,
    db.Column('id_parte', db.Integer, db.ForeignKey('Parte_usada.id_parte'), primary_key=True),
    db.Column('id_metodo_extraccao', db.Integer, db.ForeignKey('Metodo_extraccao_cientif.id_metodo_extraccao'), primary_key=True)
)


class Planta_medicinal(db.Model):
    """
    Tabela principal de plantas - NOVA ESTRUTURA
    MUDANÇA CRÍTICA: familia agora é campo TEXT, não FK!
    """
    __tablename__ = 'Planta_medicinal'
    
    id_planta = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_cientifico = db.Column(db.String(100), nullable=False, unique=True)
    familia = db.Column(db.String(100), nullable=False)  # ✅ Texto direto
    infos_adicionais = db.Column(db.Text, nullable=True)
    comp_quimica = db.Column(db.Text, nullable=True)
    prop_farmacologica = db.Column(db.Text, nullable=True)
    
    # Relationships
    nomes_comuns = db.relationship('Nome_comum', backref='planta', lazy=True, cascade="all, delete-orphan")
    imagens = db.relationship('Imagem', backref='planta', lazy=True, cascade="all, delete-orphan")
    locais = db.relationship('Planta_local', backref='planta', lazy=True, cascade="all, delete-orphan")
    partes_usadas = db.relationship('Planta_parte', backref='planta', lazy=True, cascade="all, delete-orphan")
    referencias = db.relationship('Planta_referencia', backref='planta', lazy=True, cascade="all, delete-orphan")
    
    def to_dict(self, include_relations=False):
        """
        Conversão para dicionário - ADAPTADO À NOVA BD
        ✅ CORRIGIDO: Inclui TUDO conforme estrutura real da nova BD
        
        ESTRUTURA DA NOVA BD:
        - Planta → Planta_parte → Parte_usada
        - Parte_usada → Planta_metodo_trad → Metodo_preparacao_trad
        - Parte_usada → Parte_metodo → Metodo_extraccao_cientif
        - Parte_usada → Parte_indicacao → Indicacao
        - Planta → Planta_referencia → Referencia → Referencia_autor → Autor → Autor_afiliacao → Afiliacao
        """
        data = {
            'id_planta': self.id_planta,
            'nome_cientifico': self.nome_cientifico,
            'familia': self.familia,
            'infos_adicionais': self.infos_adicionais,  # ✅ ADICIONADO
            'comp_quimica': self.comp_quimica,
            'prop_farmacologica': self.prop_farmacologica,
            'nomes_comuns': [nc.nome for nc in self.nomes_comuns]
        }
        
        if include_relations:
            # 1. ✅ Buscar províncias e locais de colheita
            provincias = []
            for pl in self.locais:
                if pl.local:
                    local_obj = pl.local
                    if local_obj.provincia:
                        provincias.append({
                            'id_provincia': local_obj.provincia.id_provincia,
                            'nome_provincia': local_obj.provincia.provincia,
                            'local': local_obj.nome_local
                        })

                autores_dict = {}  # Usar dict para evitar duplicatas
    
                for pr in self.referencias:
                    if pr.referencia:
                        for ra in pr.referencia.autores_relacao:
                            if ra.autor and ra.autor.id_autor not in autores_dict:
                                autor = ra.autor
                                
                                # Buscar afiliações deste autor
                                afiliacao_nome = None
                                afiliacao_sigla = None
                                
                                if autor.afiliacoes and len(autor.afiliacoes) > 0:
                                    primeira_afiliacao = autor.afiliacoes[0]
                                    if primeira_afiliacao.afiliacao:
                                        afiliacao_nome = primeira_afiliacao.afiliacao.nome_afiliacao
                                        afiliacao_sigla = primeira_afiliacao.afiliacao.sigla_afiliacao
                                
                                autores_dict[autor.id_autor] = {
                                    'id_autor': autor.id_autor,
                                    'nome_autor': autor.nome_autor,
                                    'afiliacao': afiliacao_nome,
                                    'sigla_afiliacao': afiliacao_sigla
                                }
                
                autores_list = list(autores_dict.values())
            
            # 2. ✅ Buscar partes usadas com indicações, métodos de preparação e extração
            partes_com_indicacoes = []
            for pp in self.partes_usadas:
                if pp.parte:
                    parte_obj = pp.parte
                    
                    # 2a. Buscar indicações (Parte_usada → Parte_indicacao → Indicacao)
                    indicacoes = []
                    for pi in parte_obj.indicacoes:
                        if pi.indicacao:
                            indicacoes.append({
                                'id_indicacao': pi.indicacao.id_uso,
                                'descricao': pi.indicacao.descricao_uso
                            })
                    
                    # 2b. ✅ Buscar métodos de preparação tradicional
                    # (Parte_usada → Planta_metodo_trad → Metodo_preparacao_trad)
                    metodos_preparacao = []
                    try:
                        from models.uso_medicinal import Metodo_preparacao_trad
                        
                        metodos_prep_query = db.session.query(Metodo_preparacao_trad).join(
                            Planta_metodo_trad,
                            Metodo_preparacao_trad.id_metodo_preparacao == Planta_metodo_trad.c.id_metodo_preparacao
                        ).filter(
                            Planta_metodo_trad.c.id_parte == parte_obj.id_parte
                        ).all()
                        
                        for mp in metodos_prep_query:
                            metodos_preparacao.append({
                                'id_preparacao': mp.id_metodo_preparacao,
                                'descricao': mp.descricao_metodo_preparacao
                            })
                    except Exception as e:
                        print(f"⚠️ Erro ao buscar métodos de preparação: {e}")
                    
                    # 2c. ✅ Buscar métodos de extração científica
                    # (Parte_usada → Parte_metodo → Metodo_extraccao_cientif)
                    metodos_extracao = []
                    try:
                        from models.uso_medicinal import Metodo_extraccao_cientif
                        
                        metodos_ext_query = db.session.query(Metodo_extraccao_cientif).join(
                            Parte_metodo,
                            Metodo_extraccao_cientif.id_metodo_extraccao == Parte_metodo.c.id_metodo_extraccao
                        ).filter(
                            Parte_metodo.c.id_parte == parte_obj.id_parte
                        ).all()
                        
                        for me in metodos_ext_query:
                            metodos_extracao.append({
                                'id_extraccao': me.id_metodo_extraccao,
                                'descricao': me.descricao_metodo_extraccao
                            })
                    except Exception as e:
                        print(f"⚠️ Erro ao buscar métodos de extração: {e}")
                    
                    parte_info = {
                        'id_parte': parte_obj.id_parte,
                        'nome_parte': parte_obj.nome_parte,
                        'indicacoes': indicacoes,
                        'metodos_preparacao': metodos_preparacao,  # ✅ ADICIONADO
                        'metodos_extracao': metodos_extracao  # ✅ ADICIONADO
                    }
                    
                    partes_com_indicacoes.append(parte_info)
            
            # 3. ✅ Buscar referências COM autores E afiliações
            # (Planta → Planta_referencia → Referencia → Referencia_autor → Autor → Autor_afiliacao → Afiliacao)
            referencias_list = []
            for pr in self.referencias:
                if pr.referencia:
                    ref = pr.referencia
                    ref_dict = {
                        'id_referencia': ref.id_referencia,
                        'titulo': ref.titulo_referencia,
                        'titulo_referencia': ref.titulo_referencia,
                        'link': ref.link_referencia,
                        'link_referencia': ref.link_referencia,
                        'ano': ref.ano_publicacao,
                        'ano_publicacao': ref.ano_publicacao,
                        'autores': []
                    }
                    
                    # 3a. ✅ Buscar autores COM afiliações
                    for ra in ref.autores_relacao:
                        if ra.autor:
                            autor = ra.autor
                            autor_dict = {
                                'id_autor': autor.id_autor,
                                'nome_autor': autor.nome_autor
                            }
                            
                            # 3b. ✅ Buscar afiliações do autor
                            # (Autor → Autor_afiliacao → Afiliacao)
                            afiliacoes_list = []
                            for aa in autor.afiliacoes:
                                if aa.afiliacao:
                                    afiliacoes_list.append({
                                        'id_afiliacao': aa.afiliacao.id_afiliacao,
                                        'nome_afiliacao': aa.afiliacao.nome_afiliacao,
                                        'sigla_afiliacao': aa.afiliacao.sigla_afiliacao
                                    })
                            
                            # Adicionar primeira afiliação diretamente (compatibilidade)
                            if afiliacoes_list:
                                autor_dict['afiliacao'] = afiliacoes_list[0]['nome_afiliacao']
                                autor_dict['sigla_afiliacao'] = afiliacoes_list[0]['sigla_afiliacao']
                            
                            autor_dict['afiliacoes'] = afiliacoes_list
                            ref_dict['autores'].append(autor_dict)
                    
                    referencias_list.append(ref_dict)
            
            # 4. ✅ Buscar imagens
            imagens_list = [{
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'url': img.url_armazenamento,
                'legenda': img.legenda,
                'referencia': img.referencia_img
            } for img in self.imagens]
            
            # ✅ ATUALIZAR dicionário com TODAS as relações
            data.update({
                'autores': autores_list,
                'provincias': provincias,
                'partes_usadas': partes_com_indicacoes,  # ✅ Com métodos prep. e extração
                'referencias': referencias_list,  # ✅ Com autores e afiliações
                'imagens': imagens_list
            })
        
        return data


class Nome_comum(db.Model):
    """
    Nomes populares das plantas
    """
    __tablename__ = 'Nome_comum'
    
    id_nome = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(255), nullable=False)
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


# Alias para compatibilidade
PlantaImagem = Imagem