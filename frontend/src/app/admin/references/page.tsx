"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import styles from "./references.module.css"

// Tipos para a estrutura de dados
interface Autor {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
  total_plantas?: number
  total_referencias?: number
}

interface Referencia {
  id_referencia: number
  titulo_referencia?: string
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
  ano?: string
  link_referencia: string
  total_plantas?: number
  autores_especificos?: AutorReferencia[]
}

interface AutorReferencia {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
  ordem_autor: number
  papel: 'primeiro' | 'correspondente' | 'coautor'
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
type SortField = 'nome_autor' | 'total_plantas' | 'total_referencias' | 'titulo_referencia' | 'ano' | 'tipo_referencia'
type SortOrder = 'asc' | 'desc'
type ModalMode = 'add' | 'edit' | 'view'

interface FormDataAutor {
  nome_autor: string
  afiliacao: string
  sigla_afiliacao: string
}

interface FormDataReferencia {
  titulo_referencia: string
  tipo_referencia: 'URL' | 'Artigo' | 'Livro' | 'Tese' | ''
  ano: string
  link_referencia: string
  autores: AutorReferencia[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// ✅ MODAL DE CONFIRMAÇÃO
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

// ✅ MODAL DE GESTÃO PARA AUTORES
interface ModalGestaoAutorProps {
  showModal: boolean
  modalMode: ModalMode
  modalLoading: boolean
  selectedItem: Autor | null
  formData: FormDataAutor
  onFechar: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

const ModalGestaoAutor = memo<ModalGestaoAutorProps>(({ 
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
                    <div className={styles.infoItem}>
                      <label>Afiliação:</label>
                      <span>{selectedItem.afiliacao || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Sigla:</label>
                      <span>{selectedItem.sigla_afiliacao || 'Não informado'}</span>
                    </div>
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
                      maxLength={150}
                      disabled={modalLoading}
                      autoComplete="off"
                      autoFocus={modalMode !== 'view'}
                    />
                    <p className={styles.formHint}>
                      Nome completo do autor (máximo 150 caracteres)
                    </p>
                    <div className={`${styles.characterCount} ${(formData.nome_autor?.length || 0) > 135 ? styles.characterCountWarning : styles.characterCountNormal}`}>
                      {formData.nome_autor?.length || 0}/150 caracteres
                    </div>
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="afiliacao" className={styles.formLabel}>
                      Afiliação
                    </label>
                    <input
                      type="text"
                      id="afiliacao"
                      name="afiliacao"
                      value={formData.afiliacao}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: Universidade Eduardo Mondlane..."
                      maxLength={150}
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                    <p className={styles.formHint}>
                      Instituição de afiliação do autor (opcional)
                    </p>
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="sigla_afiliacao" className={styles.formLabel}>
                      Sigla da Afiliação
                    </label>
                    <input
                      type="text"
                      id="sigla_afiliacao"
                      name="sigla_afiliacao"
                      value={formData.sigla_afiliacao}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: UEM, INS..."
                      maxLength={50}
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                    <p className={styles.formHint}>
                      Sigla ou abreviação da instituição (opcional)
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

// ✅ MODAL DE GESTÃO PARA REFERÊNCIAS
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
                      <span>{selectedItem.tipo_referencia || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Ano:</label>
                      <span>{selectedItem.ano || 'Não informado'}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <label>Total de Plantas:</label>
                      <span>{selectedItem.total_plantas || 0} plantas</span>
                    </div>
                  </div>
                  
                  <div className={styles.infoItem}>
                    <label>Título:</label>
                    <p><strong>{selectedItem.titulo_referencia || 'Sem título'}</strong></p>
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
                        {selectedItem.autores_especificos.map((autor, index) => (
                          <div key={autor.id_autor} className={styles.autorCard}>
                            <div className={styles.autorCardHeader}>
                              <div className={styles.autorCardInfo}>
                                <p className={styles.autorName}>{autor.nome_autor}</p>
                                {autor.afiliacao && (
                                  <p className={styles.autorAffiliation}>{autor.afiliacao}</p>
                                )}
                              </div>
                              <div className={styles.autorCardMeta}>
                                <p>Ordem: {autor.ordem_autor}</p>
                                <p>Papel: {autor.papel}</p>
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
                  <div className={styles.formItem}>
                    <label htmlFor="tipo_referencia" className={styles.formLabel}>
                      Tipo de Referência
                    </label>
                    <select
                      id="tipo_referencia"
                      name="tipo_referencia"
                      value={formData.tipo_referencia}
                      onChange={onInputChange}
                      className={styles.formSelect}
                      disabled={modalLoading}
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="URL">URL</option>
                      <option value="Artigo">Artigo</option>
                      <option value="Livro">Livro</option>
                      <option value="Tese">Tese</option>
                    </select>
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="ano" className={styles.formLabel}>
                      Ano
                    </label>
                    <input
                      type="text"
                      id="ano"
                      name="ano"
                      value={formData.ano}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: 2023, 2024..."
                      maxLength={4}
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                  </div>

                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <label htmlFor="titulo_referencia" className={styles.formLabel}>
                      Título da Referência
                    </label>
                    <input
                      type="text"
                      id="titulo_referencia"
                      name="titulo_referencia"
                      value={formData.titulo_referencia}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: Plantas Medicinais de Moçambique..."
                      disabled={modalLoading}
                      autoComplete="off"
                    />
                    <p className={styles.formHint}>
                      Título completo da obra ou publicação
                    </p>
                  </div>

                  <div className={`${styles.formItem} ${styles.formGridFull}`}>
                    <label htmlFor="link_referencia" className={styles.formLabel}>
                      Link/URL da Referência *
                    </label>
                    <input
                      type="url"
                      id="link_referencia"
                      name="link_referencia"
                      value={formData.link_referencia}
                      onChange={onInputChange}
                      className={styles.formInput}
                      placeholder="Ex: https://exemplo.com/artigo..."
                      disabled={modalLoading}
                      autoComplete="off"
                      autoFocus={modalMode !== 'view'}
                    />
                    <p className={styles.formHint}>
                      URL completa da referência (obrigatório)
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
                  disabled={modalLoading || !formData.link_referencia.trim()}
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

// ✅ COMPONENTE PRINCIPAL
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

  // Estados para formulários
  const [formDataAutor, setFormDataAutor] = useState<FormDataAutor>({
    nome_autor: "",
    afiliacao: "",
    sigla_afiliacao: ""
  })

  const [formDataReferencia, setFormDataReferencia] = useState<FormDataReferencia>({
    titulo_referencia: "",
    tipo_referencia: "",
    ano: "",
    link_referencia: "",
    autores: []
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

  // ✅ DEBOUNCE HOOKS
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermAutores(searchTermAutores)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTermAutores])

  // REMOVER o useEffect anterior e usar este:
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const tabParam = urlParams.get('tab')
    
    console.log('🔍 Parâmetro tab detectado:', tabParam)
    
    if (tabParam === 'autores') {
      console.log('✅ Mudando para aba autores')
      setActiveTab('autores')
    } else if (tabParam === 'referencias') {
      console.log('✅ Mudando para aba referencias')
      setActiveTab('referencias')
    }
    
    // Limpar URL após definir a aba
    if (tabParam) {
      setTimeout(() => {
        window.history.replaceState({}, document.title, window.location.pathname)
      }, 100)
    }
  }, []) // Executar apenas uma vez ao montar o componente

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTermReferencias(searchTermReferencias)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTermReferencias])

  // ✅ HIGHLIGHT FUNCTION
  const showHighlightIndicator = (element: Element, tipo: string) => {
    const indicator = document.createElement('div')
    indicator.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #9333ea, #7e22ce);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(147, 51, 234, 0.25);
        z-index: 10000;
        font-weight: 600;
        font-size: 14px;
        animation: slideInRight 0.3s ease-out;
        border: 2px solid #a855f7;
      ">
        ✨ ${tipo === 'autor' ? 'Autor' : 'Referência'} encontrada!
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          📍 Item destacado abaixo
        </div>
      </div>
    `
    
    document.body.appendChild(indicator)
    
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'slideOutRight 0.3s ease-in'
        setTimeout(() => {
          document.body.removeChild(indicator)
        }, 300)
      }
    }, 4000)
    
    const arrow = document.createElement('div')
    const rect = element.getBoundingClientRect()
    arrow.innerHTML = `
      <div style="
        position: fixed;
        left: ${rect.left - 30}px;
        top: ${rect.top + rect.height/2 - 10}px;
        font-size: 20px;
        color: #9333ea;
        z-index: 9999;
        animation: pulse 1s infinite;
      ">
        👉
      </div>
    `
    
    document.body.appendChild(arrow)
    
    setTimeout(() => {
      if (arrow.parentNode) {
        document.body.removeChild(arrow)
      }
    }, 3000)
  }

  // ✅ NOVO: useEffect para processar highlights de autores vindos do header
  useEffect(() => {
    const processUrlParams = async () => {
      // ✅ DELAY INICIAL para garantir carregamento
      await new Promise(resolve => setTimeout(resolve, 200))
    
      const urlParams = new URLSearchParams(window.location.search)
      const highlightId = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearch = urlParams.get('search')
      const highlightType = urlParams.get('type') // 'autor' ou 'referencia'
      const timestamp = urlParams.get('t')
    
      console.log('🔍 Processando parâmetros da URL (autores/referências):', {
        highlight: highlightId,
        type: highlightType,
        page: pageParam,
        search: urlSearch,
        timestamp: timestamp
      })
    
      // ✅ DEFINIR ABA ATIVA baseada no tipo
      const tabParam = urlParams.get('tab')
      if (tabParam === 'autores') {
        setActiveTab('autores')
        console.log('🎯 Definindo aba ativa via parâmetro: autores')
      } else if (tabParam === 'referencias') {
        setActiveTab('referencias')
        console.log('🎯 Definindo aba ativa via parâmetro: referências')
      } else if (highlightType === 'autor') {
        setActiveTab('autores')
        console.log('🎯 Definindo aba ativa: autores')
      } else if (highlightType === 'referencia') {
        setActiveTab('referencias')
        console.log('🎯 Definindo aba ativa: referências')
      }
    
      // ✅ APLICAR FILTRO DE BUSCA
      if (urlSearch) {
        const decodedSearch = decodeURIComponent(urlSearch)
        console.log('🔍 Aplicando busca decodificada:', decodedSearch)
      
        if (highlightType === 'autor') {
          setSearchTermAutores(decodedSearch)
          setDebouncedSearchTermAutores(decodedSearch)
          console.log('✅ Busca aplicada na aba de autores')
        } else {
          setSearchTermReferencias(decodedSearch)
          setDebouncedSearchTermReferencias(decodedSearch)
          console.log('✅ Busca aplicada na aba de referências')
        }
      }
    
      // ✅ APLICAR PÁGINA
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log('📄 Aplicando página:', pageNumber)
        
          if (highlightType === 'autor') {
            setCurrentPageAutores(pageNumber)
          } else {
            setCurrentPageReferencias(pageNumber)
          }
        }
      }
    
      // ✅ CONFIGURAR HIGHLIGHT
      if (highlightId && highlightType) {
        const dataAttribute = highlightType === 'autor' ? 'data-autor-id' : 'data-referencia-id'
      
        console.log('🎯 Configurando highlight:', { highlightId, highlightType, dataAttribute })
      
        setTimeout(() => {
          const element = document.querySelector(`[${dataAttribute}="${highlightId}"]`)
          if (element) {
            console.log('✅ Elemento encontrado para highlight')
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
          
            // ✅ INDICADOR VISUAL usando a função existente
            if (typeof showHighlightIndicator === 'function') {
              showHighlightIndicator(element, highlightType)
            }
          
            setTimeout(() => {
              element.classList.remove('highlighted')
            }, 5000)
          } else {
            console.log('⚠️ Elemento não encontrado para highlight:', `[${dataAttribute}="${highlightId}"]`)
          }
        }, 4000)
      }
    
      // ✅ LIMPAR URL
      if (highlightId || pageParam || urlSearch || highlightType) {
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
  
    processUrlParams()
  }, [])
  
  // ✅ EFFECT: Load data based on active tab
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
    debouncedSearchTermReferencias,
    sortBy,
    sortOrder
  ])

  // ✅ EFFECT: Reset page when search changes
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

  // ✅ FUNCTION: Load authors
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
      
      let autoresOrdenados = data.autores || []
      
      if (sortBy && autoresOrdenados.length > 0) {
        autoresOrdenados = [...autoresOrdenados].sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''
          
          switch (sortBy) {
            case 'nome_autor':
              aValue = a.nome_autor || ''
              bValue = b.nome_autor || ''
              break
            case 'total_plantas':
              aValue = a.total_plantas || 0
              bValue = b.total_plantas || 0
              break
            case 'total_referencias':
              aValue = a.total_referencias || 0
              bValue = b.total_referencias || 0
              break
            default:
              aValue = ''
              bValue = ''
          }
          
          if (sortOrder === 'asc') {
            if (typeof aValue === 'string') {
              return aValue.localeCompare(bValue as string, 'pt', { numeric: true })
            }
            return (aValue as number) - (bValue as number)
          } else {
            if (typeof aValue === 'string') {
              return (bValue as string).localeCompare(aValue, 'pt', { numeric: true })
            }
            return (bValue as number) - (aValue as number)
          }
        })
      }
      
      setAutores(autoresOrdenados)
      setTotalAutores(data.total || 0)
      setTotalPagesAutores(Math.ceil((data.total || 0) / itemsPerPage))
      
    } catch (err) {
      console.error('❌ Erro ao carregar autores:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar autores: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FUNCTION: Load references  
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
      
      let referenciasOrdenadas = data.referencias || []
      
      if (sortBy && referenciasOrdenadas.length > 0) {
        referenciasOrdenadas = [...referenciasOrdenadas].sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''
          
          switch (sortBy) {
            case 'titulo_referencia':
              aValue = a.titulo_referencia || ''
              bValue = b.titulo_referencia || ''
              break
            case 'ano':
              aValue = parseInt(a.ano || '0') || 0
              bValue = parseInt(b.ano || '0') || 0
              break
            case 'tipo_referencia':
              aValue = a.tipo_referencia || ''
              bValue = b.tipo_referencia || ''
              break
            default:
              aValue = ''
              bValue = ''
          }
          
          if (sortOrder === 'asc') {
            if (typeof aValue === 'string') {
              return aValue.localeCompare(bValue as string, 'pt', { numeric: true })
            }
            return (aValue as number) - (bValue as number)
          } else {
            if (typeof aValue === 'string') {
              return (bValue as string).localeCompare(aValue, 'pt', { numeric: true })
            }
            return (bValue as number) - (aValue as number)
          }
        })
      }
      
      setReferencias(referenciasOrdenadas)
      setTotalReferencias(data.total || 0)
      setTotalPagesReferencias(Math.ceil((data.total || 0) / itemsPerPage))
      
    } catch (err) {
      console.error('❌ Erro ao carregar referências:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar referências: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ FUNCTION: Handle sort
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

  // ✅ FUNCTION: Handle page size change
  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPageAutores(1)
    setCurrentPageReferencias(1)
  }

  // ✅ FUNCTION: Clear filters
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

  // ✅ MODAL FUNCTIONS
  const abrirModal = useCallback((mode: ModalMode, item?: Autor | Referencia) => {
    // Remover funcionalidade de adicionar - apenas view e edit
    if (mode === 'add') {
      return
    }
    
    setModalMode(mode)
    
    if (activeTab === 'autores') {
      setSelectedAutor(item as Autor || null)
      if (mode === 'edit' && item) {
        const autor = item as Autor
        setFormDataAutor({
          nome_autor: autor.nome_autor,
          afiliacao: autor.afiliacao || "",
          sigla_afiliacao: autor.sigla_afiliacao || ""
        })
      }
    } else {
      setSelectedReferencia(item as Referencia || null)
      if (mode === 'edit' && item) {
        const referencia = item as Referencia
        setFormDataReferencia({
          titulo_referencia: referencia.titulo_referencia || "",
          tipo_referencia: referencia.tipo_referencia || "",
          ano: referencia.ano || "",
          link_referencia: referencia.link_referencia,
          autores: referencia.autores_especificos || []
        })
      }
    }
    
    setShowModal(true)
  }, [activeTab])

  const fecharModal = useCallback(() => {
    setShowModal(false)
    setSelectedAutor(null)
    setSelectedReferencia(null)
    setFormDataAutor({ nome_autor: "", afiliacao: "", sigla_afiliacao: "" })
    setFormDataReferencia({
      titulo_referencia: "",
      tipo_referencia: "",
      ano: "",
      link_referencia: "",
      autores: []
    })
    setModalLoading(false)
  }, [])

  // ✅ HANDLE SUBMIT
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Apenas permitir edição, não criação
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
        
        const url = selectedAutor 
          ? `${API_BASE_URL}/api/admin/autores/${selectedAutor.id_autor}`
          : `${API_BASE_URL}/api/admin/autores`
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataAutor),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao salvar autor')
        }
        
        fecharModal()
        await carregarAutores()
        
      } catch (err) {
        console.error('❌ Erro ao salvar autor:', err)
        alert(err instanceof Error ? err.message : 'Erro ao salvar autor')
      } finally {
        setModalLoading(false)
      }
    } else {
      if (!formDataReferencia.link_referencia.trim()) {
        alert('Link da referência é obrigatório')
        return false
      }

      try {
        setModalLoading(true)
        
        const url = selectedReferencia 
          ? `${API_BASE_URL}/api/admin/referencias/${selectedReferencia.id_referencia}`
          : `${API_BASE_URL}/api/admin/referencias`
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataReferencia),
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Erro ao salvar referência')
        }
        
        fecharModal()
        await carregarReferencias()
        
      } catch (err) {
        console.error('❌ Erro ao salvar referência:', err)
        alert(err instanceof Error ? err.message : 'Erro ao salvar referência')
      } finally {
        setModalLoading(false)
      }
    }
  }, [activeTab, formDataAutor, formDataReferencia, modalMode, selectedAutor, selectedReferencia, fecharModal])

  // ✅ INPUT CHANGE HANDLERS
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

  // ✅ DELETE FUNCTIONS
  const handleDelete = async (id: number): Promise<void> => {
    try {
      if (activeTab === 'autores') {
        const checkResponse = await fetch(`${API_BASE_URL}/api/admin/autores/${id}`)
        
        if (!checkResponse.ok) {
          throw new Error('Erro ao verificar autor')
        }
        
        const autorData = await checkResponse.json()
        
        const totalRelacionados = (autorData.total_plantas || 0) + (autorData.total_referencias || 0)
        
        if (totalRelacionados > 0) {
          setConfirmModalData({
            type: 'warning',
            title: 'Não é possível excluir este autor',
            message: `O autor "${autorData.nome_autor}" tem ${totalRelacionados} associações (${autorData.total_plantas || 0} plantas e ${autorData.total_referencias || 0} referências).`,
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
            message: `A referência "${referenciaData.titulo_referencia || 'Sem título'}" tem ${referenciaData.total_plantas} plantas associadas.`,
            itemName: referenciaData.titulo_referencia || 'Sem título',
            totalRelacionados: referenciaData.total_plantas
          })
          setShowConfirmModal(true)
          return
        }
        
        setConfirmModalData({
          type: 'delete',
          title: 'Confirmar exclusão',
          message: `Tem certeza que deseja excluir a referência "${referenciaData.titulo_referencia || 'Sem título'}"?`,
          itemId: id,
          itemName: referenciaData.titulo_referencia || 'Sem título'
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

  // ✅ PAGINATION FUNCTIONS
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

  // ✅ COMPUTED VALUES
  const currentData = activeTab === 'autores' ? autores : referencias
  const currentTotal = activeTab === 'autores' ? totalAutores : totalReferencias
  const currentPage = activeTab === 'autores' ? currentPageAutores : currentPageReferencias
  const currentTotalPages = activeTab === 'autores' ? totalPagesAutores : totalPagesReferencias
  const currentSearchTerm = activeTab === 'autores' ? searchTermAutores : searchTermReferencias
  const currentDebouncedSearchTerm = activeTab === 'autores' ? debouncedSearchTermAutores : debouncedSearchTermReferencias
  const isSearching = currentSearchTerm !== currentDebouncedSearchTerm && currentSearchTerm.length > 0

  // ✅ RENDER STATES
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
                placeholder={activeTab === 'autores' ? "Buscar autores por nome ou afiliação..." : "Buscar referências por título ou link..."}
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
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('nome_autor')}
                    >
                      Nome do Autor {sortBy === 'nome_autor' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className={styles.tableHeaderCell}>
                      Afiliação
                    </th>
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('total_plantas')}
                    >
                      Plantas {sortBy === 'total_plantas' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('total_referencias')}
                    >
                      Referências {sortBy === 'total_referencias' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                  </>
                ) : (
                  <>
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('titulo_referencia')}
                    >
                      Título {sortBy === 'titulo_referencia' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('tipo_referencia')}
                    >
                      Tipo {sortBy === 'tipo_referencia' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`${styles.tableHeaderCell} ${styles.sortable}`}
                      onClick={() => handleSort('ano')}
                    >
                      Ano {sortBy === 'ano' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                  <td colSpan={activeTab === 'autores' ? 5 : 6} className={styles.emptyMessage}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div className={styles.loadingSpinner}></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'autores' ? 5 : 6} className={styles.emptyMessage}>
                    {currentDebouncedSearchTerm ? (
                      <div className={styles.emptyContent}>
                        <div className={styles.emptyIcon}>🔍</div>
                        <h3 className={styles.emptyTitle}>
                          Nenhum {activeTab.slice(0, -1)} encontrado
                        </h3>
                        <p className={styles.emptyDescription}>
                          Não encontramos {activeTab} que correspondam a "{currentDebouncedSearchTerm}".
                          <br />
                          Tente ajustar sua busca ou adicionar um novo {activeTab.slice(0, -1)}.
                        </p>
                        <button 
                          onClick={() => abrirModal('add')}
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
                          Comece adicionando seu primeiro {activeTab.slice(0, -1)}.
                        </p>
                        <button 
                          onClick={() => limparFiltros()}
                          className={styles.addButton}
                          style={{ marginTop: 0 }}
                        >
                          Ver Primeiro {activeTab === 'autores' ? 'Autor' : 'Referência'}
                        </button>
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
                          {(item as Autor).sigla_afiliacao && (
                            <div className={styles.cellSubtitle}>
                              {(item as Autor).sigla_afiliacao}
                            </div>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Autor).afiliacao || 'Não informado'}
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Autor).total_plantas || 0} plantas
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Autor).total_referencias || 0} referências
                        </td>
                      </>
                    ) : (
                      <>
                        <td className={styles.tableCellMain}>
                          <div className={styles.cellTitle}>
                            {(item as Referencia).titulo_referencia || 'Sem título'}
                          </div>
                          {(item as Referencia).total_plantas && (item as Referencia).total_plantas! > 0 && (
                            <div className={styles.cellSubtitle}>
                              {(item as Referencia).total_plantas} plantas associadas
                            </div>
                          )}
                        </td>
                        <td className={styles.tableCell}>
                          <span className={styles.badge}>
                            {(item as Referencia).tipo_referencia || 'Não definido'}
                          </span>
                        </td>
                        <td className={styles.tableCell}>
                          {(item as Referencia).ano || 'N/A'}
                        </td>
                        <td className={styles.tableCell}>
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
          onFechar={fecharModal}
          onSubmit={handleSubmit}
          onInputChange={handleInputChangeAutor}
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