#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Routes - Importações centralizadas
"""

from .plantas import plantas_bp
from .busca import busca_bp
from .auxiliares import auxiliares_bp
from .imagens import imagens_bp

__all__ = [
    'plantas_bp',
    'busca_bp',
    'auxiliares_bp',
    'imagens_bp'
]