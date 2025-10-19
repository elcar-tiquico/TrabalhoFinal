#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
✅ VERSÃO CORRIGIDA E COMPLETA - planta_service.py
Substitua TODO o conteúdo do arquivo por este código
"""

import logging
from models.planta_models import (
    db, PlantaMedicinal, NomeComum, Provincia, LocalColheita,
    ParteUsada, Indicacao, Autor, Afiliacao, Referencia, Imagem,
    MetodoPreparacaoTrad, MetodoExtraccaoCientif
)
from utils.image_handler import save_plant_image, validate_image_data

logger = logging.getLogger(__name__)


class PlantaService:
    """Serviço para operações relacionadas a plantas medicinais"""
    
    @staticmethod
    def get_planta_detalhada(id_planta):
        """Retorna planta com todos os dados formatados"""
        planta = PlantaMedicinal.query.get(id_planta)
        if not planta:
            return None
        
        logger.info(f"📦 Processando planta {id_planta}: {planta.nome_cientifico}")
        
        # ✅ Nomes comuns - RETORNAR APENAS STRING
        nomes_comuns = []
        for nc in planta.nomes_comuns:
            if nc.nome:
                nomes_comuns.append(nc.nome)
        logger.info(f"   • {len(nomes_comuns)} nomes comuns encontrados")
        
        # ✅ Locais de colheita
        locais = []
        for local in planta.locais:
            if local.provincia:
                locais.append({
                    'id_local': local.id_local,
                    'nome_local': local.nome_local,
                    'provincia': local.provincia.provincia
                })
        logger.info(f"   • {len(locais)} locais encontrados")
        
        # ✅ Províncias (para compatibilidade com frontend)
        provincias = []
        for local in planta.locais:
            if local.provincia:
                provincia_data = {
                    'id_provincia': local.provincia.id_provincia,
                    'provincia': local.provincia.provincia,
                    'local': local.nome_local,
                    'nome_provincia': local.provincia.provincia
                }
                if not any(p['id_provincia'] == provincia_data['id_provincia'] and 
                          p['local'] == provincia_data['local'] for p in provincias):
                    provincias.append(provincia_data)
        
        # ✅ Partes usadas
        partes_usadas = []
        for parte in planta.partes:
            indicacoes = []
            for ind in parte.indicacoes:
                indicacoes.append({
                    'id_indicacao': ind.id_uso,
                    'descricao': ind.descricao_uso
                })
            
            metodos_prep = []
            for met in parte.metodos_preparacao:
                metodos_prep.append({
                    'id_preparacao': met.id_metodo_preparacao,
                    'descricao': met.descricao_metodo_preparacao
                })
            
            metodos_ext = []
            for met in parte.metodos_extracao:
                metodos_ext.append({
                    'id_extraccao': met.id_metodo_extraccao,
                    'descricao': met.descricao_metodo_extraccao
                })
            
            partes_usadas.append({
                'id_parte': parte.id_parte,
                'nome_parte': parte.nome_parte,
                'indicacoes': indicacoes,
                'metodos_preparacao': metodos_prep,
                'metodos_extracao': metodos_ext
            })

        logger.info(f"   • {len(partes_usadas)} partes usadas processadas")
        
        # ✅ Imagens
        imagens = []
        for idx, img in enumerate(planta.imagens):
            imagens.append({
                'id_imagem': img.id_imagem,
                'nome_arquivo': img.nome_arquivo,
                'url': img.url_armazenamento,
                'url_armazenamento': img.url_armazenamento,
                'legenda': img.legenda,
                'referencia_img': img.referencia_img,
                'ordem': idx + 1
            })
        
        # ✅ Autores
        autores_dict = {}
        for ref in planta.referencias:
            for autor in ref.autores:
                if autor.id_autor not in autores_dict:
                    afiliacoes = []
                    for af in autor.afiliacoes:
                        afiliacoes.append({
                            'nome_afiliacao': af.nome_afiliacao,
                            'sigla_afiliacao': af.sigla_afiliacao
                        })
                    
                    autores_dict[autor.id_autor] = {
                        'id_autor': autor.id_autor,
                        'nome_autor': autor.nome_autor,
                        'afiliacoes': afiliacoes
                    }
        
        autores = list(autores_dict.values())
        
        # ✅ Referências
        referencias = []
        for ref in planta.referencias:
            autores_ref = []
            for aut in ref.autores:
                autores_ref.append({
                    'id_autor': aut.id_autor,
                    'nome_autor': aut.nome_autor
                })
            
            referencias.append({
                'id_referencia': ref.id_referencia,
                'titulo_referencia': ref.titulo_referencia,
                'link_referencia': ref.link_referencia,
                'ano_publicacao': ref.ano_publicacao,
                'autores': autores_ref
            })
        
        # ✅ Compatibilidade
        usos_medicinais = []
        for parte in planta.partes:
            for indicacao in parte.indicacoes:
                usos_medicinais.append({
                    'id_uso': indicacao.id_uso,
                    'parte_usada': parte.nome_parte,
                    'observacoes': indicacao.descricao_uso
                })
        
        result = {
            'id_planta': planta.id_planta,
            'nome_cientifico': planta.nome_cientifico,
            'familia': planta.familia,
            'infos_adicionais': planta.infos_adicionais,
            'comp_quimica': planta.comp_quimica,
            'prop_farmacologica': planta.prop_farmacologica,
            'nomes_comuns': nomes_comuns,
            'locais': locais,
            'provincias': provincias,
            'partes_usadas': partes_usadas,
            'imagens': imagens,
            'autores': autores,
            'referencias': referencias,
            'usos_medicinais': usos_medicinais
        }
        
        logger.info(f"✅ Retornando: {len(nomes_comuns)} nomes, {len(locais)} locais, {len(partes_usadas)} partes")
        
        return result
    
    @staticmethod
    def validate_step(step, form_data):
        """Valida dados de um step específico do wizard"""
        errors = {}
        warnings = []
        
        if step == 1:
            if not form_data.get('nome_cientifico', '').strip():
                errors['nome_cientifico'] = 'Nome científico é obrigatório'
            else:
                existing = PlantaMedicinal.query.filter_by(
                    nome_cientifico=form_data['nome_cientifico']
                ).first()
                if existing:
                    errors['nome_cientifico'] = 'Planta com este nome científico já existe'
            
            if not form_data.get('familia', '').strip():
                errors['familia'] = 'Família é obrigatória'
        
        elif step == 2:
            nomes_comuns = form_data.get('nomes_comuns', [])
            nomes_validos = [nome.strip() for nome in nomes_comuns if nome and nome.strip()]
            if len(nomes_validos) == 0:
                errors['nomes_comuns'] = 'Pelo menos um nome comum é obrigatório'
            
            locais = form_data.get('locais', [])
            if len(locais) == 0:
                errors['locais'] = 'Pelo menos um local de colheita deve ser selecionado'
        
        elif step == 3:
            partes = form_data.get('partes', [])
            if len(partes) == 0:
                errors['partes'] = 'Pelo menos uma parte da planta deve ser selecionada'
            
            for i, parte_data in enumerate(partes):
                if not parte_data.get('indicacoes') or len(parte_data.get('indicacoes', [])) == 0:
                    errors[f'partes[{i}].indicacoes'] = 'Cada parte deve ter pelo menos uma indicação'
        
        elif step == 4:
            comp_quimica = form_data.get('comp_quimica', '').strip()
            prop_farmacologica = form_data.get('prop_farmacologica', '').strip()
            
            if not comp_quimica and not prop_farmacologica:
                warnings.append('Considere adicionar informações sobre composição química ou propriedades farmacológicas')
        
        elif step == 5:
            imagens = form_data.get('imagens', [])
            if len(imagens) == 0:
                errors['imagens'] = 'Pelo menos uma imagem da planta é obrigatória'
            else:
                for i, img_data in enumerate(imagens):
                    is_valid, error_msg = validate_image_data(img_data.get('file_data', ''))
                    if not is_valid:
                        errors[f'imagens[{i}]'] = error_msg
        
        elif step == 6:
            referencias = form_data.get('referencias', [])
            if len(referencias) == 0:
                errors['referencias'] = 'Pelo menos uma referência bibliográfica é obrigatória'
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    @staticmethod
    def create_planta(data):
        """Cria uma nova planta medicinal"""
        try:
            planta = PlantaMedicinal(
                nome_cientifico=data['nome_cientifico'],
                familia=data['familia'],
                infos_adicionais=data.get('infos_adicionais'),
                comp_quimica=data.get('comp_quimica'),
                prop_farmacologica=data.get('prop_farmacologica')
            )
            
            db.session.add(planta)
            db.session.flush()
            
            logger.info(f"✅ Planta criada: {planta.nome_cientifico} (ID: {planta.id_planta})")
            
            for nome_comum in data.get('nomes_comuns', []):
                if nome_comum and nome_comum.strip():
                    nc = NomeComum(
                        nome=nome_comum.strip(),
                        id_planta=planta.id_planta
                    )
                    db.session.add(nc)
            
            for id_local in data.get('locais', []):
                local = LocalColheita.query.get(id_local)
                if local:
                    planta.locais.append(local)
            
            partes_processadas = PlantaService._process_indicacoes(planta, data.get('partes', []))
            logger.info(f"   • {partes_processadas} partes processadas")
            
            imagens_processadas = PlantaService._process_imagens(planta, data.get('imagens', []))
            logger.info(f"   • {imagens_processadas} imagens processadas")
            
            referencias_processadas = PlantaService._process_referencias(planta, data.get('referencias', []))
            logger.info(f"   • {referencias_processadas} referências associadas")
            
            db.session.commit()
            
            logger.info(f"🎉 Planta {planta.nome_cientifico} criada com sucesso!")
            
            return planta
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Erro ao criar planta: {e}")
            raise
    
    @staticmethod
    def _process_indicacoes(planta, partes_data):
        """Processa partes usadas com indicações e métodos"""
        count = 0
        
        for parte_info in partes_data:
            id_parte = parte_info.get('id_parte')
            if not id_parte:
                continue
            
            parte = ParteUsada.query.get(id_parte)
            if not parte:
                continue
            
            if parte not in planta.partes:
                planta.partes.append(parte)
            
            for id_indicacao in parte_info.get('indicacoes', []):
                indicacao = Indicacao.query.get(id_indicacao)
                if indicacao and indicacao not in parte.indicacoes:
                    parte.indicacoes.append(indicacao)
            
            for id_metodo in parte_info.get('metodos_preparacao', []):
                metodo = MetodoPreparacaoTrad.query.get(id_metodo)
                if metodo and metodo not in parte.metodos_preparacao:
                    parte.metodos_preparacao.append(metodo)
            
            for id_extracao in parte_info.get('metodos_extracao', []):
                metodo = MetodoExtraccaoCientif.query.get(id_extracao)
                if metodo and metodo not in parte.metodos_extracao:
                    parte.metodos_extracao.append(metodo)
            
            count += 1
        
        return count
    
    @staticmethod
    def _process_imagens(planta, imagens_data):
        """Processa e salva imagens"""
        count = 0
        
        for img_info in imagens_data:
            try:
                file_data = img_info.get('file_data', '')
                file_extension = img_info.get('file_extension', 'jpg')
                legenda = img_info.get('legenda', '')
                referencia_img = img_info.get('referencia_img', '')
                
                if not file_data:
                    continue
                
                result = save_plant_image(planta.id_planta, file_data, file_extension)
                
                if result:
                    imagem = Imagem(
                        nome_arquivo=result['nome_arquivo'],
                        url_armazenamento=result['url_armazenamento'],
                        legenda=legenda,
                        referencia_img=referencia_img,
                        id_planta=planta.id_planta
                    )
                    db.session.add(imagem)
                    count += 1
                    
            except Exception as e:
                logger.error(f"⚠️ Erro ao processar imagem: {e}")
                continue
        
        return count
    
    @staticmethod
    def _process_referencias(planta, referencias_ids):
        """Associa referências"""
        count = 0
        
        for ref_id in referencias_ids:
            referencia = Referencia.query.get(ref_id)
            if referencia and referencia not in planta.referencias:
                planta.referencias.append(referencia)
                count += 1
        
        return count
    
    @staticmethod
    def create_referencia(data):
        """Cria uma nova referência com autores"""
        try:
            if not data.get('titulo_referencia', '').strip():
                raise ValueError('Título é obrigatório')
            
            existing = Referencia.query.filter_by(
                titulo_referencia=data['titulo_referencia']
            ).first()
            
            if existing:
                raise ValueError(f'Referência "{data["titulo_referencia"]}" já existe')
            
            referencia = Referencia(
                titulo_referencia=data['titulo_referencia'],
                link_referencia=data.get('link_referencia'),
                ano_publicacao=data.get('ano_publicacao')
            )
            
            db.session.add(referencia)
            db.session.flush()
            
            autores_data = data.get('autores', [])
            if len(autores_data) == 0:
                raise ValueError('Pelo menos um autor é obrigatório')
            
            for autor_info in autores_data:
                autor = PlantaService._get_or_create_autor(autor_info)
                if autor not in referencia.autores:
                    referencia.autores.append(autor)
            
            db.session.commit()
            
            logger.info(f"✅ Referência criada: {referencia.titulo_referencia}")
            
            return referencia
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Erro ao criar referência: {e}")
            raise
    
    @staticmethod
    def _get_or_create_autor(autor_info):
        """Busca ou cria autor"""
        if autor_info.get('id_autor'):
            autor = Autor.query.get(autor_info['id_autor'])
            if autor:
                return autor
        
        nome_autor = autor_info.get('nome_autor', '').strip()
        if not nome_autor:
            raise ValueError('Nome do autor é obrigatório')
        
        autor = Autor.query.filter_by(nome_autor=nome_autor).first()
        
        if autor:
            afiliacoes_info = autor_info.get('afiliacoes', [])
            if afiliacoes_info:
                PlantaService._process_autor_afiliacoes(autor, afiliacoes_info)
            return autor
        
        autor = Autor(nome_autor=nome_autor)
        db.session.add(autor)
        db.session.flush()
        
        afiliacoes_info = autor_info.get('afiliacoes', [])
        if afiliacoes_info:
            PlantaService._process_autor_afiliacoes(autor, afiliacoes_info)
        
        logger.info(f"   • Novo autor criado: {nome_autor}")
        
        return autor
    
    @staticmethod
    def _process_autor_afiliacoes(autor, afiliacoes_info):
        """Associa afiliações a autor"""
        for afiliacao_data in afiliacoes_info:
            if afiliacao_data.get('id_afiliacao'):
                afiliacao = Afiliacao.query.get(afiliacao_data['id_afiliacao'])
            else:
                nome_afiliacao = afiliacao_data.get('nome_afiliacao', '').strip()
                if not nome_afiliacao:
                    continue
                
                afiliacao = Afiliacao.query.filter_by(
                    nome_afiliacao=nome_afiliacao
                ).first()
                
                if not afiliacao:
                    afiliacao = Afiliacao(
                        nome_afiliacao=nome_afiliacao,
                        sigla_afiliacao=afiliacao_data.get('sigla_afiliacao')
                    )
                    db.session.add(afiliacao)
                    db.session.flush()
            
            if afiliacao and afiliacao not in autor.afiliacoes:
                autor.afiliacoes.append(afiliacao)
    
    @staticmethod
    def create_local_colheita(nome_local, id_provincia):
        """Cria novo local de colheita"""
        try:
            provincia = Provincia.query.get(id_provincia)
            if not provincia:
                raise ValueError('Província não encontrada')
            
            local = LocalColheita(
                nome_local=nome_local,
                id_provincia=id_provincia
            )
            
            db.session.add(local)
            db.session.commit()
            
            logger.info(f"✅ Local criado: {nome_local} ({provincia.provincia})")
            
            return local
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"❌ Erro ao criar local: {e}")
            raise
    
    @staticmethod
    def get_plantas_by_familia(familia):
        """Busca plantas similares pela família"""
        return PlantaMedicinal.query.filter_by(familia=familia).limit(5).all()
    
    @staticmethod
    def check_nome_cientifico_exists(nome_cientifico):
        """Verifica se nome científico já existe"""
        planta = PlantaMedicinal.query.filter_by(
            nome_cientifico=nome_cientifico
        ).first()
        
        return {
            'exists': planta is not None,
            'planta': planta.to_dict() if planta else None
        }