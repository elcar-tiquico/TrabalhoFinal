"use client"

import React, { useState, useEffect, useCallback, memo } from "react"
import Link from "next/link"
import styles from "./familias.module.css"
import modalStyles from "./modal.module.css"

// Tipos existentes mantidos...
interface Familia {
  id_familia: number
  nome_familia: string
  total_plantas?: number
}

interface PaginatedResponse<T> {
  familias?: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  erro?: string
  message?: string
  search_applied?: string
}

interface FamiliasResponse {
  familias: Familia[]
  total: number
  search_applied?: string
}

type SortField = "nome_familia" | "total_plantas"
type SortOrder = "asc" | "desc"
type ModalMode = 'add' | 'edit' | 'view'

interface FormData {
  nome_familia: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

// ✅ MODAL DE CONFIRMAÇÃO - Componente separado e memoizado
interface ModalConfirmacaoProps {
  showConfirmModal: boolean
  confirmModalData: {
    type: 'delete' | 'warning'
    title: string
    message: string
    familiaId?: number
    familiaName?: string
    totalPlantas?: number
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
    <div className={modalStyles.modalOverlay} onClick={onFechar}>
      <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>
            {confirmModalData.title}
          </h2>
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
          {confirmModalData.type === 'warning' ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ 
                fontSize: '3rem', 
                color: '#dc2626', 
                marginBottom: '1rem' 
              }}>
                ⚠️
              </div>
              <p style={{ 
                fontSize: '1rem', 
                color: '#111827', 
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                {confirmModalData.message}
              </p>
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '0.5rem',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem',
                  margin: '0 0 0.5rem 0',
                  fontWeight: '500'
                }}>
                  Para excluir esta família, primeiro precisa:
                </p>
                <ul style={{ 
                  color: '#dc2626', 
                  fontSize: '0.875rem',
                  margin: '0',
                  paddingLeft: '1.5rem'
                }}>
                  <li>Mover as {confirmModalData.totalPlantas} plantas para outra família, OU</li>
                  <li>Excluir todas as plantas desta família</li>
                </ul>
              </div>
              <p style={{ 
                fontSize: '0.75rem', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Esta validação protege a integridade dos dados.
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ 
                fontSize: '3rem', 
                color: '#dc2626', 
                marginBottom: '1rem' 
              }}>
                🗑️
              </div>
              <p style={{ 
                fontSize: '1rem', 
                color: '#111827', 
                marginBottom: '1rem',
                lineHeight: '1.5'
              }}>
                {confirmModalData.message}
              </p>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                fontStyle: 'italic'
              }}>
                Esta família não tem plantas associadas.
                <br />
                Esta acção não pode ser desfeita.
              </p>
            </div>
          )}
        </div>

        <div className={modalStyles.modalFooter}>
          <button 
            className={modalStyles.btnSecondary}
            onClick={onFechar}
          >
            {confirmModalData.type === 'warning' ? 'Entendi' : 'Cancelar'}
          </button>
          
          {confirmModalData.type === 'delete' && (
            <button 
              className={modalStyles.btnDanger}
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

// ✅ MODAL DE GESTÃO - Componente separado e memoizado
interface ModalGestaoProps {
  showModal: boolean
  modalMode: ModalMode
  modalLoading: boolean
  selectedFamilia: Familia | null
  formData: FormData
  onFechar: () => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const ModalGestao = memo<ModalGestaoProps>(({ 
  showModal, 
  modalMode, 
  modalLoading, 
  selectedFamilia, 
  formData, 
  onFechar, 
  onSubmit, 
  onInputChange, 
  onKeyDown 
}) => {
  if (!showModal) return null

  return (
    <div 
      className={modalStyles.modalOverlay} 
      onClick={onFechar}
      style={{ zIndex: 9999 }}
    >
      <div 
        className={modalStyles.modalContent} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={modalStyles.modalHeader}>
          <h2 className={modalStyles.modalTitle}>
            {modalMode === 'add' && 'Adicionar Nova Família'}
            {modalMode === 'edit' && 'Editar Família'}
            {modalMode === 'view' && 'Detalhes da Família'}
          </h2>
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
            <p>Processando...</p>
          </div>
        ) : (
          <form 
            onSubmit={onSubmit}
            noValidate
          >
            <div className={modalStyles.modalBody}>
              {modalMode === 'view' && selectedFamilia ? (
                <div className={modalStyles.viewContent}>
                  <div className={modalStyles.infoGrid}>
                    <div className={modalStyles.infoItem}>
                      <label>ID:</label>
                      <span>{selectedFamilia.id_familia}</span>
                    </div>
                    <div className={modalStyles.infoItem}>
                      <label>Nome da Família:</label>
                      <span><strong>{selectedFamilia.nome_familia.toUpperCase()}</strong></span>
                    </div>
                    <div className={modalStyles.infoItem}>
                      <label>Total de Plantas:</label>
                      <span>{selectedFamilia.total_plantas || 0} plantas</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={modalStyles.formGrid}>
                  <div className={modalStyles.formItem}>
                    <label htmlFor="nome_familia" className={modalStyles.formLabel}>
                      Nome da Família *
                    </label>
                    <input
                      type="text"
                      id="nome_familia"
                      name="nome_familia"
                      value={formData.nome_familia}
                      onChange={onInputChange}
                      onKeyDown={onKeyDown}
                      className={modalStyles.formInput}
                      placeholder="Ex: Asteraceae, Fabaceae..."
                      maxLength={100}
                      disabled={modalLoading}
                      autoComplete="off"
                      autoFocus={modalMode !== 'view'}
                    />
                    <div className={modalStyles.formHint}>
                      Nome científico da família botânica (máximo 100 caracteres)
                    </div>
                    
                    <div style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: (formData.nome_familia?.length || 0) > 90 ? '#dc2626' : '#6b7280',
                      textAlign: 'right'
                    }}>
                      {formData.nome_familia?.length || 0}/100 caracteres
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={modalStyles.modalFooter}>
              <button 
                type="button"
                className={modalStyles.btnSecondary}
                onClick={onFechar}
                disabled={modalLoading}
              >
                {modalMode === 'view' ? 'Fechar' : 'Cancelar'}
              </button>
              
              {modalMode !== 'view' && (
                <button 
                  type="submit"
                  className={modalStyles.btnPrimary}
                  disabled={modalLoading || !formData.nome_familia.trim()}
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
export default function FamiliesPage() {
  // Estados existentes mantidos...
  const [familias, setFamilias] = useState<Familia[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalFamilias, setTotalFamilias] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<SortField>('nome_familia')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // Estados para modal
  const [showModal, setShowModal] = useState<boolean>(false)
  const [modalMode, setModalMode] = useState<ModalMode>('add')
  const [selectedFamilia, setSelectedFamilia] = useState<Familia | null>(null)
  const [modalLoading, setModalLoading] = useState<boolean>(false)

  // Estados para formulário
  const [formData, setFormData] = useState<FormData>({
    nome_familia: ""
  })

  // Estados para modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false)
  const [confirmModalData, setConfirmModalData] = useState<{
    type: 'delete' | 'warning'
    title: string
    message: string
    familiaId?: number
    familiaName?: string
    totalPlantas?: number
  } | null>(null)

  // ✅ ADICIONAR esta função dentro do componente (antes do return)
  // ✅ FUNÇÃO showHighlightIndicator com cores ajustadas para a página

  const showHighlightIndicator = (element: Element, tipo: string) => {
    // Criar notificação
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
        ✨ ${tipo === 'planta' ? 'Planta' : 'Família'} encontrada!
        <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
          📍 Item destacado abaixo
        </div>
      </div>
    `
    
    document.body.appendChild(indicator)
    
    // Remover após 4 segundos
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'slideOutRight 0.3s ease-in'
        setTimeout(() => {
          document.body.removeChild(indicator)
        }, 300)
      }
    }, 4000)
    
    // Adicionar seta apontando para o elemento
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

  // ✅ Hook para debounce do termo de pesquisa
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // ✅ useEffect que carrega famílias COM FILTRO
  useEffect(() => {
    let isCancelled = false
    
    const carregarFamiliasComDebounce = async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!isCancelled) {
        console.log('🔄 Carregando famílias com estados:', {
          currentPage,
          itemsPerPage,
          debouncedSearchTerm,
          sortBy,
          sortOrder
        })
        
        await carregarFamilias()
      }
    }
    
    carregarFamiliasComDebounce()
    
    return () => {
      isCancelled = true
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, sortBy, sortOrder])

  // ✅ useEffect para resetar página quando pesquisa muda
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1)
    }
  }, [debouncedSearchTerm, searchTerm])

  // ✅ NOVO: Hook para highlight vindos da pesquisa do header
  useEffect(() => {
    const processUrlParams = async () => {
      // ✅ DELAY INICIAL para garantir carregamento
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const urlParams = new URLSearchParams(window.location.search)
      const highlightId = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearch = urlParams.get('search')
      const timestamp = urlParams.get('t')
      
      console.log('🔍 Processando parâmetros da URL (famílias):', {
        highlight: highlightId,
        page: pageParam,
        search: urlSearch,
        timestamp: timestamp
      })
      
      // ✅ RESETAR ESTADOS ANTES DE APLICAR NOVOS
      console.log('🧹 Resetando estados antes de aplicar URL...')
      
      // ✅ APLICAR FILTRO DE BUSCA PRIMEIRO
      if (urlSearch) {
        console.log(`🎯 Aplicando busca da URL: "${urlSearch}"`)
        const decodedSearch = decodeURIComponent(urlSearch)
        
        // ✅ APLICAR ESTADOS COM DELAYS
        setSearchTerm(decodedSearch)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        setDebouncedSearchTerm(decodedSearch)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // ✅ RESETAR PÁGINA ANTES DE APLICAR A NOVA
        setCurrentPage(1)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // ✅ APLICAR PÁGINA APÓS APLICAR FILTROS
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log(`📄 Aplicando página da URL: ${pageNumber}`)
          setCurrentPage(pageNumber)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // ✅ CONFIGURAR HIGHLIGHT COM DELAY MAIOR
      if (highlightId) {
        console.log(`✨ Configurando highlight para família ${highlightId}`)
        
        // ✅ PRIMEIRA TENTATIVA
        const highlightTimeout = setTimeout(() => {
          console.log('🔍 Tentando encontrar elemento família para highlight...')
          
          const element = document.querySelector(`[data-familia-id="${highlightId}"]`)
          if (element) {
            console.log('✅ Elemento família encontrado, aplicando highlight')
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
            
            // ✅ INDICADOR VISUAL
            if (typeof showHighlightIndicator === 'function') {
              showHighlightIndicator(element, 'família')
            }
            
            // Remover highlight após 5 segundos
            setTimeout(() => {
              element.classList.remove('highlighted')
            }, 5000)
          } else {
            console.log('❌ Elemento família não encontrado na primeira tentativa')
            
            // ✅ SEGUNDA TENTATIVA
            setTimeout(() => {
              console.log('🔍 Segunda tentativa de encontrar elemento família...')
              const retryElement = document.querySelector(`[data-familia-id="${highlightId}"]`)
              if (retryElement) {
                console.log('✅ Elemento família encontrado na segunda tentativa')
                retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                retryElement.classList.add('highlighted')
                
                if (typeof showHighlightIndicator === 'function') {
                  showHighlightIndicator(retryElement, 'família')
                }
                
                setTimeout(() => {
                  retryElement.classList.remove('highlighted')
                }, 5000)
              } else {
                console.log('❌ Elemento família ainda não encontrado')
                
                // ✅ TERCEIRA TENTATIVA
                setTimeout(() => {
                  console.log('🔍 Terceira tentativa família...')
                  const finalElement = document.querySelector(`[data-familia-id="${highlightId}"]`)
                  if (finalElement) {
                    console.log('✅ Elemento família finalmente encontrado!')
                    finalElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    finalElement.classList.add('highlighted')
                    
                    if (typeof showHighlightIndicator === 'function') {
                      showHighlightIndicator(finalElement, 'família')
                    }
                    
                    setTimeout(() => {
                      finalElement.classList.remove('highlighted')
                    }, 5000)
                  } else {
                    console.log('❌ Elemento família definitivamente não encontrado')
                  }
                }, 3000)
              }
            }, 2000)
          }
        }, 4000) // ✅ DELAY MAIOR: 4 segundos
        
        return () => clearTimeout(highlightTimeout)
      }
      
      // ✅ LIMPAR URL após processar
      if (highlightId || pageParam || urlSearch) {
        setTimeout(() => {
          console.log('🧹 Limpando URL da família...')
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
    
    processUrlParams()
  }, [])

  // ✅ EFFECT: Prevenir scroll quando modal aberto
  useEffect(() => {
    if (showModal || showConfirmModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showModal, showConfirmModal])

  // ✅ Função carregarFamilias COM BUSCA
  const carregarFamilias = async (): Promise<void> => {
    try {
      console.log('🔄 Iniciando carregamento de famílias...')
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      // ✅ LOGS DETALHADOS
      console.log('📋 Estados atuais das famílias:', {
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        sortBy,
        sortOrder
      })
      
      // ✅ APLICAR FILTRO DE BUSCA
      if (debouncedSearchTerm) {
        console.log(`🔍 Aplicando busca de família: "${debouncedSearchTerm}"`)
        params.append('search', debouncedSearchTerm)
      }
      
      const finalUrl = `${API_BASE_URL}/api/admin/familias?${params}`
      console.log(`🌐 URL final da requisição de famílias: ${finalUrl}`)
      
      const response = await fetch(finalUrl)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: FamiliasResponse = await response.json()
      
      console.log('✅ Dados de famílias recebidos:', {
        total: data.total,
        familias_count: data.familias?.length || 0,
        first_familia: data.familias?.[0]?.nome_familia || 'nenhuma',
        search_applied: data.search_applied
      })
      
      // ✅ APLICAR ORDENAÇÃO
      let familiasOrdenadas = data.familias || []
      
      if (sortBy && familiasOrdenadas.length > 0) {
        console.log(`🔄 Aplicando ordenação de famílias: ${sortBy} ${sortOrder}`)
        
        familiasOrdenadas = [...familiasOrdenadas].sort((a, b) => {
          let aValue: string | number = ''
          let bValue: string | number = ''
          
          switch (sortBy) {
            case 'nome_familia':
              aValue = a.nome_familia || ''
              bValue = b.nome_familia || ''
              break
            case 'total_plantas':
              aValue = a.total_plantas || 0
              bValue = b.total_plantas || 0
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
      
      // ✅ ATUALIZAR ESTADOS
      setFamilias(familiasOrdenadas)
      setTotalFamilias(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      
      console.log(`✅ Famílias carregadas com sucesso: ${familiasOrdenadas.length} de ${data.total} total`)
      
    } catch (err) {
      console.error('❌ Erro ao carregar famílias:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar famílias: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Função handleSort resetar página
  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // ✅ Função handlePageSizeChange resetar página
  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPage(1)
  }

  // ✅ Função limparFiltros
  const limparFiltros = (): void => {
    console.log('🧹 Limpando todos os filtros')
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setCurrentPage(1)
    setSortBy('nome_familia')
    setSortOrder('asc')
  }

  // ✅ CORREÇÃO: Função abrirModal com tipos corretos
  const abrirModal = useCallback((mode: ModalMode, familia?: Familia) => {
    console.log(`🔓 Abrindo modal em modo: ${mode}`)
    
    setModalMode(mode)
    setSelectedFamilia(familia || null)
    
    if (mode === 'add') {
      setFormData({ nome_familia: "" })
    } else if (mode === 'edit' && familia) {
      setFormData({ nome_familia: familia.nome_familia })
    }
    
    setShowModal(true)
  }, [])

  const fecharModal = useCallback(() => {
    console.log(`🔒 Fechando modal`)
    
    setShowModal(false)
    setSelectedFamilia(null)
    setFormData({ nome_familia: "" })
    setModalLoading(false)
  }, [])

  // ✅ CORREÇÃO: handleSubmit com tipos corretos e estável
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!formData.nome_familia.trim()) {
      alert('Nome da família é obrigatório')
      return false
    }

    try {
      setModalLoading(true)
      
      const url = modalMode === 'edit' && selectedFamilia 
        ? `${API_BASE_URL}/api/admin/familias/${selectedFamilia.id_familia}`
        : `${API_BASE_URL}/api/admin/familias`
      
      const method = modalMode === 'edit' ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar família')
      }
      
      console.log(`✅ Família ${modalMode === 'edit' ? 'atualizada' : 'criada'} com sucesso`)
      
      fecharModal()
      await carregarFamilias()
      
    } catch (err) {
      console.error('❌ Erro ao salvar família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao salvar família')
    } finally {
      setModalLoading(false)
    }
  }, [formData, modalMode, selectedFamilia, fecharModal])

  // ✅ CORREÇÃO CRÍTICA: handleInputChange ESTÁVEL sem dependências
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: value
    }))
  }, [])

  // ✅ CORREÇÃO: handleKeyDown com tipos corretos e estável
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.tagName === 'INPUT') {
      e.preventDefault()
      
      if (e.currentTarget.name === 'nome_familia' && e.currentTarget.value?.trim()) {
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          currentTarget: e.currentTarget.form
        } as React.FormEvent<HTMLFormElement>
        
        handleSubmit(syntheticEvent)
      }
    }
  }, [handleSubmit])

  // ✅ CORREÇÃO: handleDelete com tipos corretos
  const handleDelete = async (id: number): Promise<void> => {
    try {
      console.log(`🔍 Verificando família ${id} antes de excluir`)
      
      const checkResponse = await fetch(`${API_BASE_URL}/api/admin/familias/${id}`)
      
      if (!checkResponse.ok) {
        throw new Error('Erro ao verificar família')
      }
      
      const familiaData = await checkResponse.json()
      
      if (familiaData.total_plantas && familiaData.total_plantas > 0) {
        setConfirmModalData({
          type: 'warning',
          title: 'Não é possível excluir esta família',
          message: `A família "${familiaData.nome_familia}" tem ${familiaData.total_plantas} plantas associadas.`,
          familiaName: familiaData.nome_familia,
          totalPlantas: familiaData.total_plantas
        })
        setShowConfirmModal(true)
        return
      }
      
      setConfirmModalData({
        type: 'delete',
        title: 'Confirmar exclusão',
        message: `Tem certeza que deseja excluir a família "${familiaData.nome_familia}"?`,
        familiaId: id,
        familiaName: familiaData.nome_familia
      })
      setShowConfirmModal(true)
      
    } catch (err) {
      console.error('❌ Erro ao verificar família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao verificar família')
    }
  }

  // ✅ Handlers estáveis para os modais
  const confirmarExclusao = useCallback(async () => {
    if (!confirmModalData?.familiaId) return
    
    try {
      console.log(`🗑️ Excluindo família ${confirmModalData.familiaId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/familias/${confirmModalData.familiaId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir família')
      }
      
      console.log('✅ Família excluída com sucesso')
      setShowConfirmModal(false)
      setConfirmModalData(null)
      await carregarFamilias()
      
    } catch (err) {
      console.error('❌ Erro ao excluir família:', err)
      alert(err instanceof Error ? err.message : 'Erro ao excluir família')
    }
  }, [confirmModalData?.familiaId])

  const fecharConfirmModal = useCallback(() => {
    setShowConfirmModal(false)
    setConfirmModalData(null)
  }, [])

  // ✅ Indicador de busca
  const isSearching: boolean = searchTerm !== debouncedSearchTerm && searchTerm.length > 0

  // Funções de paginação
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

  // Estados de carregamento e erro
  if (loading && familias.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Famílias</h1>
        </div>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <span>Carregando famílias da base de dados...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Famílias</h1>
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerir Famílias</h1>
        <button 
          onClick={() => abrirModal('add')}
          className={styles.addButton}
        >
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
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Adicionar Nova Família
        </button>
      </div>

      {/* ✅ Filtros usando o mesmo estilo das plantas */}
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

      {/* ✅ Informações de resultados igual às plantas */}
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
                  - actualizando...
                </span>
              )}
            </>
          ) : (
            "Nenhuma família encontrada"
          )}
        </span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* ✅ Tabela usando o mesmo estilo das plantas */}
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
                          Tente ajustar sua busca ou adicionar uma nova família.
                        </p>
                        <button 
                          onClick={() => abrirModal('add')}
                          className={styles.addButton}
                          style={{ marginTop: 0 }}
                        >
                          Adicionar Nova Família
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌿</div>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#111827' }}>Nenhuma família cadastrada</h3>
                        <p style={{ margin: '0 0 1rem 0', color: '#6b7280' }}>
                          Comece adicionando sua primeira família de plantas.
                        </p>
                        <button 
                          onClick={() => abrirModal('add')}
                          className={styles.addButton}
                          style={{ marginTop: 0 }}
                        >
                          Adicionar Primeira Família
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                familias.map((familia) => (
                  <tr key={familia.id_familia} className={styles.tableRow} data-familia-id={familia.id_familia}>                    
                    <td className={styles.tableCellName}>
                      <strong>{familia.nome_familia.toUpperCase()}</strong>
                    </td>
                    <td className={styles.tableCell}>
                      {familia.total_plantas || 0} plantas
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => abrirModal('view', familia)}
                          className={styles.viewButton}
                          title="Ver detalhes"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => abrirModal('edit', familia)}
                          className={styles.editButton}
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(familia.id_familia)}
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

      {/* ✅ Paginação igual às plantas */}
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

      {/* ✅ MODAIS OTIMIZADOS - Componentes externos memoizados */}
      <ModalGestao
        showModal={showModal}
        modalMode={modalMode}
        modalLoading={modalLoading}
        selectedFamilia={selectedFamilia}
        formData={formData}
        onFechar={fecharModal}
        onSubmit={handleSubmit}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />

      <ModalConfirmacao
        showConfirmModal={showConfirmModal}
        confirmModalData={confirmModalData}
        onConfirmar={confirmarExclusao}
        onFechar={fecharConfirmModal}
      />
    </div>
  )
}

// ✅ Definir nomes para os componentes memoizados (para debugging)
ModalConfirmacao.displayName = 'ModalConfirmacao'
ModalGestao.displayName = 'ModalGestao'