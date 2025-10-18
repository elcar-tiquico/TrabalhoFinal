"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import styles from "./familias.module.css"
import modalStyles from "./modal.module.css"

// ==================== TIPOS ====================
interface FamiliaAgregada {
  nome_familia: string
  total_plantas: number
}

interface PaginatedResponse {
  familias: FamiliaAgregada[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  search_applied?: string
}

type SortField = "nome_familia" | "total_plantas"
type SortOrder = "asc" | "desc"

interface RenameFormData {
  old_name: string
  new_name: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// ==================== MODAL DE RENOMEAÇÃO ====================
interface ModalRenomearProps {
  showModal: boolean
  modalLoading: boolean
  selectedFamilia: FamiliaAgregada | null
  formData: RenameFormData
  onFechar: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

const ModalRenomear = memo<ModalRenomearProps>(({ 
  showModal, 
  modalLoading, 
  selectedFamilia, 
  formData, 
  onFechar, 
  onSubmit, 
  onInputChange 
}) => {
  if (!showModal || !selectedFamilia) return null

  return (
    <div className={modalStyles.modalOverlay} onClick={onFechar}>
      <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>Renomear Família</h2>
          <button 
            className={modalStyles.modalCloseButton}
            onClick={onFechar}
            aria-label="Fechar modal"
            type="button"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {modalLoading ? (
          <div className={modalStyles.modalLoading}>
            <div className={modalStyles.loadingSpinner}></div>
            <p>Processando renomeação...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className={modalStyles.modalBody}>
              <div style={{ 
                backgroundColor: '#fef3c7', 
                border: '1px solid #fbbf24',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <div style={{ fontSize: '1.25rem' }}>⚠️</div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      margin: '0 0 0.5rem 0', 
                      fontSize: '0.875rem', 
                      fontWeight: '600',
                      color: '#92400e'
                    }}>
                      Atenção: Esta acção acfeta TODAS as plantas
                    </h4>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.75rem', 
                      color: '#92400e',
                      lineHeight: '1.4'
                    }}>
                      Renomear esta família irá actualizar automaticamente <strong>todas as {selectedFamilia.total_plantas} plantas</strong> associadas.
                      {formData.new_name && formData.new_name !== selectedFamilia.nome_familia && (
                        <><br /><br />💡 <em>Se "{formData.new_name}" já existir, as famílias serão mescladas automaticamente.</em></>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className={modalStyles.formGrid}>
                <div className={modalStyles.formItem}>
                  <label htmlFor="old_name" className={modalStyles.formLabel}>
                    Nome Actual (somente leitura)
                  </label>
                  <input
                    type="text"
                    id="old_name"
                    name="old_name"
                    value={formData.old_name}
                    className={modalStyles.formInput}
                    disabled
                    style={{ 
                      backgroundColor: '#f3f4f6', 
                      cursor: 'not-allowed',
                      fontWeight: '600'
                    }}
                  />
                  <div className={modalStyles.formHint}>
                    📊 Esta família tem {selectedFamilia.total_plantas} plantas associadas
                  </div>
                </div>

                <div className={modalStyles.formItem}>
                  <label htmlFor="new_name" className={modalStyles.formLabel}>
                    Novo Nome da Família *
                  </label>
                  <input
                    type="text"
                    id="new_name"
                    name="new_name"
                    value={formData.new_name}
                    onChange={onInputChange}
                    className={modalStyles.formInput}
                    placeholder="Digite o novo nome..."
                    maxLength={100}
                    disabled={modalLoading}
                    autoComplete="off"
                    autoFocus
                  />
                  <div className={modalStyles.formHint}>
                    Nome científico da família botânica (máximo 100 caracteres)
                  </div>
                  
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.75rem', 
                    color: (formData.new_name?.length || 0) > 90 ? '#dc2626' : '#6b7280',
                    textAlign: 'right'
                  }}>
                    {formData.new_name?.length || 0}/100 caracteres
                  </div>
                </div>
              </div>
            </div>

            <div className={modalStyles.modalFooter}>
              <button 
                type="button"
                className={modalStyles.btnSecondary}
                onClick={onFechar}
                disabled={modalLoading}
              >
                Cancelar
              </button>
              
              <button 
                type="submit"
                className={modalStyles.btnPrimary}
                disabled={modalLoading || !formData.new_name.trim() || formData.new_name === formData.old_name}
                style={{
                  opacity: (!formData.new_name.trim() || formData.new_name === formData.old_name) ? 0.5 : 1
                }}
              >
                {modalLoading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '14px',
                      height: '14px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Renomeando...
                  </span>
                ) : (
                  '✏️ Renomear Família'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
})

ModalRenomear.displayName = 'ModalRenomear'

// ==================== MODAL DE VISUALIZAÇÃO ====================
interface ModalVisualizarProps {
  showModal: boolean
  selectedFamilia: FamiliaAgregada | null
  onFechar: () => void
}

const ModalVisualizar = memo<ModalVisualizarProps>(({ 
  showModal, 
  selectedFamilia, 
  onFechar 
}) => {
  if (!showModal || !selectedFamilia) return null

  return (
    <div className={modalStyles.modalOverlay} onClick={onFechar}>
      <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>Detalhes da Família</h2>
          <button 
            className={modalStyles.modalCloseButton}
            onClick={onFechar}
            aria-label="Fechar modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className={modalStyles.modalBody}>
          <div className={modalStyles.viewContent}>
            <div className={modalStyles.infoGrid}>
              <div className={modalStyles.infoItem}>
                <label>Nome da Família:</label>
                <span><strong>{selectedFamilia.nome_familia.toUpperCase()}</strong></span>
              </div>
              <div className={modalStyles.infoItem}>
                <label>Total de Plantas:</label>
                <span>{selectedFamilia.total_plantas} plantas cadastradas</span>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '0.5rem'
            }}>
              <p style={{ 
                margin: 0, 
                fontSize: '0.875rem', 
                color: '#075985',
                lineHeight: '1.5'
              }}>
                💡 <strong>Informação:</strong> Esta família é gerada automaticamente a partir das plantas cadastradas no sistema. Para adicionar mais plantas a esta família, cadastre novas plantas com este nome de família.
              </p>
            </div>
          </div>
        </div>

        <div className={modalStyles.modalFooter}>
          <button 
            type="button"
            className={modalStyles.btnSecondary}
            onClick={onFechar}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
})

ModalVisualizar.displayName = 'ModalVisualizar'

// ==================== COMPONENTE PRINCIPAL ====================
export default function FamiliasPage() {
  // Estados principais
  const [familias, setFamilias] = useState<FamiliaAgregada[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalFamilias, setTotalFamilias] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  
  // Estados de ordenação
  const [sortBy, setSortBy] = useState<SortField>('nome_familia')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Estados de modais
  const [showModalRenomear, setShowModalRenomear] = useState<boolean>(false)
  const [showModalVisualizar, setShowModalVisualizar] = useState<boolean>(false)
  const [selectedFamilia, setSelectedFamilia] = useState<FamiliaAgregada | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)

  // Estados de formulário
  const [formData, setFormData] = useState<RenameFormData>({
    old_name: "",
    new_name: ""
  })

  // ==================== FUNÇÃO DE HIGHLIGHT ====================
  const showHighlightIndicator = (element: Element) => {
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
        ✨ Família encontrada!
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

  // ==================== DEBOUNCE DE BUSCA ====================
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // ==================== CARREGAR FAMÍLIAS ====================
  useEffect(() => {
    let isCancelled = false
    
    const carregarFamiliasComDebounce = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!isCancelled) {
        await carregarFamilias()
      }
    }
    
    carregarFamiliasComDebounce()
    
    return () => {
      isCancelled = true
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder])

  // ==================== RESETAR PÁGINA AO BUSCAR ====================
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm, searchTerm])

