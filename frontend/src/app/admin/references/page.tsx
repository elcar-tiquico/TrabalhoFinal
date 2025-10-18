"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import styles from "./references.module.css"

// ==================== INTERFACES ADAPTADAS ====================

interface Afiliacao {
  id_afiliacao: number
  nome_afiliacao: string
  sigla_afiliacao?: string
}

interface AutorReferenciasHover {
  id_autor: number
  referencias: {
    id_referencia: number
    titulo_referencia: string
    ano_publicacao?: number | string
  }[]
}

interface Autor {
  id_autor: number
  nome_autor: string
  afiliacoes?: Afiliacao[]  // ✅ AGORA É ARRAY DE OBJETOS
  total_plantas?: number
  total_referencias?: number
}

interface AutorReferencia {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

interface Referencia {
  id_referencia: number
  titulo_referencia: string  // ✅ AGORA É OBRIGATÓRIO
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese' | 'Outro'  // ✅ Inferido do backend
  ano_publicacao?: number | string
  link_referencia: string
  total_plantas?: number
  autores_especificos?: AutorReferencia[]
}

interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  search_applied?: string
}

interface AutoresResponse extends PaginatedResponse<Autor> {
  autores: Autor[]
}

interface ReferenciasResponse extends PaginatedResponse<Referencia> {
  referencias: Referencia[]
}

type TabType = 'autores' | 'referencias'
type SortField = 'nome_autor' | 'total_plantas' | 'total_referencias' | 'titulo_referencia' | 'ano_publicacao' | 'tipo_referencia'
type SortOrder = 'asc' | 'desc'
type ModalMode = 'add' | 'edit' | 'view'

interface FormDataAutor {
  nome_autor: string
  afiliacoes_selecionadas: number[]
}

