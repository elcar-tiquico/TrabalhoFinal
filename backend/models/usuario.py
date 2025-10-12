#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Models de Usuários e Logs - SEM MUDANÇAS (mantido da BD antiga)
"""
from datetime import datetime
from models.planta import db

class PerfilUsuario(db.Model):
    """Perfis de acesso do sistema"""
    __tablename__ = 'perfil_usuario'
    
    id_perfil = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_perfil = db.Column(db.String(50), nullable=False, unique=True)
    descricao = db.Column(db.Text, nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    usuarios = db.relationship('Usuario', backref='perfil', lazy=True)
    
    def to_dict(self):
        return {
            'id_perfil': self.id_perfil,
            'nome_perfil': self.nome_perfil,
            'descricao': self.descricao,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }


class Usuario(db.Model):
    """Usuários do sistema"""
    __tablename__ = 'usuario'
    
    id_usuario = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome_completo = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), nullable=False, unique=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    id_perfil = db.Column(db.Integer, db.ForeignKey('perfil_usuario.id_perfil'), nullable=False)
    ativo = db.Column(db.Boolean, default=True)
    ultimo_login = db.Column(db.DateTime, nullable=True)
    data_registro = db.Column(db.DateTime, default=datetime.utcnow)
    tentativas_login = db.Column(db.Integer, default=0)
    bloqueado_ate = db.Column(db.DateTime, nullable=True)
    criado_por = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=True)
    atualizado_por = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=True)
    data_atualizacao = db.Column(db.DateTime, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id_usuario': self.id_usuario,
            'nome_completo': self.nome_completo,
            'email': self.email,
            'id_perfil': self.id_perfil,
            'nome_perfil': self.perfil.nome_perfil if self.perfil else None,
            'ativo': self.ativo,
            'ultimo_login': self.ultimo_login.isoformat() if self.ultimo_login else None,
            'data_registro': self.data_registro.isoformat() if self.data_registro else None
        }


class SessaoUsuario(db.Model):
    """Sessões de usuários autenticados"""
    __tablename__ = 'sessao_usuario'
    
    id_sessao = db.Column(db.String(255), primary_key=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    token_acesso = db.Column(db.Text, nullable=False)
    ip_origem = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_expiracao = db.Column(db.DateTime, nullable=True)
    ativo = db.Column(db.Boolean, default=True)


class LogAcoesUsuario(db.Model):
    """Log de ações dos usuários"""
    __tablename__ = 'log_acoes_usuario'
    
    id_log = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_usuario = db.Column(db.Integer, db.ForeignKey('usuario.id_usuario'), nullable=False)
    acao = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    tabela_afetada = db.Column(db.String(100), nullable=True)
    id_registro_afetado = db.Column(db.Integer, nullable=True)
    dados_anteriores = db.Column(db.Text, nullable=True)  # JSON
    dados_novos = db.Column(db.Text, nullable=True)  # JSON
    ip_origem = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    data_acao = db.Column(db.DateTime, default=datetime.utcnow)


class LogPesquisas(db.Model):
    """Log de pesquisas realizadas"""
    __tablename__ = 'log_pesquisas'
    
    id_pesquisa = db.Column(db.Integer, primary_key=True, autoincrement=True)
    termo_pesquisa = db.Column(db.String(255), nullable=True)
    tipo_pesquisa = db.Column(db.String(50), default='nome_popular')
    ip_usuario = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    data_pesquisa = db.Column(db.DateTime, default=datetime.utcnow)
    resultados_encontrados = db.Column(db.Integer, default=0)
    
    def to_dict(self):
        return {
            'id_pesquisa': self.id_pesquisa,
            'termo_pesquisa': self.termo_pesquisa,
            'tipo_pesquisa': self.tipo_pesquisa,
            'resultados_encontrados': self.resultados_encontrados,
            'data_pesquisa': self.data_pesquisa.isoformat() if self.data_pesquisa else None
        }