  // ==================== PROCESSAR URL PARAMS (HIGHLIGHT) ====================
  useEffect(() => {
    const processUrlParams = async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const urlParams = new URLSearchParams(window.location.search)
      const highlightNome = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearch = urlParams.get('search')
      
      if (urlSearch) {
        const decodedSearch = decodeURIComponent(urlSearch)
        setSearchTerm(decodedSearch)
        await new Promise(resolve => setTimeout(resolve, 50))
        setDebouncedSearchTerm(decodedSearch)
        await new Promise(resolve => setTimeout(resolve, 50))
        setCurrentPage(1)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          setCurrentPage(pageNumber)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      if (highlightNome) {
        const highlightTimeout = setTimeout(() => {
          const element = document.querySelector(`[data-familia-nome="${highlightNome}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
            showHighlightIndicator(element)
            
            setTimeout(() => {
              element.classList.remove('highlighted')
            }, 5000)
          } else {
            setTimeout(() => {
              const retryElement = document.querySelector(`[data-familia-nome="${highlightNome}"]`)
              if (retryElement) {
                retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                retryElement.classList.add('highlighted')
                showHighlightIndicator(retryElement)
                
                setTimeout(() => {
                  retryElement.classList.remove('highlighted')
                }, 5000)
              }
            }, 2000)
          }
        }, 4000)
        
        return () => clearTimeout(highlightTimeout)
      }
      
      if (highlightNome || pageParam || urlSearch) {
        setTimeout(() => {
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
    
    processUrlParams()
  }, [])

  // ==================== PREVENIR SCROLL QUANDO MODAL ABERTO ====================
  useEffect(() => {
    if (showModalRenomear || showModalVisualizar) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModalRenomear, showModalVisualizar])

  // ==================== FUNÇÃO: CARREGAR FAMÍLIAS ====================
  const carregarFamilias = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      if (debouncedSearchTerm) {
        params.append('search', debouncedSearchTerm)
      }
      
      const finalUrl = `${API_BASE_URL}/api/admin/familias?${params}`
      const response = await fetch(finalUrl)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: PaginatedResponse = await response.json()
      
      setFamilias(data.familias || [])
      setTotalFamilias(data.total || 0)
      setTotalPages(data.total_pages || 1)
      
    } catch (err) {
      console.error('❌ Erro ao carregar famílias:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar famílias: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ==================== FUNÇÃO: ORDENAÇÃO ====================
  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // ==================== FUNÇÃO: MUDAR TAMANHO PÁGINA ====================
  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPage(1)
  }

  // ==================== FUNÇÃO: LIMPAR FILTROS ====================
  const limparFiltros = (): void => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setCurrentPage(1)
    setSortBy('nome_familia')
    setSortOrder('asc')
  }

  // ==================== FUNÇÃO: ABRIR MODAL VISUALIZAR ====================
  const abrirModalVisualizar = useCallback((familia: FamiliaAgregada) => {
    setSelectedFamilia(familia)
    setShowModalVisualizar(true)
  }, [])

  // ==================== FUNÇÃO: FECHAR MODAL VISUALIZAR ====================
  const fecharModalVisualizar = useCallback(() => {
    setShowModalVisualizar(false)
    setSelectedFamilia(null)
  }, [])

  // ==================== FUNÇÃO: ABRIR MODAL RENOMEAR ====================
  const abrirModalRenomear = useCallback((familia: FamiliaAgregada) => {
    setSelectedFamilia(familia)
    setFormData({
      old_name: familia.nome_familia,
      new_name: familia.nome_familia
    })
    setShowModalRenomear(true)
  }, [])

  // ==================== FUNÇÃO: FECHAR MODAL RENOMEAR ====================
  const fecharModalRenomear = useCallback(() => {
    setShowModalRenomear(false)
    setSelectedFamilia(null)
    setFormData({ old_name: "", new_name: "" })
    setModalLoading(false)
  }, [])

  // ==================== FUNÇÃO: SUBMETER RENOMEAÇÃO ====================
  const handleSubmitRename = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!formData.new_name.trim() || formData.new_name === formData.old_name) {
      alert('Por favor, insira um novo nome diferente do atual')
      return
    }

    try {
      setModalLoading(true)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/familias/rename`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          old_name: formData.old_name,
          new_name: formData.new_name
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erro ao renomear família')
      }
      
      // Mostrar mensagem de sucesso
      const operation = data.operation === 'merge' ? 'unificadas' : 'renomeada'
      alert(`✅ Família ${operation} com sucesso!\n\n${data.info || data.message}`)
      
      fecharModalRenomear()
      await carregarFamilias()
      
    } catch (err) {
      console.error('❌ Erro ao renomear família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao renomear família')
    } finally {
      setModalLoading(false)
    }
  }, [formData, fecharModalRenomear])

  // ==================== FUNÇÃO: INPUT CHANGE ====================
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }, [])

  // ==================== INDICADOR DE BUSCA ====================
  const isSearching: boolean = searchTerm !== debouncedSearchTerm && searchTerm.length > 0

  // ==================== PAGINAÇÃO ====================
  const renderPaginationNumbers = () => {
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

  // ==================== LOADING STATE ====================
  if (loading && familias.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Consultar Famílias</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Carregando famílias da base de dados...</span>
        </div>
      </div>
    )
  }

  // ==================== ERROR STATE ====================
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Consultar Famílias</h1>
        </div>
        <div className={styles.errorMessage}>
          <h3>Erro ao conectar com a API</h3>
          <p>{error}</p>
          <button onClick={carregarFamilias}>
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  // ==================== RENDER PRINCIPAL ====================
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Consultar Famílias</h1>
        <div style={{ 
          fontSize: '0.875rem', 
          color: '#6b7280',
          fontStyle: 'italic' 
        }}>
          💡 Aqui encontras todas as famílias das plantas cadastradas
        </div>
      </div>

      {/* FILTROS */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              Buscar Famílias
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
                placeholder="Buscar famílias por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                )}
              </div>
            </div>
            {searchTerm.length > 0 && (
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
            <label htmlFor="pageSize" className={styles.filterLabel}>Itens por página</label>
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
        </div>

        <div className={styles.filterActions}>
          <button type="button" onClick={limparFiltros} className={styles.clearButton}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.icon}
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* INFORMAÇÕES DE RESULTADOS */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 0',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <span>
          {totalFamilias > 0 ? (
            <>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalFamilias)} de {totalFamilias} famílias
              {debouncedSearchTerm && ` (filtradas)`}
              {isSearching && (
                <span style={{ color: '#059669', fontWeight: '500', marginLeft: '0.5rem' }}>
                  - atualizando...
                </span>
              )}
            </>
          ) : (
            "Nenhuma família encontrada"
          )}
        </span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* TABELA */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nome_familia')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome da Família {sortBy === 'nome_familia' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('total_plantas')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Total de Plantas {sortBy === 'total_plantas' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div className={styles.loadingSpinner}></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : familias.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>
                    {debouncedSearchTerm ? (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Nenhuma família encontrada</h3>
                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                          Não encontramos famílias que correspondam a "{debouncedSearchTerm}".
                          <br />
                          Tente ajustar sua busca ou verifique a ortografia.
                        </p>
                        <button 
                          onClick={limparFiltros}
                          className={styles.clearButton}
                          style={{ marginTop: '1rem' }}
                        >
                          Limpar Busca
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Nenhuma família no sistema</h3>
                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                          As famílias são geradas automaticamente quando você cadastra plantas.
                          <br />
                          Comece adicionando sua primeira planta no sistema.
                        </p>
                        <Link 
                          href="/admin/plantas"
                          className={styles.addButton}
                          style={{ 
                            marginTop: 0,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          Ir para Plantas
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                familias.map((familia) => (
                  <tr 
                    key={familia.nome_familia} 
                    className={styles.tableRow} 
                    data-familia-nome={familia.nome_familia}
                  >                    
                    <td className={styles.tableCellName}>
                      <strong>{familia.nome_familia.toUpperCase()}</strong>
                    </td>
                    <td className={styles.tableCell}>
                      {familia.total_plantas} {familia.total_plantas === 1 ? 'planta' : 'plantas'}
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => abrirModalVisualizar(familia)}
                          className={styles.viewButton}
                          title="Ver detalhes"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => abrirModalRenomear(familia)}
                          className={styles.editButton}
                          title="Renomear família"
                        >
                          Renomear
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

      {/* PAGINAÇÃO */}
      {!loading && familias.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <div className={styles.paginationMobile}>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            <span style={{ padding: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
              {currentPage} / {totalPages}
            </span>
            <button 
              className={styles.paginationButton}
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Próximo
            </button>
          </div>
          <div className={styles.paginationDesktop}>
            <div>
              <p className={styles.paginationText}>
                Mostrando <span className={styles.paginationBold}>{((currentPage - 1) * itemsPerPage) + 1}</span> a{" "}
                <span className={styles.paginationBold}>{Math.min(currentPage * itemsPerPage, totalFamilias)}</span> de{" "}
                <span className={styles.paginationBold}>{totalFamilias}</span> resultados
              </p>
            </div>
            <div>
              <nav className={styles.paginationNav} aria-label="Pagination">
                <button 
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonLeft}`}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  title="Página anterior"
                >
                  <span className={styles.srOnly}>Anterior</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6"></polyline>
                  </svg>
                </button>
                
                {renderPaginationNumbers()}
                
                <button 
                  className={`${styles.paginationNavButton} ${styles.paginationNavButtonRight}`}
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  title="Próxima página"
                >
                  <span className={styles.srOnly}>Próximo</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* MODAIS */}
      <ModalVisualizar
        showModal={showModalVisualizar}
        selectedFamilia={selectedFamilia}
        onFechar={fecharModalVisualizar}
      />

      <ModalRenomear
        showModal={showModalRenomear}
        modalLoading={modalLoading}
        selectedFamilia={selectedFamilia}
        formData={formData}
        onFechar={fecharModalRenomear}
        onSubmit={handleSubmitRename}
        onInputChange={handleInputChange}
      />
    </div>
  )
}