interface FormDataReferencia {
  titulo_referencia: string
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese' | ''
  ano_publicacao: string
  link_referencia: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ==================== MODAL DE CONFIRMAÇÃO ====================
interface ModalConfirmacaoProps {
  showConfirmModal: boolean
  confirmModalData: {
    type: 'delete' | 'warning'
    title: string
    message: string
    itemId?: number
    itemName?: string
    totalRelacionados?: number
  } | null
  onConfirmar: () => void
  onFechar: () => void
}

const ModalConfirmacao = memo<ModalConfirmacaoProps>(({ 
  showConfirmModal, 
  confirmModalData, 
  onConfirmar, 
  onFechar 
}) => {
  if (!showConfirmModal || !confirmModalData) return null

  return (
    <div className={styles.modalOverlay} onClick={onFechar}>
      <div className={`${styles.modalContent} ${styles.modalContentSmall}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {confirmModalData.title}
          </h2>
          <button 
            className={styles.modalCloseButton}
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={styles.modalBody}>
          {confirmModalData.type === 'warning' ? (
            <div className={styles.confirmContent}>
              <div className={styles.confirmIcon}>⚠️</div>
              <p className={styles.confirmMessage}>
                {confirmModalData.message}
              </p>
              <div className={styles.warningBox}>
                <p className={styles.warningBoxTitle}>
                  Para excluir este item, primeiro precisa:
                </p>
                <ul className={styles.warningBoxList}>
                  <li>Remover as {confirmModalData.totalRelacionados} associações relacionadas, OU</li>
                  <li>Transferir as associações para outro item</li>
                </ul>
              </div>
              <p className={styles.confirmNote}>
                Esta validação protege a integridade dos dados.
              </p>
            </div>
          ) : (
            <div className={styles.confirmContent}>
              <div className={styles.confirmIcon}>🗑️</div>
              <p className={styles.confirmMessage}>
                {confirmModalData.message}
              </p>
              <p className={styles.confirmNote}>
                Esta acção não pode ser desfeita.
              </p>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.btnSecondary}
            onClick={onFechar}
          >
            {confirmModalData.type === 'warning' ? 'Entendi' : 'Cancelar'}
          </button>
          
          {confirmModalData.type === 'delete' && (
            <button 
              className={styles.btnDanger}
              onClick={onConfirmar}
            >
              Sim, Excluir
            </button>
          )}
        </div>
      </div>
    </div>
  )
})

// ==================== MODAL DE GESTÃO PARA AUTORES ====================
interface ModalGestaoAutorProps {
  showModal: boolean
  modalMode: ModalMode
  modalLoading: boolean
  selectedItem: Autor | null
  formData: FormDataAutor
  todasAfiliacoes: Afiliacao[]
  loadingAfiliacoes: boolean
  showNovaAfiliacaoForm: boolean
  novaAfiliacaoNome: string
  novaAfiliacaoSigla: string
  criandoAfiliacao: boolean
  onFechar: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onToggleAfiliacao: (idAfiliacao: number) => void
  onToggleNovaAfiliacaoForm: () => void
  onChangeNovaAfiliacaoNome: (value: string) => void
  onChangeNovaAfiliacaoSigla: (value: string) => void
  onCriarAfiliacao: () => void
}

const ModalGestaoAutor = memo<ModalGestaoAutorProps>(({ 
  showModal, 
  modalMode, 
  modalLoading, 
  selectedItem, 
  formData, 
  todasAfiliacoes,
  loadingAfiliacoes,
  showNovaAfiliacaoForm,
  novaAfiliacaoNome,
  novaAfiliacaoSigla,
  criandoAfiliacao,
  onFechar, 
  onSubmit, 
  onInputChange,
  onToggleAfiliacao,
  onToggleNovaAfiliacaoForm,
  onChangeNovaAfiliacaoNome,
  onChangeNovaAfiliacaoSigla,
  onCriarAfiliacao
}) => {
  if (!showModal) return null

  return (
    <div className={styles.modalOverlay} onClick={onFechar}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {modalMode === 'add' && 'Adicionar Novo Autor'}
            {modalMode === 'edit' && 'Editar Autor'}
            {modalMode === 'view' && 'Detalhes do Autor'}
          </h2>
          <button 
            className={styles.modalCloseButton}
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {modalLoading ? (
          <div className={styles.modalLoading}>
            <div className={styles.modalLoadingSpinner}></div>
            <p>Processando...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className={styles.modalBody}>
              {modalMode === 'view' && selectedItem ? (
                <div className={styles.viewContent}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>ID:</label>
                      <span>{selectedItem.id_autor}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Nome do Autor:</label>
                      <span><strong>{selectedItem.nome_autor}</strong></span>
                    </div>
                    
                    {selectedItem.afiliacoes && selectedItem.afiliacoes.length > 0 && (
                      <div className={`${styles.infoItem} ${styles.formGridFull}`}>
                        <label>Afiliações:</label>
                        <div className={styles.afiliacoesContainer}>
                          {selectedItem.afiliacoes.map((af) => (
                            <div key={af.id_afiliacao} className={styles.afiliacaoCard}>
                              <strong>{af.nome_afiliacao}</strong>
                              {af.sigla_afiliacao && (
                                <span className={styles.afiliacaoSigla}>({af.sigla_afiliacao})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {(!selectedItem.afiliacoes || selectedItem.afiliacoes.length === 0) && (
                      <div className={styles.infoItem}>
                        <label>Afiliações:</label>
                        <span className={styles.textMuted}>Sem afiliação registada</span>
                      </div>
                    )}
                    
                    <div className={styles.infoItem}>
                      <label>Total de Plantas:</label>
                      <span>{selectedItem.total_plantas || 0} plantas</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Total de Referências:</label>
                      <span>{selectedItem.total_referencias || 0} referências</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.formGrid}>
                  {/* CAMPO DE NOME */}
                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <label htmlFor="nome_autor" className={styles.formLabel}>
                      Nome do Autor *
                    </label>
                    <input
                      type="text"
                      id="nome_autor"
                      name="nome_autor"
                      value={formData.nome_autor}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: João Silva, Maria Santos..."
                      maxLength={255}
                      disabled={modalLoading}
                      autoComplete="off"
                      autoFocus={modalMode !== 'view'}
                    />
                    <p className={styles.formHint}>
                      Nome completo do autor (máximo 255 caracteres)
                    </p>
                    <div className={`${styles.characterCount} ${(formData.nome_autor?.length || 0) > 235 ? styles.characterCountWarning : styles.characterCountNormal}`}>
                      {formData.nome_autor?.length || 0}/255 caracteres
                    </div>
                  </div>

                  {/* ✅ GESTÃO DE AFILIAÇÕES */}
                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <label className={styles.formLabel}>
                        Afiliações
                        {loadingAfiliacoes && (
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#059669' }}>
                            (a carregar...)
                          </span>
                        )}
                      </label>
                      
                      {!showNovaAfiliacaoForm && (
                        <button
                          type="button"
                          onClick={onToggleNovaAfiliacaoForm}
                          disabled={modalLoading || loadingAfiliacoes}
                          style={{
                            fontSize: '0.875rem',
                            color: '#002856',
                            backgroundColor: 'transparent',
                            border: '1px solid #002856',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '0.375rem',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#ecfdf5'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          + Nova Afiliação
                        </button>
                      )}
                    </div>
                    
                    {/* FORMULÁRIO PARA CRIAR NOVA AFILIAÇÃO */}
                    {showNovaAfiliacaoForm && (
                      <div style={{
                        border: '2px dashed #002856',
                        borderRadius: '0.5rem',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: '#f0f4f8'
                      }}>
                        <h4 style={{ 
                          fontSize: '0.875rem', 
                          fontWeight: '600', 
                          marginBottom: '0.75rem',
                          color: '#002856'
                        }}>
                          Criar Nova Afiliação
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '500',
                              display: 'block',
                              marginBottom: '0.25rem',
                              color: '#002856'
                            }}>
                              Nome da Afiliação *
                            </label>
                            <input
                              type="text"
                              value={novaAfiliacaoNome}
                              onChange={(e) => onChangeNovaAfiliacaoNome(e.target.value)}
                              placeholder="Ex: Instituto Superior de Ciências e Tecnologia de Moçambique"
                              maxLength={255}
                              disabled={criandoAfiliacao}
                              className={styles.formInput}
                              style={{ width: '100%' }}
                            />
                          </div>
                          
                          <div>
                            <label style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '500',
                              display: 'block',
                              marginBottom: '0.25rem',
                              color: '#002856'
                            }}>
                              Sigla (opcional)
                            </label>
                            <input
                              type="text"
                              value={novaAfiliacaoSigla}
                              onChange={(e) => onChangeNovaAfiliacaoSigla(e.target.value)}
                              placeholder="Ex: ISCTEM"
                              maxLength={20}
                              disabled={criandoAfiliacao}
                              className={styles.formInput}
                              style={{ width: '100%' }}
                            />
                          </div>
                          
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              onClick={onToggleNovaAfiliacaoForm}
                              disabled={criandoAfiliacao}
                              style={{
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                border: '1px solid #002856',
                                borderRadius: '0.375rem',
                                backgroundColor: 'white',
                                color: '#002856',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!criandoAfiliacao) {
                                  e.currentTarget.style.backgroundColor = '#f0f4f8'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'white'
                              }}
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={onCriarAfiliacao}
                              disabled={criandoAfiliacao || !novaAfiliacaoNome.trim()}
                              style={{
                                fontSize: '0.875rem',
                                padding: '0.5rem 1rem',
                                border: 'none',
                                borderRadius: '0.375rem',
                                backgroundColor: '#eba900',
                                color: '#002856',
                                cursor: 'pointer',
                                fontWeight: '600',
                                opacity: criandoAfiliacao || !novaAfiliacaoNome.trim() ? 0.5 : 1,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!criandoAfiliacao && novaAfiliacaoNome.trim()) {
                                  e.currentTarget.style.backgroundColor = '#d19700'
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#eba900'
                              }}
                            >
                              {criandoAfiliacao ? 'A criar...' : 'Criar e Selecionar'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {loadingAfiliacoes ? (
                      <div style={{ padding: '1rem', textAlign: 'center' }}>
                        <div className={styles.modalLoadingSpinner}></div>
                      </div>
                    ) : todasAfiliacoes.length === 0 ? (
                      <div style={{ 
                        padding: '1rem', 
                        backgroundColor: '#f3f4f6', 
                        borderRadius: '0.375rem',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}>
                        Nenhuma afiliação disponível. Clique em "Nova Afiliação" para criar.
                      </div>
                    ) : (
                      <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid #e5e7eb',
                        borderRadius: '0.375rem',
                        padding: '0.5rem'
                      }}>
                        {todasAfiliacoes.map((afiliacao) => {
                          const isSelected = formData.afiliacoes_selecionadas.includes(afiliacao.id_afiliacao)
                          
                          return (
                            <label
                              key={afiliacao.id_afiliacao}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0.5rem',
                                cursor: 'pointer',
                                borderRadius: '0.25rem',
                                backgroundColor: isSelected ? '#ecfdf5' : 'transparent',
                                border: isSelected ? '1px solid #059669' : '1px solid transparent',
                                marginBottom: '0.25rem',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = '#f9fafb'
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.backgroundColor = 'transparent'
                                }
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleAfiliacao(afiliacao.id_afiliacao)}
                                disabled={modalLoading}
                                style={{
                                  marginRight: '0.5rem',
                                  cursor: 'pointer',
                                  width: '16px',
                                  height: '16px'
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: isSelected ? '600' : '400' }}>
                                  {afiliacao.nome_afiliacao}
                                </span>
                                {afiliacao.sigla_afiliacao && (
                                  <span style={{ 
                                    marginLeft: '0.5rem', 
                                    color: '#6b7280',
                                    fontSize: '0.875rem'
                                  }}>
                                    ({afiliacao.sigla_afiliacao})
                                  </span>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    )}
                    
                    <p className={styles.formHint}>
                      💡 Selecione uma ou mais afiliações para este autor
                    </p>
                    
                    {formData.afiliacoes_selecionadas.length > 0 && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                          ✓ {formData.afiliacoes_selecionadas.length} afiliação(ões) selecionada(s)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                type="button"
                className={styles.btnSecondary}
                onClick={onFechar}
                disabled={modalLoading}
              >
                {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              
              {modalMode !== 'view' && (
                <button 
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={modalLoading || !formData.nome_autor.trim()}
                >
                  {modalLoading ? (
                    <span className={styles.btnLoading}>
                      <div className={styles.btnLoadingSpinner}></div>
                      Processando...
                    </span>
                  ) : (
                    modalMode === 'edit' ? 'Actualizar' : 'Criar'
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
})

// ==================== MODAL DE GESTÃO PARA REFERÊNCIAS ====================
interface ModalGestaoReferenciaProps {
  showModal: boolean
  modalMode: ModalMode
  modalLoading: boolean
  selectedItem: Referencia | null
  formData: FormDataReferencia
  onFechar: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

const ModalGestaoReferencia = memo<ModalGestaoReferenciaProps>(({ 
  showModal, 
  modalMode, 
  modalLoading, 
  selectedItem, 
  formData, 
  onFechar, 
  onSubmit, 
  onInputChange
}) => {
  if (!showModal) return null

  return (
    <div className={styles.modalOverlay} onClick={onFechar}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {modalMode === 'add' && 'Adicionar Nova Referência'}
            {modalMode === 'edit' && 'Editar Referência'}
            {modalMode === 'view' && 'Detalhes da Referência'}
          </h2>
          <button 
            className={styles.modalCloseButton}
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {modalLoading ? (
          <div className={styles.modalLoading}>
            <div className={styles.modalLoadingSpinner}></div>
            <p>Processando...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit}>
            <div className={styles.modalBody}>
              {modalMode === 'view' && selectedItem ? (
                <div className={styles.viewContent}>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <label>ID:</label>
                      <span>{selectedItem.id_referencia}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Tipo:</label>
                      <span className={styles.badge}>
                        {selectedItem.tipo_referencia || 'Outro'}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Ano:</label>
                      <span>{selectedItem.ano_publicacao || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Total de Plantas:</label>
                      <span>{selectedItem.total_plantas || 0} plantas</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <label>Título:</label>
                    <p><strong>{selectedItem.titulo_referencia}</strong></p>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <label>Link/URL:</label>
                    <a 
                      href={selectedItem.link_referencia} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.cellLink}
                    >
                      {selectedItem.link_referencia}
                    </a>
                  </div>

                  {selectedItem.autores_especificos && selectedItem.autores_especificos.length > 0 && (
                    <div className={styles.autoresSection}>
                      <label>Autores:</label>
                      <div>
                        {selectedItem.autores_especificos.map((autor) => (
                          <div key={autor.id_autor} className={styles.autorCard}>
                            <div className={styles.autorCardHeader}>
                              <div className={styles.autorCardInfo}>
                                <p className={styles.autorName}>{autor.nome_autor}</p>
                                {autor.afiliacao && (
                                  <p className={styles.autorAffiliation}>{autor.afiliacao}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.formGrid}>
                  {/* ✅ TÍTULO AGORA É OBRIGATÓRIO */}
                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <label htmlFor="titulo_referencia" className={styles.formLabel}>
                      Título da Referência *
                    </label>
                    <input
                      type="text"
                      id="titulo_referencia"
                      name="titulo_referencia"
                      value={formData.titulo_referencia}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: Plantas Medicinais de Moçambique..."
                      maxLength={255}
                      disabled={modalLoading}
                      autoComplete="off"
                      autoFocus={modalMode !== 'view'}
                    />
                    <p className={styles.formHint}>
                      Título completo da obra ou publicação (obrigatório)
                    </p>
                    <div className={`${styles.characterCount} ${(formData.titulo_referencia?.length || 0) > 235 ? styles.characterCountWarning : styles.characterCountNormal}`}>
                      {formData.titulo_referencia?.length || 0}/255 caracteres
                    </div>
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="ano_publicacao" className={styles.formLabel}>
                      Ano de Publicação
                    </label>
                    <input
                      type="text"
                      id="ano_publicacao"
                      name="ano_publicacao"
                      value={formData.ano_publicacao}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: 2023, 2024..."
                      maxLength={4}
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                    <p className={styles.formHint}>
                      Ano de publicação (opcional)
                    </p>
                  </div>

                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <label htmlFor="link_referencia" className={styles.formLabel}>
                      Link/URL da Referência
                    </label>
                    <input
                      type="url"
                      id="link_referencia"
                      name="link_referencia"
                      value={formData.link_referencia}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: https://exemplo.com/artigo..."
                      maxLength={255}
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                    <p className={styles.formHint}>
                      URL completa da referência (opcional)
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button 
                type="button"
                className={styles.btnSecondary}
                onClick={onFechar}
                disabled={modalLoading}
              >
                {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              
              {modalMode !== 'view' && (
                <button 
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={modalLoading || !formData.titulo_referencia.trim()}
                >
                  {modalLoading ? (
                    <span className={styles.btnLoading}>
                      <div className={styles.btnLoadingSpinner}></div>
                      Processando...
                    </span>
                  ) : (
                    modalMode === 'edit' ? 'Actualizar' : 'Criar'
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
})

// ==================== COMPONENTE PRINCIPAL ====================
export default function AutoresReferenciasPage() {
  // Estados principais
  const [activeTab, setActiveTab] = useState<TabType>('autores')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para autores
  const [autores, setAutores] = useState<Autor[]>([])
  const [searchTermAutores, setSearchTermAutores] = useState<string>("")
  const [debouncedSearchTermAutores, setDebouncedSearchTermAutores] = useState<string>("")
  const [currentPageAutores, setCurrentPageAutores] = useState<number>(1)
  const [totalPagesAutores, setTotalPagesAutores] = useState<number>(1)
  const [totalAutores, setTotalAutores] = useState<number>(0)
  
  // Estados para referências
  const [referencias, setReferencias] = useState<Referencia[]>([])
  const [searchTermReferencias, setSearchTermReferencias] = useState<string>("")
  const [debouncedSearchTermReferencias, setDebouncedSearchTermReferencias] = useState<string>("")
  const [currentPageReferencias, setCurrentPageReferencias] = useState<number>(1)
  const [totalPagesReferencias, setTotalPagesReferencias] = useState<number>(1)
  const [totalReferencias, setTotalReferencias] = useState<number>(0)
  
  // Estados compartilhados
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  const [sortBy, setSortBy] = useState<SortField>('nome_autor')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Estados para modal
  const [showModal, setShowModal] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<ModalMode>('add')
  const [selectedAutor, setSelectedAutor] = useState<Autor | null>(null)
  const [selectedReferencia, setSelectedReferencia] = useState<Referencia | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)

  // ✅ ESTADOS DE FORMULÁRIO SIMPLIFICADOS
  const [formDataAutor, setFormDataAutor] = useState<FormDataAutor>({
    nome_autor: "",
    afiliacoes_selecionadas: []
  })

  const [formDataReferencia, setFormDataReferencia] = useState<FormDataReferencia>({
    titulo_referencia: "",
    ano_publicacao: "",
    link_referencia: ""
  })

  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'delete' | 'warning'
    title: string
    message: string
    itemId?: number
    itemName?: string
    totalRelacionados?: number
  } | null>(null)

  //Estados para hover
  const [hoverAutorId, setHoverAutorId] = useState<number | null>(null)
  const [hoverReferencias, setHoverReferencias] = useState<AutorReferenciasHover | null>(null)
  const [loadingHover, setLoadingHover] = useState<boolean>(false)

  // Estados para afiliações
  const [todasAfiliacoes, setTodasAfiliacoes] = useState<Afiliacao[]>([])
  const [loadingAfiliacoes, setLoadingAfiliacoes] = useState<boolean>(false)
  const [showNovaAfiliacaoForm, setShowNovaAfiliacaoForm] = useState<boolean>(false)
  const [novaAfiliacaoNome, setNovaAfiliacaoNome] = useState<string>("")
  const [novaAfiliacaoSigla, setNovaAfiliacaoSigla] = useState<string>("")
  const [criandoAfiliacao, setCriandoAfiliacao] = useState<boolean>(false)

  // ==================== DEBOUNCE HOOKS ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermAutores(searchTermAutores)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTermAutores])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermReferencias(searchTermReferencias)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTermReferencias])

  // ==================== URL PARAMS & HIGHLIGHT ====================
  useEffect(() => {
    const processUrlParams = async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
    
      const urlParams = new URLSearchParams(window.location.search)
      const highlightId = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearch = urlParams.get('search')
      const highlightType = urlParams.get('type')
      const tabParam = urlParams.get('tab')
    
      console.log('🔍 Processando parâmetros da URL:', {
        highlight: highlightId,
        type: highlightType,
        page: pageParam,
        search: urlSearch,
        tab: tabParam
      })
    
      if (tabParam === 'autores') {
        setActiveTab('autores')
      } else if (tabParam === 'referencias') {
        setActiveTab('referencias')
      } else if (highlightType === 'autor') {
        setActiveTab('autores')
      } else if (highlightType === 'referencia') {
        setActiveTab('referencias')
      }
    
      if (urlSearch) {
        const decodedSearch = decodeURIComponent(urlSearch)
        if (highlightType === 'autor') {
          setSearchTermAutores(decodedSearch)
          setDebouncedSearchTermAutores(decodedSearch)
        } else {
          setSearchTermReferencias(decodedSearch)
          setDebouncedSearchTermReferencias(decodedSearch)
        }
      }
    
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          if (highlightType === 'autor') {
            setCurrentPageAutores(pageNumber)
          } else {
            setCurrentPageReferencias(pageNumber)
          }
        }
      }
    
      if (highlightId && highlightType) {
        const dataAttribute = highlightType === 'autor' ? 'data-autor-id' : 'data-referencia-id'
        setTimeout(() => {
          const element = document.querySelector(`[${dataAttribute}="${highlightId}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
            setTimeout(() => element.classList.remove('highlighted'), 5000)
          }
        }, 4000)
      }
    
      if (highlightId || pageParam || urlSearch || highlightType || tabParam) {
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
  
    processUrlParams()
  }, [])
  
  // ==================== LOAD DATA ====================
  useEffect(() => {
    if (activeTab === 'autores') {
      carregarAutores()
    } else {
      carregarReferencias()
    }
  }, [
    activeTab,
    currentPageAutores,
    currentPageReferencias,
    itemsPerPage,
    debouncedSearchTermAutores,
    debouncedSearchTermReferencias
  ])

  useEffect(() => {
    if (activeTab === 'autores' && debouncedSearchTermAutores !== searchTermAutores) {
      setCurrentPageAutores(1)
    }
  }, [debouncedSearchTermAutores, searchTermAutores, activeTab])

  useEffect(() => {
    if (activeTab === 'referencias' && debouncedSearchTermReferencias !== searchTermReferencias) {
      setCurrentPageReferencias(1)
    }
  }, [debouncedSearchTermReferencias, searchTermReferencias, activeTab])

  // ==================== CARREGAR AUTORES ====================
  const carregarAutores = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPageAutores.toString(),
        limit: itemsPerPage.toString()
      })
      
      if (debouncedSearchTermAutores) {
        params.append('search', debouncedSearchTermAutores)
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/autores?${params}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: AutoresResponse = await response.json()
      
      setAutores(data.autores || [])
      setTotalAutores(data.total || 0)
      setTotalPagesAutores(data.total_pages || 1)
      
    } catch (err) {
      console.error('❌ Erro ao carregar autores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar autores: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ==================== CARREGAR REFERÊNCIAS ====================
  const carregarReferencias = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPageReferencias.toString(),
        limit: itemsPerPage.toString()
      })
      
      if (debouncedSearchTermReferencias) {
        params.append('search', debouncedSearchTermReferencias)
      }
      
      const response = await fetch(`${API_BASE_URL}/api/admin/referencias?${params}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: ReferenciasResponse = await response.json()
      
      setReferencias(data.referencias || [])
      setTotalReferencias(data.total || 0)
      setTotalPagesReferencias(data.total_pages || 1)
      
    } catch (err) {
      console.error('❌ Erro ao carregar referências:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar referências: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // Carregar referências do autor para hover
  const carregarReferenciasAutor = async (idAutor: number): Promise<void> => {
    if (hoverReferencias && hoverReferencias.id_autor === idAutor) {
      return // Já carregou
    }
    
    try {
      setLoadingHover(true)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/autores/${idAutor}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar referências')
      }
      
      const data = await response.json()
      
      setHoverReferencias({
        id_autor: idAutor,
        referencias: data.referencias_recentes || []
      })
      
    } catch (err) {
      console.error('❌ Erro ao carregar referências:', err)
    } finally {
      setLoadingHover(false)
    }
  }

  // Limpar hover
  const limparHover = (): void => {
    setHoverAutorId(null)
    // Não limpar hoverReferencias para manter cache
  }

  const carregarAfiliacoes = async (): Promise<void> => {
    try {
      setLoadingAfiliacoes(true)
      const response = await fetch(`${API_BASE_URL}/api/admin/afiliacoes`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar afiliações')
      }
      
      const data = await response.json()
      setTodasAfiliacoes(data.afiliacoes || [])
      
    } catch (err) {
      console.error('❌ Erro ao carregar afiliações:', err)
      setTodasAfiliacoes([])
    } finally {
      setLoadingAfiliacoes(false)
    }
  }

  const handleToggleAfiliacao = useCallback((idAfiliacao: number) => {
    setFormDataAutor(prev => {
      const isSelected = prev.afiliacoes_selecionadas.includes(idAfiliacao)
      
      return {
        ...prev,
        afiliacoes_selecionadas: isSelected
          ? prev.afiliacoes_selecionadas.filter(id => id !== idAfiliacao)
          : [...prev.afiliacoes_selecionadas, idAfiliacao]
      }
    })
  }, [])

  // ==================== HANDLERS ====================
  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    
    if (activeTab === 'autores') {
      setCurrentPageAutores(1)
    } else {
      setCurrentPageReferencias(1)
    }
  }

  // Criar nova afiliação
  const handleCriarAfiliacao = async () => {
    const nome = novaAfiliacaoNome.trim()
    
    if (!nome) {
      alert('Nome da afiliação é obrigatório')
      return
    }
    
    try {
      setCriandoAfiliacao(true)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/afiliacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_afiliacao: nome,
          sigla_afiliacao: novaAfiliacaoSigla.trim() || null
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao criar afiliação')
      }
      
      const data = await response.json()
      const novaAfiliacao = data.afiliacao
      
      // Adicionar à lista
      setTodasAfiliacoes(prev => [...prev, novaAfiliacao].sort((a, b) => 
        a.nome_afiliacao.localeCompare(b.nome_afiliacao)
      ))
      
      // Selecionar automaticamente a nova afiliação
      setFormDataAutor(prev => ({
        ...prev,
        afiliacoes_selecionadas: [...prev.afiliacoes_selecionadas, novaAfiliacao.id_afiliacao]
      }))
      
      // Limpar form e fechar
      setNovaAfiliacaoNome("")
      setNovaAfiliacaoSigla("")
      setShowNovaAfiliacaoForm(false)
      
    } catch (err) {
      console.error('❌ Erro ao criar afiliação:', err)
      alert(err instanceof Error ? err.message : 'Erro ao criar afiliação')
    } finally {
      setCriandoAfiliacao(false)
    }
  }

  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPageAutores(1)
    setCurrentPageReferencias(1)
  }

  const limparFiltros = (): void => {
    if (activeTab === 'autores') {
      setSearchTermAutores("")
      setDebouncedSearchTermAutores("")
      setCurrentPageAutores(1)
      setSortBy('nome_autor')
    } else {
      setSearchTermReferencias("")
      setDebouncedSearchTermReferencias("")
      setCurrentPageReferencias(1)
      setSortBy('titulo_referencia')
    }
    setSortOrder('asc')
  }

  // ==================== MODAL FUNCTIONS ====================
  const abrirModal = useCallback(async (mode: ModalMode, item?: Autor | Referencia) => {
    if (mode === 'add') {
      return // Funcionalidade de adicionar removida
    }
    
    setModalMode(mode)
    
    if (activeTab === 'autores') {
      // Carregar afiliações se ainda não foram carregadas
      if (todasAfiliacoes.length === 0) {
        await carregarAfiliacoes()
      }
      
      setSelectedAutor(item as Autor || null)
      if (mode === 'edit' && item) {
        const autor = item as Autor
        
        // Extrair IDs das afiliações atuais
        const afiliacoesIds = autor.afiliacoes?.map(af => af.id_afiliacao) || []
        
        setFormDataAutor({
          nome_autor: autor.nome_autor,
          afiliacoes_selecionadas: afiliacoesIds
        })
      }
    } else {
      setSelectedReferencia(item as Referencia || null)
      if (mode === 'edit' && item) {
        const referencia = item as Referencia
        setFormDataReferencia({
          titulo_referencia: referencia.titulo_referencia || "",
          ano_publicacao: referencia.ano_publicacao?.toString() || "",
          link_referencia: referencia.link_referencia || ""
        })
      }
    }
    
    setShowModal(true)
  }, [activeTab, todasAfiliacoes.length])

  const fecharModal = useCallback(() => {
    setShowModal(false)
    setSelectedAutor(null)
    setSelectedReferencia(null)
    setFormDataAutor({ 
      nome_autor: "",
      afiliacoes_selecionadas: []
    })
    setFormDataReferencia({
      titulo_referencia: "",
      ano_publicacao: "",
      link_referencia: ""
    })
    setModalLoading(false)
    setShowNovaAfiliacaoForm(false)
    setNovaAfiliacaoNome("")
    setNovaAfiliacaoSigla("")
  }, [])

  // ==================== HANDLE SUBMIT ====================
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (modalMode !== 'edit') {
      return false
    }
    
    if (activeTab === 'autores') {
      if (!formDataAutor.nome_autor.trim()) {
        alert('Nome do autor é obrigatório')
        return false
      }

      try {
        setModalLoading(true)
        
        if (!selectedAutor) {
          throw new Error('Nenhum autor selecionado')
        }
        
        // 1. Atualizar nome do autor
        const responseAutor = await fetch(`${API_BASE_URL}/api/admin/autores/${selectedAutor.id_autor}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nome_autor: formDataAutor.nome_autor.trim()
          }),
        })
        
        if (!responseAutor.ok) {
          const errorData = await responseAutor.json()
          throw new Error(errorData.error || 'Erro ao atualizar autor')
        }
        
        // 2. Gerenciar afiliações
        // Afiliações atuais (antes da edição)
        const afiliacoesAtuaisIds = selectedAutor.afiliacoes?.map(af => af.id_afiliacao) || []
        
        // Afiliações para adicionar (estão selecionadas mas não estavam antes)
        const paraAdicionar = formDataAutor.afiliacoes_selecionadas.filter(
          id => !afiliacoesAtuaisIds.includes(id)
        )
        
        // Afiliações para remover (estavam antes mas não estão selecionadas)
        const paraRemover = afiliacoesAtuaisIds.filter(
          id => !formDataAutor.afiliacoes_selecionadas.includes(id)
        )
        
        // Adicionar novas afiliações
        for (const idAfiliacao of paraAdicionar) {
          const addResponse = await fetch(
            `${API_BASE_URL}/api/admin/autores/${selectedAutor.id_autor}/afiliacoes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ id_afiliacao: idAfiliacao }),
            }
          )
          
          if (!addResponse.ok) {
            console.warn(`⚠️ Erro ao adicionar afiliação ${idAfiliacao}`)
          }
        }
        
        // Remover afiliações desmarcadas
        for (const idAfiliacao of paraRemover) {
          const removeResponse = await fetch(
            `${API_BASE_URL}/api/admin/autores/${selectedAutor.id_autor}/afiliacoes/${idAfiliacao}`,
            {
              method: 'DELETE'
            }
          )
          
          if (!removeResponse.ok) {
            console.warn(`⚠️ Erro ao remover afiliação ${idAfiliacao}`)
          }
        }
        
        fecharModal()
        await carregarAutores()
        
      } catch (err) {
        console.error('❌ Erro ao atualizar autor:', err)
        alert(err instanceof Error ? err.message : 'Erro ao atualizar autor')
      } finally {
        setModalLoading(false)
      }
    } else {
      if (!formDataReferencia.titulo_referencia.trim()) {
        alert('Título da referência é obrigatório')
        return false
      }

      try {
        setModalLoading(true)
        
        if (!selectedReferencia) {
          throw new Error('Nenhuma referência selecionada')
        }
        
        const payload: any = {
          titulo_referencia: formDataReferencia.titulo_referencia.trim()
        }
        
        if (formDataReferencia.link_referencia.trim()) {
          payload.link_referencia = formDataReferencia.link_referencia.trim()
        }
        
        if (formDataReferencia.ano_publicacao.trim()) {
          payload.ano_publicacao = formDataReferencia.ano_publicacao.trim()
        }
        
        const response = await fetch(`${API_BASE_URL}/api/admin/referencias/${selectedReferencia.id_referencia}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao atualizar referência')
        }
        
        fecharModal()
        await carregarReferencias()
        
      } catch (err) {
        console.error('❌ Erro ao atualizar referência:', err)
        alert(err instanceof Error ? err.message : 'Erro ao atualizar referência')
      } finally {
        setModalLoading(false)
      }
    }
  }, [activeTab, formDataAutor, formDataReferencia, modalMode, selectedAutor, selectedReferencia, fecharModal])

  // ==================== INPUT CHANGE HANDLERS ====================
  const handleInputChangeAutor = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormDataAutor(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }, [])

  const handleInputChangeReferencia = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormDataReferencia(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }, [])

  // ==================== DELETE FUNCTIONS ====================
  const handleDelete = async (id: number): Promise<void> => {
    try {
      if (activeTab === 'autores') {
        const checkResponse = await fetch(`${API_BASE_URL}/api/admin/autores/${id}`)
        
        if (!checkResponse.ok) {
          throw new Error('Erro ao verificar autor')
        }
        
        const autorData = await checkResponse.json()
        
        const totalRelacionados = (autorData.total_referencias || 0)
        
        if (totalRelacionados > 0) {
          setConfirmModalData({
            type: 'warning',
            title: 'Não é possível excluir este autor',
            message: `O autor "${autorData.nome_autor}" tem ${totalRelacionados} referência(s) associada(s).`,
            itemName: autorData.nome_autor,
            totalRelacionados: totalRelacionados
          })
          setShowConfirmModal(true)
          return
        }
        
        setConfirmModalData({
          type: 'delete',
          title: 'Confirmar exclusão',
          message: `Tem certeza que deseja excluir o autor "${autorData.nome_autor}"?`,
          itemId: id,
          itemName: autorData.nome_autor
        })
        setShowConfirmModal(true)
      } else {
        const checkResponse = await fetch(`${API_BASE_URL}/api/admin/referencias/${id}`)
        
        if (!checkResponse.ok) {
          throw new Error('Erro ao verificar referência')
        }
        
        const referenciaData = await checkResponse.json()
        
        if (referenciaData.total_plantas && referenciaData.total_plantas > 0) {
          setConfirmModalData({
            type: 'warning',
            title: 'Não é possível excluir esta referência',
            message: `A referência "${referenciaData.titulo_referencia}" tem ${referenciaData.total_plantas} planta(s) associada(s).`,
            itemName: referenciaData.titulo_referencia,
            totalRelacionados: referenciaData.total_plantas
          })
          setShowConfirmModal(true)
          return
        }
        
        setConfirmModalData({
          type: 'delete',
          title: 'Confirmar exclusão',
          message: `Tem certeza que deseja excluir a referência "${referenciaData.titulo_referencia}"?`,
          itemId: id,
          itemName: referenciaData.titulo_referencia
        })
        setShowConfirmModal(true)
      }
    } catch (err) {
      console.error('❌ Erro ao verificar item:', err)
      alert(err instanceof Error ? err.message : 'Erro ao verificar item')
    }
  }

  const confirmarExclusao = useCallback(async () => {
    if (!confirmModalData?.itemId) return
    
    try {
      const endpoint = activeTab === 'autores' ? 'autores' : 'referencias'
      const response = await fetch(`${API_BASE_URL}/api/admin/${endpoint}/${confirmModalData.itemId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Erro ao excluir ${activeTab.slice(0, -1)}`)
      }
      
      setShowConfirmModal(false)
      setConfirmModalData(null)
      
      if (activeTab === 'autores') {
        await carregarAutores()
      } else {
        await carregarReferencias()
      }
      
    } catch (err) {
      console.error(`❌ Erro ao excluir ${activeTab.slice(0, -1)}:`, err)
      alert(err instanceof Error ? err.message : `Erro ao excluir ${activeTab.slice(0, -1)}`)
    }
  }, [confirmModalData?.itemId, activeTab])

  const fecharConfirmModal = useCallback(() => {
    setShowConfirmModal(false)
    setConfirmModalData(null)
  }, [])

  // ==================== PAGINATION ====================
  const renderPaginationNumbers = () => {
    const totalPages = activeTab === 'autores' ? totalPagesAutores : totalPagesReferencias
    const currentPage = activeTab === 'autores' ? currentPageAutores : currentPageReferencias
    const setCurrentPage = activeTab === 'autores' ? setCurrentPageAutores : setCurrentPageReferencias
    
    const pages = []
    const maxVisiblePages = 5
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => setCurrentPage(1)}
          className={styles.paginationNavButton}
        >
          1
        </button>
      )
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className={styles.paginationEllipsis}>...</span>)
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={i === currentPage ? styles.paginationNavButtonCurrent : styles.paginationNavButton}
        >
          {i}
        </button>
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className={styles.paginationEllipsis}>...</span>)
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => setCurrentPage(totalPages)}
          className={styles.paginationNavButton}
        >
          {totalPages}
        </button>
      )
    }

    return pages
  }

  // ==================== COMPUTED VALUES ====================
  const currentData = activeTab === 'autores' ? autores : referencias
  const currentTotal = activeTab === 'autores' ? totalAutores : totalReferencias
  const currentPage = activeTab === 'autores' ? currentPageAutores : currentPageReferencias
  const currentTotalPages = activeTab === 'autores' ? totalPagesAutores : totalPagesReferencias
  const currentSearchTerm = activeTab === 'autores' ? searchTermAutores : searchTermReferencias
  const currentDebouncedSearchTerm = activeTab === 'autores' ? debouncedSearchTermAutores : debouncedSearchTermReferencias
  const isSearching = currentSearchTerm !== currentDebouncedSearchTerm && currentSearchTerm.length > 0

  // ==================== RENDER STATES ====================
  if (loading && currentData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Autores e Referências</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Carregando dados da base de dados...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Autores e Referências</h1>
        </div>
        <div className={styles.errorMessage}>
          <h3>Erro ao conectar com a API</h3>
          <p>{error}</p>
          <button onClick={() => activeTab === 'autores' ? carregarAutores() : carregarReferencias()}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Gerir Autores e Referências</h1>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <nav className={styles.tabsNav}>
          <button
            onClick={() => setActiveTab('autores')}
            className={`${styles.tabButton} ${activeTab === 'autores' ? styles.active : styles.inactive}`}
          >
            Autores ({totalAutores})
          </button>
          <button
            onClick={() => setActiveTab('referencias')}
            className={`${styles.tabButton} ${activeTab === 'referencias' ? styles.active : styles.inactive}`}
          >
            Referências ({totalReferencias})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              Buscar {activeTab === 'autores' ? 'Autores' : 'Referências'}
              {isSearching && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: '#059669',
                  fontWeight: 'normal',
                  marginLeft: '0.5rem'
                }}>
                  (a pesquisar...)
                </span>
              )}
            </label>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                id="search"
                name="search"
                placeholder={activeTab === 'autores' ? "Buscar autores por nome..." : "Buscar referências por título ou link..."}
                value={currentSearchTerm}
                onChange={(e) => activeTab === 'autores' ? setSearchTermAutores(e.target.value) : setSearchTermReferencias(e.target.value)}
                className={styles.input}
                autoComplete="off"
                style={isSearching ? { 
                  borderColor: '#059669',
                  boxShadow: '0 0 0 1px #059669'
                } : {}}
              />
              <div className={styles.searchIcon}>
                {isSearching ? (
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid #f3f3f3',
                    borderTop: '2px solid #059669',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}></div>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                )}
              </div>
            </div>
            {currentSearchTerm.length > 0 && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280', 
                marginTop: '0.25rem',
                fontStyle: 'italic'
              }}>
                💡 A pesquisa será executada automaticamente após parar de digitar
              </div>
            )}
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="pageSize" className={styles.filterLabel}>
              Itens por página
            </label>
            <select
              id="pageSize"
              value={itemsPerPage}
              onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>

          <div className={styles.filterActions}>
            <button 
              type="button" 
              onClick={limparFiltros} 
              className={styles.clearButton}
            >
              <svg className={styles.icon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Results info */}
      <div className={styles.resultsInfo}>
        <span>
          {currentTotal > 0 ? (
            <>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, currentTotal)} de {currentTotal} {activeTab}
              {currentDebouncedSearchTerm && ` (filtrados)`}
              {isSearching && (
                <span style={{ color: '#059669', fontWeight: '500', marginLeft: '0.5rem' }}>
                  - actualizando...
                </span>
              )}
            </>
          ) : (
            `Nenhum ${activeTab.slice(0, -1)} encontrado`
          )}
        </span>
        <span>Página {currentPage} de {currentTotalPages}</span>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                {activeTab === 'autores' ? (
                  <>
                    <th className={styles.tableHeaderCell}>
                      Nome do Autor
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Afiliações
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Plantas
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Referências
                    </th>
                  </>
                ) : (
                  <>
                    <th className={styles.tableHeaderCell}>
                      Título
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Tipo
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Ano
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Link
                    </th>
                  </>
                )}
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={activeTab === 'autores' ? 5 : 5} className={styles.emptyMessage}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div className={styles.loadingSpinner}></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'autores' ? 5 : 5} className={styles.emptyMessage}>
                    {currentDebouncedSearchTerm ? (
                      <div className={styles.emptyContent}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <h3 className={styles.emptyTitle}>
                          Nenhum {activeTab.slice(0, -1)} encontrado
                        </h3>
                        <p className={styles.emptyDescription}>
                          Não encontramos {activeTab} que correspondam a "{currentDebouncedSearchTerm}".
                          <br />
                          Tente ajustar sua busca.
                        </p>
                        <button 
                          onClick={limparFiltros}
                          className={styles.addButton}
                          style={{ marginTop: 0 }}
                        >
                          Ver Lista Completa
                        </button>
                      </div>
                    ) : (
                      <div className={styles.emptyContent}>
                        <div className={styles.emptyIcon}>📚</div>
                        <h3 className={styles.emptyTitle}>
                          Nenhum {activeTab.slice(0, -1)} cadastrado
                        </h3>
                        <p className={styles.emptyDescription}>
                          A base de dados está vazia.
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                currentData.map((item) => (
                  <tr 
                    key={activeTab === 'autores' ? (item as Autor).id_autor : (item as Referencia).id_referencia} 
                    className={styles.tableRow}
                    data-autor-id={activeTab === 'autores' ? (item as Autor).id_autor : undefined}
                    data-referencia-id={activeTab === 'referencias' ? (item as Referencia).id_referencia : undefined}
                  >
                    {activeTab === 'autores' ? (
                      <>
                        <td className={styles.tableCellMain}>
                          <div className={styles.cellTitle}>
                            {(item as Autor).nome_autor}
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          {/* ✅ MOSTRAR PRIMEIRA AFILIAÇÃO + CONTADOR */}
                          {(item as Autor).afiliacoes && (item as Autor).afiliacoes!.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <span className={styles.afiliacaoTag}>
                                {(item as Autor).afiliacoes![0].nome_afiliacao}
                                {(item as Autor).afiliacoes![0].sigla_afiliacao && 
                                  ` (${(item as Autor).afiliacoes![0].sigla_afiliacao})`
                                }
                              </span>
                              {(item as Autor).afiliacoes!.length > 1 && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: '#002856',
                                  backgroundColor: '#eba900',
                                  padding: '0.125rem 0.5rem',
                                  borderRadius: '9999px',
                                  whiteSpace: 'nowrap'
                                }}>
                                  +{(item as Autor).afiliacoes!.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className={styles.textMuted}>Sem afiliação</span>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Autor).total_plantas || 0}
                        </td>
                        <td className={styles.tableCell}>
                        <td className={styles.tableCell}>
                          <div 
                            style={{ position: 'relative', display: 'inline-block' }}
                            onMouseEnter={() => {
                              setHoverAutorId((item as Autor).id_autor)
                              carregarReferenciasAutor((item as Autor).id_autor)
                            }}
                            onMouseLeave={limparHover}
                          >
                            <span style={{ 
                              cursor: 'pointer',
                              fontWeight: '500',
                              color: (item as Autor).total_referencias ? '#002856' : 'inherit',
                              borderBottom: (item as Autor).total_referencias ? '1px dashed #002856' : 'none'
                            }}>
                              {(item as Autor).total_referencias || 0}
                            </span>
                            
                            {/* TOOLTIP COM REFERÊNCIAS - CORES DO SITE */}
                            {hoverAutorId === (item as Autor).id_autor && (item as Autor).total_referencias! > 0 && (
                              <div style={{
                                position: 'fixed',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'white',
                                border: '2px solid #002856',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                boxShadow: '0 20px 25px -5px rgba(0, 40, 86, 0.3), 0 10px 10px -5px rgba(0, 40, 86, 0.2)',
                                zIndex: 9999,
                                minWidth: '350px',
                                maxWidth: '500px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                              }}>
                                <div style={{
                                  fontSize: '0.875rem',
                                  fontWeight: '700',
                                  color: '#002856',
                                  marginBottom: '0.75rem',
                                  paddingBottom: '0.5rem',
                                  borderBottom: '2px solid #eba900',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  📚 Referências de {(item as Autor).nome_autor}
                                </div>
                                
                                {loadingHover ? (
                                  <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    padding: '2rem',
                                    gap: '0.5rem'
                                  }}>
                                    <div className={styles.loadingSpinner} style={{ 
                                      width: '20px', 
                                      height: '20px',
                                      borderWidth: '2px',
                                      borderTopColor: '#002856'
                                    }}></div>
                                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                      A carregar referências...
                                    </span>
                                  </div>
                                ) : hoverReferencias && hoverReferencias.referencias.length > 0 ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {hoverReferencias.referencias.slice(0, 10).map((ref, idx) => (
                                      <div 
                                        key={ref.id_referencia}
                                        style={{
                                          padding: '0.75rem',
                                          backgroundColor: '#f8fafc',
                                          border: '1px solid #e5e7eb',
                                          borderRadius: '0.375rem',
                                          fontSize: '0.875rem',
                                          transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#fff7ed'
                                          e.currentTarget.style.borderColor = '#eba900'
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#f8fafc'
                                          e.currentTarget.style.borderColor = '#e5e7eb'
                                        }}
                                      >
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'flex-start',
                                          gap: '0.5rem'
                                        }}>
                                          <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: '700',
                                            color: '#002856',
                                            backgroundColor: '#eba900',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: '0.25rem',
                                            flexShrink: 0
                                          }}>
                                            {idx + 1}
                                          </span>
                                          <div style={{ flex: 1 }}>
                                            <div style={{ 
                                              fontWeight: '500',
                                              color: '#002856',
                                              marginBottom: '0.25rem',
                                              lineHeight: '1.4'
                                            }}>
                                              {ref.titulo_referencia}
                                            </div>
                                            {ref.ano_publicacao && (
                                              <div style={{ 
                                                fontSize: '0.75rem',
                                                color: '#6b7280',
                                                fontWeight: '500'
                                              }}>
                                                📅 {ref.ano_publicacao}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                    {hoverReferencias.referencias.length > 10 && (
                                      <div style={{
                                        fontSize: '0.75rem',
                                        color: '#002856',
                                        textAlign: 'center',
                                        marginTop: '0.25rem',
                                        fontWeight: '600',
                                        padding: '0.5rem',
                                        backgroundColor: '#fff7ed',
                                        borderRadius: '0.375rem',
                                        border: '1px solid #eba900'
                                      }}>
                                        + {hoverReferencias.referencias.length - 10} referências adicionais
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{
                                    fontSize: '0.875rem',
                                    color: '#6b7280',
                                    textAlign: 'center',
                                    padding: '2rem'
                                  }}>
                                    Nenhuma referência encontrada
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={styles.tableCellMain}>
                          <div className={styles.cellTitle}>
                            {(item as Referencia).titulo_referencia}
                          </div>
                          {(item as Referencia).total_plantas && (item as Referencia).total_plantas! > 0 && (
                            <div className={styles.cellSubtitle}>
                              {(item as Referencia).total_plantas} plantas associadas
                            </div>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.badge}>
                            {(item as Referencia).tipo_referencia || 'Outro'}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Referencia).ano_publicacao || 'N/A'}
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Referencia).link_referencia ? (
                            <a 
                              href={(item as Referencia).link_referencia} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={styles.cellLink}
                            >
                              {(item as Referencia).link_referencia.length > 50 
                                ? `${(item as Referencia).link_referencia.substring(0, 50)}...` 
                                : (item as Referencia).link_referencia
                              }
                            </a>
                          ) : (
                            <span className={styles.textMuted}>Sem link</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => abrirModal('view', item)}
                          className={styles.viewButton}
                          title="Ver detalhes"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => abrirModal('edit', item)}
                          className={styles.editButton}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(activeTab === 'autores' ? (item as Autor).id_autor : (item as Referencia).id_referencia)}
                          className={styles.deleteButton}
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && currentData.length > 0 && currentTotalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationMobile}>
            <button 
              onClick={() => activeTab === 'autores' 
                ? setCurrentPageAutores(Math.max(1, currentPageAutores - 1))
                : setCurrentPageReferencias(Math.max(1, currentPageReferencias - 1))
              }
              disabled={currentPage === 1}
              className={styles.paginationButton}
            >
              Anterior
            </button>
            <span className={styles.paginationPageInfo}>
              {currentPage} / {currentTotalPages}
            </span>
            <button 
              onClick={() => activeTab === 'autores' 
                ? setCurrentPageAutores(Math.min(currentTotalPages, currentPageAutores + 1))
                : setCurrentPageReferencias(Math.min(currentTotalPages, currentPageReferencias + 1))
              }
              disabled={currentPage === currentTotalPages}
              className={styles.paginationButton}
            >
              Próximo
            </button>
          </div>

          <div className={styles.paginationDesktop}>
            <div>
              <p className={styles.paginationText}>
                Mostrando <span className={styles.paginationBold}>{((currentPage - 1) * itemsPerPage) + 1}</span> a{" "}
                <span className={styles.paginationBold}>{Math.min(currentPage * itemsPerPage, currentTotal)}</span> de{" "}
                <span className={styles.paginationBold}>{currentTotal}</span> resultados
              </p>
            </div>
            <div>
              <nav className={styles.paginationNav} aria-label="Pagination">
                <button 
                  onClick={() => activeTab === 'autores' 
                    ? setCurrentPageAutores(Math.max(1, currentPageAutores - 1))
                    : setCurrentPageReferencias(Math.max(1, currentPageReferencias - 1))
                  }
                  disabled={currentPage === 1}
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonLeft}`}
                  title="Página anterior"
                >
                  <span className={styles.srOnly}>Anterior</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                
                {renderPaginationNumbers()}
                
                <button 
                  onClick={() => activeTab === 'autores' 
                    ? setCurrentPageAutores(Math.min(currentTotalPages, currentPageAutores + 1))
                    : setCurrentPageReferencias(Math.min(currentTotalPages, currentPageReferencias + 1))
                  }
                  disabled={currentPage === currentTotalPages}
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonRight}`}
                  title="Próxima página"
                >
                  <span className={styles.srOnly}>Próximo</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeTab === 'autores' ? (
        <ModalGestaoAutor
          showModal={showModal}
          modalMode={modalMode}
          modalLoading={modalLoading}
          selectedItem={selectedAutor}
          formData={formDataAutor}
          todasAfiliacoes={todasAfiliacoes}
          loadingAfiliacoes={loadingAfiliacoes}
          showNovaAfiliacaoForm={showNovaAfiliacaoForm}
          novaAfiliacaoNome={novaAfiliacaoNome}
          novaAfiliacaoSigla={novaAfiliacaoSigla}
          criandoAfiliacao={criandoAfiliacao}
          onFechar={fecharModal}
          onSubmit={handleSubmit}
          onInputChange={handleInputChangeAutor}
          onToggleAfiliacao={handleToggleAfiliacao}
          onToggleNovaAfiliacaoForm={() => setShowNovaAfiliacaoForm(!showNovaAfiliacaoForm)}
          onChangeNovaAfiliacaoNome={setNovaAfiliacaoNome}
          onChangeNovaAfiliacaoSigla={setNovaAfiliacaoSigla}
          onCriarAfiliacao={handleCriarAfiliacao}
        />
      ) : (
        <ModalGestaoReferencia
          showModal={showModal}
          modalMode={modalMode}
          modalLoading={modalLoading}
          selectedItem={selectedReferencia}
          formData={formDataReferencia}
          onFechar={fecharModal}
          onSubmit={handleSubmit}
          onInputChange={handleInputChangeReferencia}
        />
      )}

      <ModalConfirmacao
        showConfirmModal={showConfirmModal}
        confirmModalData={confirmModalData}
        onConfirmar={confirmarExclusao}
        onFechar={fecharConfirmModal}
      />
    </div>
  )
}

// Set display names for debugging
ModalConfirmacao.displayName = 'ModalConfirmacao'
ModalGestaoAutor.displayName = 'ModalGestaoAutor'
ModalGestaoReferencia.displayName = 'ModalGestaoReferencia'