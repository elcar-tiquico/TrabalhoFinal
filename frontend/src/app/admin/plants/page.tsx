"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./plants.module.css"
import modalStyles from "./modal.module.css" // ✅ IMPORTAR CSS DOS MODALS
import DeleteConfirmModal from './DeleteConfirmModal'
import PlantImageGallery from '../../components/PlantImageGallery';
// ✅ TIPOS DEFINIDOS PARA TYPESCRIPT
interface Planta {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  data_adicao: string
  familia: string
  nomes_comuns: string[]
  provincias: string[]
    imagens?: Array<{
    id_imagem: number;
    nome_arquivo: string;
    ordem: number;
    legenda?: string;
    url: string;
    data_upload?: string;
  }>
}

interface PlantaDetalhada {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  data_adicao: string
  familia: {
    id_familia: number
    nome_familia: string
  }
  nomes_comuns: Array<{
    id_nome: number
    nome_comum: string
  }>
  provincias: Array<{
    id_provincia: number
    nome_provincia: string
  }>
  // ✅ ADICIONAR ESTA PROPRIEDADE AQUI
  imagens?: Array<{
    id_imagem: number
    nome_arquivo: string
    ordem: number
    legenda?: string
    url: string
    data_upload?: string
  }>
  // ✅ NOVA ESTRUTURA: Usos específicos por parte
  usos_especificos?: Array<{
    id_uso_planta: number
    id_uso: number
    parte_usada: string
    observacoes?: string
    indicacoes: Array<{
      id_indicacao: number
      descricao: string
    }>
    metodos_preparacao: Array<{
      id_preparacao: number
      descricao: string
    }>
    metodos_extracao: Array<{
      id_extraccao: number
      descricao: string
    }>
  }>
  // ... resto da interface permanece igual
  usos_medicinais: Array<{
    id_uso: number
    parte_usada: string
    observacoes?: string
  }>
  autores: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
  }>
  // ✅ NOVA ESTRUTURA: Referencias com autores específicos
  referencias_especificas?: Array<{
    id_referencia: number
    titulo?: string
    tipo?: string
    ano?: string
    link?: string
    autores_especificos: Array<{
      id_autor: number
      nome_autor: string
      afiliacao?: string
      sigla_afiliacao?: string
      ordem_autor: number
      papel: string
    }>
  }>
  // ✅ MANTER COMPATIBILIDADE
  referencias: Array<{
    id_referencia: number
    titulo?: string
    tipo?: string
    ano?: string
    link?: string
  }>
  compostos?: Array<{
    id_composto: number
    nome_composto: string
  }>
  propriedades?: Array<{
    id_propriedade: number
    descricao: string
  }>
  indicacoes?: Array<{
    id_indicacao: number
    descricao: string
  }>
  metodos_extracao?: Array<{
    id_extraccao: number
    descricao: string
  }>
  metodos_preparacao?: Array<{
    id_preparacao: number
    descricao: string
  }>
}

interface Familia {
  id_familia: number
  nome_familia: string
  total_plantas: number
}

interface Provincia {
  id_provincia: number
  nome_provincia: string
  total_plantas: number
}

interface PaginatedResponse<T> {
  plantas?: T[]
  total: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
  erro?: string
  fallback?: boolean
  message?: string
}

interface FamiliasResponse {
  familias: Familia[]
  total: number
}

interface ProvinciasResponse {
  provincias: Provincia[]
  total: number
}

type SearchType = "geral" | "autor" | "parte_usada" | "indicacao" | "composto" | "propriedade"
type SortField = "nome_cientifico" | "familia" | "data_adicao" | "nomes_comuns"
type SortOrder = "asc" | "desc"

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'

export default function PlantsPage() {
  // Estados para os dados reais da API
  const [plantas, setPlantas] = useState<Planta[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados para filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [selectedFamily, setSelectedFamily] = useState<string>("")
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [searchType, setSearchType] = useState<SearchType>("geral")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false)
  
  // ✅ Estado para debounced search term
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("")
  
  // Estados para opções de filtro
  const [familias, setFamilias] = useState<Familia[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  
  // Estados para paginação
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalPlantas, setTotalPlantas] = useState<number>(0)
  const [itemsPerPage, setItemsPerPage] = useState<number>(10)
  
  // Estados para ordenação
  const [sortBy, setSortBy] = useState<SortField>('nome_cientifico')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')

  // ✅ ESTADOS APENAS PARA MODAL DE VISUALIZAÇÃO
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [selectedPlanta, setSelectedPlanta] = useState<PlantaDetalhada | null>(null)
  const [loadingModal, setLoadingModal] = useState<boolean>(false)

  // ✅ ESTADO PARA CONTROLAR SE JÁ PROCESSOU URL
  const [urlProcessed, setUrlProcessed] = useState(false)

  // 2. ✅ ADICIONAR ESTES ESTADOS (logo após os estados existentes, linha ~120)
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [plantaToDelete, setPlantaToDelete] = useState<PlantaDetalhada | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

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

  // ✅ useEffect que carrega plantas - agora usa debouncedSearchTerm
  useEffect(() => {
    // ✅ IMPORTANTE: Cancelar requisições anteriores se houver
    let isCancelled = false
    
    const carregarPlantasComDebounce = async () => {
      // ✅ DELAY PEQUENO para debounce
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (!isCancelled) {
        console.log('🔄 Carregando plantas com estados:', {
          currentPage,
          itemsPerPage,
          debouncedSearchTerm,
          selectedFamily,
          selectedLocation,
          searchType,
          sortBy,
          sortOrder
        })
        
        await carregarPlantas()
      }
    }
    
    carregarPlantasComDebounce()
    
    // ✅ FUNÇÃO DE LIMPEZA
    return () => {
      isCancelled = true
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, selectedFamily, selectedLocation, searchType, sortBy, sortOrder])

  // ✅ useEffect separado para mudanças imediatas
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFamily, selectedLocation, searchType, debouncedSearchTerm])

  // Carregar opções de filtro apenas uma vez
  useEffect(() => {
    carregarFiltros()
  }, [])

// ✅ ATUALIZAR o useEffect existente que processa parâmetros da URL
  useEffect(() => {
    const processUrlParams = async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const urlParams = new URLSearchParams(window.location.search)
      const highlightId = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearchType = urlParams.get('search_type') 
      const urlSearchTerm = urlParams.get('search_term')
      
      // ✅ NOVO: Processar filtro de família da URL
      const familiaParam = urlParams.get('familia')
      const highlightFamilia = urlParams.get('highlight_familia')
      const timestamp = urlParams.get('t')
      
      console.log('🔍 Processando parâmetros da URL:', {
        highlight: highlightId,
        page: pageParam,
        searchType: urlSearchType,
        searchTerm: urlSearchTerm,
        familia: familiaParam,        // ✅ NOVO
        highlightFamilia: highlightFamilia, // ✅ NOVO
        timestamp: timestamp
      })
      
      console.log('🧹 Resetando estados antes de aplicar URL...')
      
      // ✅ NOVO: Aplicar filtro de família PRIMEIRO (se existir)
      if (familiaParam) {
        console.log(`🏷️ Aplicando filtro de família da URL: "${familiaParam}"`)
        const decodedFamilia = decodeURIComponent(familiaParam)
        
        setSelectedFamily(decodedFamilia)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        // ✅ Mostrar indicador visual se veio do dashboard
        if (highlightFamilia === 'true') {
          // Criar notificação de família selecionada
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
              🏷️ Família "${decodedFamilia.toUpperCase()}" selecionada!
              <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">
                📋 Mostrando plantas desta família
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
          
          // ✅ Destacar o filtro de família visualmente
          setTimeout(() => {
            const familySelect = document.getElementById('family')
            if (familySelect) {
              familySelect.style.borderColor = '#9333ea'
              familySelect.style.boxShadow = '0 0 0 2px rgba(147, 51, 234, 0.2)'
              familySelect.style.backgroundColor = '#faf5ff'
              
              // Scroll suave até o filtro
              familySelect.scrollIntoView({ behavior: 'smooth', block: 'center' })
              
              // Remover destaque após 3 segundos
              setTimeout(() => {
                familySelect.style.borderColor = ''
                familySelect.style.boxShadow = ''
                familySelect.style.backgroundColor = ''
              }, 3000)
            }
          }, 1000)
        }
      }
      
      // ✅ APLICAR FILTROS DE BUSCA (mantido igual)
      if (urlSearchType && urlSearchTerm) {
        console.log(`🎯 Aplicando busca da URL: ${urlSearchType} = "${urlSearchTerm}"`)
        const decodedSearchType = decodeURIComponent(urlSearchType) as SearchType
        const decodedSearchTerm = decodeURIComponent(urlSearchTerm)
        
        setSearchType(decodedSearchType)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        setSearchTerm(decodedSearchTerm)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        setDebouncedSearchTerm(decodedSearchTerm)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        setCurrentPage(1)
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // ✅ APLICAR PÁGINA (mantido igual)
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log(`📄 Aplicando página da URL: ${pageNumber}`)
          setCurrentPage(pageNumber)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
      // ✅ HIGHLIGHT DE PLANTA (mantido igual)
      if (highlightId) {
        console.log(`✨ Configurando highlight para planta ${highlightId}`)
        
        const highlightTimeout = setTimeout(() => {
          console.log('🔍 Tentando encontrar elemento para highlight...')
          
          const element = document.querySelector(`[data-plant-id="${highlightId}"]`)
          if (element) {
            console.log('✅ Elemento encontrado, aplicando highlight')
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.classList.add('highlighted')
            
            if (typeof showHighlightIndicator === 'function') {
              showHighlightIndicator(element, 'planta')
            }
            
            setTimeout(() => {
              element.classList.remove('highlighted')
            }, 5000)
          } else {
            // Segunda e terceira tentativa (mantido igual)
            setTimeout(() => {
              const retryElement = document.querySelector(`[data-plant-id="${highlightId}"]`)
              if (retryElement) {
                retryElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                retryElement.classList.add('highlighted')
                
                if (typeof showHighlightIndicator === 'function') {
                  showHighlightIndicator(retryElement, 'planta')
                }
                
                setTimeout(() => {
                  retryElement.classList.remove('highlighted')
                }, 5000)
              } else {
                setTimeout(() => {
                  const finalElement = document.querySelector(`[data-plant-id="${highlightId}"]`)
                  if (finalElement) {
                    finalElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    finalElement.classList.add('highlighted')
                    
                    if (typeof showHighlightIndicator === 'function') {
                      showHighlightIndicator(finalElement, 'planta')
                    }
                    
                    setTimeout(() => {
                      finalElement.classList.remove('highlighted')
                    }, 5000)
                  }
                }, 3000)
              }
            }, 2000)
          }
        }, 4000)
        
        return () => clearTimeout(highlightTimeout)
      }
      
      // ✅ LIMPAR URL após processar
      if (highlightId || pageParam || urlSearchType || urlSearchTerm || familiaParam || highlightFamilia) {
        setTimeout(() => {
          console.log('🧹 Limpando URL...')
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
    
    processUrlParams()
  }, [])

  // ✅ EFFECT: Prevenir scroll quando modal aberto
  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }    
    // Cleanup quando componente desmonta
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showViewModal])


  const carregarPlantas = async (): Promise<void> => {
    try {
      console.log('🔄 Iniciando carregamento de plantas...')
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString()
      })
      
      let endpoint = `${API_BASE_URL}/api/admin/plantas`
      
      // ✅ ADICIONAR LOGS DETALHADOS
      console.log('📋 Estados atuais:', {
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        searchType,
        selectedFamily,
        selectedLocation
      })
      
      // ✅ APLICAR FILTROS DE BUSCA
      if (debouncedSearchTerm) {
        console.log(`🔍 Aplicando busca: "${debouncedSearchTerm}" (tipo: ${searchType})`)
        
        if (searchType === 'geral') {
          params.append('search', debouncedSearchTerm)
        } else {
          endpoint = `${API_BASE_URL}/api/admin/plantas/busca-avancada`
          params.append(searchType, debouncedSearchTerm)
        }
      }
      
      // ✅ APLICAR OUTROS FILTROS
      if (selectedFamily) {
        console.log(`🏷️ Aplicando filtro de família: ${selectedFamily}`)
        params.append('familia', selectedFamily)
      }
      
      if (selectedLocation) {
        console.log(`📍 Aplicando filtro de província: ${selectedLocation}`)
        params.append('provincia', selectedLocation)
      }
      
      const finalUrl = `${endpoint}?${params}`
      console.log(`🌐 URL final da requisição: ${finalUrl}`)
      
      const response = await fetch(finalUrl)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: PaginatedResponse<Planta> = await response.json()
      
      console.log('✅ Dados recebidos:', {
        total: data.total,
        page: data.page,
        plantas_count: data.plantas?.length || 0,
        first_plant: data.plantas?.[0]?.nome_cientifico || 'nenhuma'
      })
      
      // ✅ APLICAR ORDENAÇÃO
      let plantasOrdenadas = data.plantas || []
      
      if (sortBy && plantasOrdenadas.length > 0) {
        console.log(`🔄 Aplicando ordenação: ${sortBy} ${sortOrder}`)
        
        plantasOrdenadas = [...plantasOrdenadas].sort((a, b) => {
          let aValue: string = ''
          let bValue: string = ''
          
          switch (sortBy) {
            case 'nome_cientifico':
              aValue = a.nome_cientifico || ''
              bValue = b.nome_cientifico || ''
              break
            case 'familia':
              aValue = (a.familia || '').toUpperCase()
              bValue = (b.familia || '').toUpperCase()
              break
            case 'data_adicao':
              aValue = a.data_adicao || ''
              bValue = b.data_adicao || ''
              break
            case 'nomes_comuns':
              aValue = Array.isArray(a.nomes_comuns) ? a.nomes_comuns.join(', ') : ''
              bValue = Array.isArray(b.nomes_comuns) ? b.nomes_comuns.join(', ') : ''
              break
            default:
              aValue = ''
              bValue = ''
          }
          
          if (sortOrder === 'asc') {
            return aValue.localeCompare(bValue, 'pt', { numeric: true })
          } else {
            return bValue.localeCompare(aValue, 'pt', { numeric: true })
          }
        })
      }
      
      // ✅ ATUALIZAR ESTADOS
      setPlantas(plantasOrdenadas)
      setTotalPlantas(data.total || 0)
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
      
      console.log(`✅ Plantas carregadas com sucesso: ${plantasOrdenadas.length} de ${data.total} total`)
      
    } catch (err) {
      console.error('❌ Erro ao carregar plantas:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(`Erro ao carregar plantas: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const carregarFiltros = async (): Promise<void> => {
    try {
      console.log('🔄 Carregando filtros...')
      
      const familiasResponse = await fetch(`${API_BASE_URL}/api/admin/familias`)
      if (familiasResponse.ok) {
        const familiasData: FamiliasResponse = await familiasResponse.json()
        setFamilias(familiasData.familias || [])
        console.log('✅ Famílias carregadas:', familiasData.familias?.length)
      }
      
      const provinciasResponse = await fetch(`${API_BASE_URL}/api/admin/provincias`)
      if (provinciasResponse.ok) {
        const provinciasData: ProvinciasResponse = await provinciasResponse.json()
        setProvincias(provinciasData.provincias || [])
        console.log('✅ Províncias carregadas:', provinciasData.provincias?.length)
      }
    } catch (err) {
      console.error('❌ Erro ao carregar filtros:', err)
    }
  }

  // Função para preparar exclusão (carregar detalhes da planta)
  const handleDeleteClick = async (plantaId: number): Promise<void> => {
    try {
      console.log(`🔄 Carregando detalhes da planta ${plantaId} para exclusão`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${plantaId}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const plantaDetalhada: PlantaDetalhada = await response.json()
      
      setPlantaToDelete(plantaDetalhada)
      setShowDeleteModal(true)
      
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes para exclusão:', error)
      alert('Erro ao carregar detalhes da planta. Tente novamente.')
    }
  }

  // Função para confirmar exclusão
  const handleConfirmDelete = async (plantaId: number): Promise<void> => {
    setIsDeleting(true)
    try {
      console.log(`🗑️ Excluindo planta ${plantaId}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${plantaId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Erro ao excluir planta')
      }
      
      console.log('✅ Planta excluída com sucesso')
      
      // Fechar modal
      setShowDeleteModal(false)
      setPlantaToDelete(null)
      
      // Recarregar lista
      await carregarPlantas()
      
      // Mostrar confirmação
      alert('🗑️ Planta excluída com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao excluir planta:', error)
      alert(`Erro ao excluir planta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  // Função para fechar modal de exclusão
  const handleCloseDeleteModal = (): void => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setPlantaToDelete(null)
    }
  }

  // ✅ FUNÇÃO: Carregar detalhes da planta
  const carregarDetalhesPlanta = async (id: number): Promise<PlantaDetalhada | null> => {
    try {
      setLoadingModal(true)
      console.log(`🔄 Carregando detalhes da planta ${id}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data: PlantaDetalhada = await response.json()
      console.log('✅ Detalhes carregados:', data)
      
      return data
    } catch (err) {
      console.error('❌ Erro ao carregar detalhes:', err)
      alert('Erro ao carregar detalhes da planta')
      return null
    } finally {
      setLoadingModal(false)
    }
  }

  // ✅ FUNÇÃO: Abrir modal de visualização
  const handleViewPlanta = async (id: number): Promise<void> => {
    const detalhes = await carregarDetalhesPlanta(id)
    if (detalhes) {
      setSelectedPlanta(detalhes)
      setShowViewModal(true)
    }
  }

  // ✅ FUNÇÃO: Fechar modal
  const fecharModal = (): void => {
    setShowViewModal(false)
    setSelectedPlanta(null)
  }

  const handleDelete = async (id: number): Promise<void> => {
    if (!window.confirm("Tem certeza que deseja excluir esta planta?")) {
      return
    }
    
    try {
      console.log(`🗑️ Excluindo planta ${id}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Erro ao excluir planta')
      }
      
      console.log('✅ Planta excluída com sucesso')
      await carregarPlantas()
      
    } catch (err) {
      console.error('❌ Erro ao excluir planta:', err)
      alert('Erro ao excluir planta. Tente novamente.')
    }
  }

  const limparFiltros = (): void => {
    setSearchTerm("")
    setDebouncedSearchTerm("")
    setSelectedFamily("")
    setSelectedLocation("")
    setSearchType("geral")
    setCurrentPage(1)
    setSortBy('nome_cientifico')
    setSortOrder('asc')
  }

  const handleSort = (column: SortField): void => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  const handlePageSizeChange = (newSize: number): void => {
    setItemsPerPage(newSize)
    setCurrentPage(1)
  }

  const isSearching: boolean = searchTerm !== debouncedSearchTerm && searchTerm.length > 0

  const formatarData = (dataString: string | null | undefined): string => {
    if (!dataString) return 'Data não informada'
    try {
      const data = new Date(dataString)
      return data.toLocaleDateString('pt-BR')
    } catch {
      return dataString
    }
  }

  const formatarNomesComuns = (nomesComuns: string[] | null | undefined): string => {
    if (!nomesComuns || nomesComuns.length === 0) {
      return 'Sem nome comum'
    }
    if (Array.isArray(nomesComuns)) {
      return nomesComuns.join(', ')
    }
    return String(nomesComuns)
  }

  const formatarProvincias = (provincias: string[] | null | undefined): string => {
    if (!provincias || provincias.length === 0) {
      return 'Não informado'
    }
    if (Array.isArray(provincias)) {
      return provincias.join(', ')
    }
    return String(provincias)
  }

  const formatarFamilia = (familia: string | null | undefined): string => {
    return familia ? familia.toUpperCase() : 'NÃO INFORMADA'
  }

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

  // ✅ COMPONENTE: Modal de Visualização APENAS
  const ModalVisualizacao = () => {
    if (!showViewModal || !selectedPlanta) return null

    return (
      <div className={modalStyles.modalOverlay} onClick={fecharModal}>
        <div className={modalStyles.modalContent} onClick={(e) => e.stopPropagation()}>
          <div className={modalStyles.modalHeader}>
            <h2 className={modalStyles.modalTitle}>
              <em>{selectedPlanta.nome_cientifico}</em>
            </h2>
            <button 
              className={modalStyles.modalCloseButton}
              onClick={fecharModal}
              aria-label="Fechar modal"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {loadingModal ? (
            <div className={modalStyles.modalLoading}>
              <div className={modalStyles.loadingSpinner}></div>
              <p>Carregando detalhes...</p>
            </div>
          ) : (
            <div className={modalStyles.modalBody}>
              {/* ===== INFORMAÇÕES BÁSICAS ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Informações Básicas</h3>
                <div className={modalStyles.infoGrid}>
                  <div className={modalStyles.infoItem}>
                    <label>Nome Científico:</label>
                    <span><em>{selectedPlanta.nome_cientifico}</em></span>
                  </div>
                  <div className={modalStyles.infoItem}>
                    <label>Família:</label>
                    <span><strong>{selectedPlanta.familia.nome_familia.toUpperCase()}</strong></span>
                  </div>
                  {selectedPlanta.numero_exsicata && (
                    <div className={modalStyles.infoItem}>
                      <label>Informações Adicionais:</label>
                      <span>{selectedPlanta.numero_exsicata}</span>
                    </div>
                  )}
                  <div className={modalStyles.infoItem}>
                    <label>Data de Adição:</label>
                    <span>{formatarData(selectedPlanta.data_adicao)}</span>
                  </div>
                </div>
              </section>
              {/* ===== SEÇÃO DE IMAGENS ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>
                  Imagens da Planta
                </h3>
                <PlantImageGallery imagens={selectedPlanta.imagens} />
              </section>
              {/* ===== NOMES COMUNS ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Nomes Comuns</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.nomes_comuns.length > 0 ? (
                    selectedPlanta.nomes_comuns.map((nome) => (
                      <span key={nome.id_nome} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                        {nome.nome_comum}
                      </span>
                    ))
                  ) : (
                    <span className={modalStyles.noData}>Nenhum nome comum registrado</span>
                  )}
                </div>
              </section>

              {/* ===== DISTRIBUIÇÃO GEOGRÁFICA ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Distribuição Geográfica</h3>
                <div className={modalStyles.badgesContainer}>
                  {selectedPlanta.provincias.length > 0 ? (
                    selectedPlanta.provincias.map((provincia) => (
                      <span key={provincia.id_provincia} className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                        {provincia.nome_provincia}
                      </span>
                    ))
                  ) : (
                    <span className={modalStyles.noData}>Distribuição não informada</span>
                  )}
                </div>
              </section>

              {/* ===== USOS ESPECÍFICOS POR PARTE - VERSÃO SIMPLES ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Usos Medicinais Específicos</h3>
                {selectedPlanta.usos_especificos && selectedPlanta.usos_especificos.length > 0 ? (
                  <div className={modalStyles.usosEspecificosList}>
                    {selectedPlanta.usos_especificos.map((uso) => (
                      <div key={uso.id_uso_planta} className={modalStyles.usoEspecificoCard}>
                        <div className={modalStyles.usoHeader}>
                          <div className={modalStyles.parteUsadaHeader}>
                            <strong>{uso.parte_usada}</strong>
                          </div>
                          {uso.observacoes && (
                            <div className={modalStyles.observacoes}>
                              {uso.observacoes}
                            </div>
                          )}
                        </div>

                        <div className={modalStyles.usoDetailsGrid}>
                          {/* Indicações para esta parte específica */}
                          {uso.indicacoes && uso.indicacoes.length > 0 && (
                            <div className={modalStyles.usoDetailSection}>
                              <h4 className={modalStyles.usoDetailTitle}>Indicações</h4>
                              <div className={modalStyles.badgesContainer}>
                                {uso.indicacoes.map((indicacao) => (
                                  <span key={indicacao.id_indicacao} className={modalStyles.badge}>
                                    {indicacao.descricao}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Métodos de preparação para esta parte */}
                          {uso.metodos_preparacao && uso.metodos_preparacao.length > 0 && (
                            <div className={modalStyles.usoDetailSection}>
                              <h4 className={modalStyles.usoDetailTitle}>Preparação</h4>
                              <div className={modalStyles.badgesContainer}>
                                {uso.metodos_preparacao.map((metodo) => (
                                  <span key={metodo.id_preparacao} className={modalStyles.badge}>
                                    {metodo.descricao}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Métodos de extração para esta parte */}
                          {uso.metodos_extracao && uso.metodos_extracao.length > 0 && (
                            <div className={modalStyles.usoDetailSection}>
                              <h4 className={modalStyles.usoDetailTitle}>Extracção</h4>
                              <div className={modalStyles.badgesContainer}>
                                {uso.metodos_extracao.map((metodo) => (
                                  <span key={metodo.id_extraccao} className={modalStyles.badge}>
                                    {metodo.descricao}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedPlanta.usos_medicinais && selectedPlanta.usos_medicinais.length > 0 ? (
                  // Fallback: Mostrar estrutura antiga se nova não estiver disponível
                  <div className={modalStyles.usosList}>
                    {selectedPlanta.usos_medicinais.map((uso) => (
                      <div key={uso.id_uso} className={modalStyles.usoItem}>
                        <div className={modalStyles.usoParte}>
                          <strong>Parte usada:</strong> {uso.parte_usada}
                        </div>
                        {uso.observacoes && (
                          <div className={modalStyles.usoObservacoes}>
                            <strong>Observações:</strong> {uso.observacoes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={modalStyles.noData}>Nenhum uso medicinal registrado</span>
                )}
              </section>

              {/* ===== COMPOSIÇÃO QUÍMICA ===== */}
              {selectedPlanta.compostos && selectedPlanta.compostos.length > 0 && (
                <section className={modalStyles.modalSection}>
                  <h3 className={modalStyles.sectionTitle}>Composição Química</h3>
                  <div className={modalStyles.badgesContainer}>
                    {selectedPlanta.compostos.map((composto) => (
                      <span key={composto.id_composto} className={`${modalStyles.badge} ${modalStyles.badgePurple}`}>
                        {composto.nome_composto}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== PROPRIEDADES FARMACOLÓGICAS ===== */}
              {selectedPlanta.propriedades && selectedPlanta.propriedades.length > 0 && (
                <section className={modalStyles.modalSection}>
                  <h3 className={modalStyles.sectionTitle}>Propriedades Farmacológicas</h3>
                  <div className={modalStyles.badgesContainer}>
                    {selectedPlanta.propriedades.map((propriedade) => (
                      <span key={propriedade.id_propriedade} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                        {propriedade.descricao}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== INDICAÇÕES MEDICINAIS ===== */}
              {selectedPlanta.indicacoes && selectedPlanta.indicacoes.length > 0 && (
                <section className={modalStyles.modalSection}>
                  <h3 className={modalStyles.sectionTitle}>Indicações Medicinais</h3>
                  <div className={modalStyles.badgesContainer}>
                    {selectedPlanta.indicacoes.map((indicacao) => (
                      <span key={indicacao.id_indicacao} className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}>
                        {indicacao.descricao}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== MÉTODOS DE EXTRAÇÃO ===== */}
              {selectedPlanta.metodos_extracao && selectedPlanta.metodos_extracao.length > 0 && (
                <section className={modalStyles.modalSection}>
                  <h3 className={modalStyles.sectionTitle}>Métodos de Extracção</h3>
                  <div className={modalStyles.badgesContainer}>
                    {selectedPlanta.metodos_extracao.map((metodo, index) => (
                      <span key={metodo.id_extraccao || index} className={`${modalStyles.badge} ${modalStyles.badgePurple}`}>
                        {metodo.descricao}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== MÉTODOS DE PREPARAÇÃO TRADICIONAL ===== */}
              {selectedPlanta.metodos_preparacao && selectedPlanta.metodos_preparacao.length > 0 && (
                <section className={modalStyles.modalSection}>
                  <h3 className={modalStyles.sectionTitle}>Métodos de Preparação Tradicional</h3>
                  <div className={modalStyles.badgesContainer}>
                    {selectedPlanta.metodos_preparacao.map((metodo, index) => (
                      <span key={metodo.id_preparacao || index} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                        {metodo.descricao}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* ===== AUTORES E PESQUISADORES ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Autores e Pesquisadores</h3>
                {selectedPlanta.autores.length > 0 ? (
                  <div className={modalStyles.autoresList}>
                    {selectedPlanta.autores.map((autor) => (
                      <div key={autor.id_autor} className={modalStyles.autorItem}>
                        <div className={modalStyles.autorNome}>
                          <strong>{autor.nome_autor}</strong>
                        </div>
                        {autor.afiliacao && (
                          <div className={modalStyles.autorAfiliacao}>
                            {autor.afiliacao}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={modalStyles.noData}>Nenhum autor registrado</span>
                )}
              </section>

              {/* ===== REFERÊNCIAS BIBLIOGRÁFICAS COM AUTORES ESPECÍFICOS ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Referências Bibliográficas</h3>
                {selectedPlanta.referencias_especificas && selectedPlanta.referencias_especificas.length > 0 ? (
                  <div className={modalStyles.referenciasEspecificasList}>
                    {selectedPlanta.referencias_especificas.map((ref) => (
                      <div key={ref.id_referencia} className={modalStyles.referenciaEspecificaCard}>
                        <div className={modalStyles.referenciaHeader}>
                          <div className={modalStyles.refTitulo}>
                            <strong>{ref.titulo || 'Título não informado'}</strong>
                          </div>
                          <div className={modalStyles.refDetails}>
                            {ref.tipo && <span className={modalStyles.refTipo}>{ref.tipo}</span>}
                            {ref.ano && <span className={modalStyles.refAno}>({ref.ano})</span>}
                          </div>
                          {ref.link && (
                            <div className={modalStyles.refLink}>
                              <a href={ref.link} target="_blank" rel="noopener noreferrer">
                                Ver referência completa
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Autores específicos desta referência */}
                        {ref.autores_especificos && ref.autores_especificos.length > 0 && (
                          <div className={modalStyles.autoresReferenciaSection}>
                            <h4 className={modalStyles.autoresReferenciaTitle}>Autores</h4>
                            <div className={modalStyles.autoresReferenciaList}>
                              {ref.autores_especificos.map((autor) => (
                                <div key={autor.id_autor} className={modalStyles.autorReferenciaItem}>
                                  <div className={modalStyles.autorNomeOrdem}>
                                    <span className={modalStyles.ordemAutor}>{autor.ordem_autor}.</span>
                                    <strong>{autor.nome_autor}</strong>
                                    {autor.papel !== 'coautor' && (
                                      <span className={modalStyles.papelAutor}>({autor.papel})</span>
                                    )}
                                  </div>
                                  {autor.afiliacao && (
                                    <div className={modalStyles.afiliacaoAutor}>
                                      {autor.afiliacao}
                                      {autor.sigla_afiliacao && ` (${autor.sigla_afiliacao})`}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : selectedPlanta.referencias && selectedPlanta.referencias.length > 0 ? (
                  // Fallback: Mostrar estrutura antiga se nova não estiver disponível
                  <div className={modalStyles.referenciasList}>
                    {selectedPlanta.referencias.map((ref) => (
                      <div key={ref.id_referencia} className={modalStyles.referenciaItem}>
                        <div className={modalStyles.refTitulo}>
                          <strong>{ref.titulo || 'Título não informado'}</strong>
                        </div>
                        <div className={modalStyles.refDetails}>
                          {ref.tipo && <span className={modalStyles.refTipo}>{ref.tipo}</span>}
                          {ref.ano && <span className={modalStyles.refAno}>({ref.ano})</span>}
                        </div>
                        {ref.link && (
                          <div className={modalStyles.refLink}>
                            <a href={ref.link} target="_blank" rel="noopener noreferrer">
                              Ver referência completa
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className={modalStyles.noData}>Nenhuma referência registrada</span>
                )}
              </section>

              {/* ===== ESTATÍSTICAS DA PLANTA ===== */}
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Estatísticas da Planta</h3>
                <div className={modalStyles.readonlyStats}>
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.nomes_comuns.length}</span>
                    <span className={modalStyles.statLabel}>Nomes Comuns</span>
                  </div>
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.provincias.length}</span>
                    <span className={modalStyles.statLabel}>Províncias</span>
                  </div>
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>
                      {selectedPlanta.usos_especificos ? selectedPlanta.usos_especificos.length : selectedPlanta.usos_medicinais.length}
                    </span>
                    <span className={modalStyles.statLabel}>Usos Medicinais</span>
                  </div>
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>{selectedPlanta.autores.length}</span>
                    <span className={modalStyles.statLabel}>Autores</span>
                  </div>
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>
                      {selectedPlanta.referencias_especificas ? selectedPlanta.referencias_especificas.length : selectedPlanta.referencias.length}
                    </span>
                    <span className={modalStyles.statLabel}>Referências</span>
                  </div>
                  {selectedPlanta.compostos && selectedPlanta.compostos.length > 0 && (
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{selectedPlanta.compostos.length}</span>
                      <span className={modalStyles.statLabel}>Compostos</span>
                    </div>
                  )}
                  {selectedPlanta.propriedades && selectedPlanta.propriedades.length > 0 && (
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{selectedPlanta.propriedades.length}</span>
                      <span className={modalStyles.statLabel}>Propriedades</span>
                    </div>
                  )}
                  {selectedPlanta.indicacoes && selectedPlanta.indicacoes.length > 0 && (
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{selectedPlanta.indicacoes.length}</span>
                      <span className={modalStyles.statLabel}>Indicações</span>
                    </div>
                  )}
                  {selectedPlanta.metodos_extracao && selectedPlanta.metodos_extracao.length > 0 && (
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{selectedPlanta.metodos_extracao.length}</span>
                      <span className={modalStyles.statLabel}>Métodos Extracção</span>
                    </div>
                  )}
                  {selectedPlanta.metodos_preparacao && selectedPlanta.metodos_preparacao.length > 0 && (
                    <div className={modalStyles.statItem}>
                      <span className={modalStyles.statNumber}>{selectedPlanta.metodos_preparacao.length}</span>
                      <span className={modalStyles.statLabel}>Métodos Preparação</span>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}

          <div className={modalStyles.modalFooter}>
            <button 
              className={modalStyles.btnSecondary}
              onClick={fecharModal}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estados de carregamento e erro
  if (loading && plantas.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Plantas</h1>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: '3rem',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '2rem',
            height: '2rem',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #9333ea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280' }}>Carregando plantas da base de dados...</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Gerir Plantas</h1>
        </div>
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          color: '#dc2626'
        }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>Erro ao conectar com a API</h3>
          <p style={{ margin: '0 0 1rem 0' }}>{error}</p>
          <button 
            onClick={carregarPlantas}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.25rem',
              cursor: 'pointer'
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerir Plantas</h1>
        <Link href="/admin/plants/add" className={styles.addButton}>
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
          Adicionar Nova Planta
        </Link>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Tipo de pesquisa */}
          <div className={styles.filterItem}>
            <label htmlFor="searchType" className={styles.filterLabel}>
              Tipo de Pesquisa
            </label>
            <select
              id="searchType"
              value={searchType}
              onChange={(e) => {
                setSearchType(e.target.value as SearchType)
                setSearchTerm("")
                setDebouncedSearchTerm("")
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="geral">Pesquisa Geral</option>
              <option value="autor">Por Autor</option>
              <option value="parte_usada">Por Parte Usada</option>
              <option value="indicacao">Por Indicação</option>
              <option value="composto">Por Composto Químico</option>
              <option value="propriedade">Por Propriedade Farmacológica</option>
            </select>
          </div>

          {/* Campo de pesquisa */}
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              {searchType === 'geral' && 'Pesquisar'}
              {searchType === 'autor' && 'Nome do Autor'}
              {searchType === 'parte_usada' && 'Parte da Planta'}
              {searchType === 'indicacao' && 'Uso Medicinal'}
              {searchType === 'composto' && 'Composto Químico'}
              {searchType === 'propriedade' && 'Propriedade Farmacológica'}
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
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
                placeholder={
                  searchType === 'geral' ? 'Nome comum ou científico' :
                  searchType === 'autor' ? 'Ex: Silva, João' :
                  searchType === 'parte_usada' ? 'Ex: folha, raiz, casca' :
                  searchType === 'indicacao' ? 'Ex: diabetes, hipertensão' :
                  searchType === 'composto' ? 'Ex: flavonoides, alcaloides' :
                  searchType === 'propriedade' ? 'Ex: anti-inflamatório, antimicrobiano' : ''
                }
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

          {/* Outros filtros */}
          <div className={styles.filterItem}>
            <label htmlFor="family" className={styles.filterLabel}>Família</label>
            <select
              id="family"
              value={selectedFamily}
              onChange={(e) => {
                setSelectedFamily(e.target.value)
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="">Todas as famílias</option>
              {familias.map((familia) => (
                <option key={familia.id_familia} value={familia.nome_familia}>
                  {formatarFamilia(familia.nome_familia)} ({familia.total_plantas} plantas)
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItem}>
            <label htmlFor="location" className={styles.filterLabel}>Província</label>
            <select
              id="location"
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value)
                setCurrentPage(1)
              }}
              className={styles.select}
            >
              <option value="">Todas as províncias</option>
              {provincias.map((provincia) => (
                <option key={provincia.id_provincia} value={provincia.nome_provincia}>
                  {provincia.nome_provincia} ({provincia.total_plantas} plantas)
                </option>
              ))}
            </select>
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
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
            </select>
          </div>
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={styles.clearButton}
            style={{ marginRight: '0.5rem' }}
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
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            {showAdvancedFilters ? 'Ocultar Filtros' : 'Mais Filtros'}
          </button>
          
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

        {showAdvancedFilters && (
          <div style={{ 
            marginTop: '1rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid #e5e7eb' 
          }}>
            <div className={styles.filterGrid}>
              <div className={styles.filterItem}>
                <label className={styles.filterLabel}>Informações Adicionais</label>
                <div style={{ 
                  fontSize: '0.875rem', 
                  color: '#6b7280',
                  padding: '0.5rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem'
                }}>
                  <strong>Tipos de pesquisa disponíveis:</strong>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1rem' }}>
                    <li><strong>Geral:</strong> Nome comum, científico, família</li>
                    <li><strong>Autor:</strong> Pesquisador ou cientista</li>
                    <li><strong>Parte Usada:</strong> Folha, raiz, casca, etc.</li>
                    <li><strong>Indicação:</strong> Uso medicinal tradicional</li>
                    <li><strong>Composto:</strong> Substância química presente</li>
                    <li><strong>Propriedade:</strong> Ação farmacológica (anti-inflamatório, etc.)</li>
                  </ul>
                  <p style={{ margin: '0.5rem 0 0 0', fontStyle: 'italic' }}>
                    💡 Dica: Combine diferentes tipos de pesquisa com os filtros de família e província para resultados mais precisos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informações de resultados */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0.5rem 0',
        fontSize: '0.875rem',
        color: '#6b7280'
      }}>
        <span>
          {totalPlantas > 0 ? (
            <>
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, totalPlantas)} de {totalPlantas} plantas
              {(debouncedSearchTerm || selectedFamily || selectedLocation) && ` (${searchType === 'geral' ? 'filtradas' : `pesquisa por ${searchType.replace('_', ' ')}`})`}
              {isSearching && (
                <span style={{ color: '#059669', fontWeight: '500', marginLeft: '0.5rem' }}>
                  - actualizando...
                </span>
              )}
            </>
          ) : (
            "Nenhuma planta encontrada"
          )}
        </span>
        <span>Página {currentPage} de {totalPages}</span>
      </div>

      {/* Lista de plantas */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nomes_comuns')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome Popular {sortBy === 'nomes_comuns' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('nome_cientifico')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Nome Científico {sortBy === 'nome_cientifico' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('familia')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Família {sortBy === 'familia' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>Províncias</th>
                <th 
                  className={styles.tableHeaderCell}
                  onClick={() => handleSort('data_adicao')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Data de Adição {sortBy === 'data_adicao' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #9333ea',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Carregando...
                    </div>
                  </td>
                </tr>
              ) : plantas.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    {(debouncedSearchTerm || selectedFamily || selectedLocation) 
                      ? "Nenhuma planta encontrada com os filtros selecionados." 
                      : "Nenhuma planta encontrada na base de dados."
                    }
                  </td>
                </tr>
              ) : (
                plantas.map((planta) => (
                  <tr key={planta.id_planta} className={styles.tableRow} data-plant-id={planta.id_planta}>                    
                    <td className={styles.tableCellName}>
                      {formatarNomesComuns(planta.nomes_comuns)}
                    </td>
                    
                    {/* ===== COLUNA NOME CIENTÍFICO COM INDICADOR DE IMAGENS ===== */}
                    <td className={styles.tableCell}>
                      <div>
                        <em>{planta.nome_cientifico}</em>
                        
                        {/* ===== INDICADOR DE IMAGENS ===== */}
                        {planta.imagens && planta.imagens.length > 0 && (
                          <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            marginLeft: '0.5rem',
                            color: '#10b981',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            📷 
                            <span style={{
                              background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                              color: '#065f46',
                              padding: '0.125rem 0.375rem',
                              borderRadius: '9999px',
                              fontSize: '0.7rem',
                              fontWeight: '600'
                            }}>
                              {planta.imagens.length}
                            </span>
                          </div>
                        )}
                        
                        {/* {planta.numero_exsicata && (
                          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                            Exsicata: {planta.numero_exsicata}
                          </div>
                        )} */}
                      </div>
                    </td>
                    
                    <td className={styles.tableCell}>
                      <strong>{formatarFamilia(planta.familia)}</strong>
                    </td>
                    <td className={styles.tableCell}>
                      {formatarProvincias(planta.provincias)}
                    </td>
                    <td className={styles.tableCell}>
                      {formatarData(planta.data_adicao)}
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        {/* ✅ BOTÃO VER - ABRE MODAL */}
                        <button 
                          onClick={() => handleViewPlanta(planta.id_planta)}
                          className={styles.viewButton}
                          title="Ver detalhes completos"
                        >
                          Ver
                        </button>
                        {/* ✅ BOTÃO EDITAR - AGORA REDIRECIONA PARA PÁGINA */}
                        <Link 
                          href={`/admin/plants/edit/${planta.id_planta}`}
                          className={styles.editButton}
                          title="Editar planta"
                        >
                          Editar
                        </Link>
                        <button 
                          onClick={() => handleDeleteClick(planta.id_planta)}
                          className={styles.deleteButton}
                          title="Excluir planta"
                          disabled={isDeleting}
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

      {/* Paginação */}
      {!loading && plantas.length > 0 && totalPages > 1 && (
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
                <span className={styles.paginationBold}>{Math.min(currentPage * itemsPerPage, totalPlantas)}</span> de{" "}
                <span className={styles.paginationBold}>{totalPlantas}</span> resultados
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

      {/* ✅ MODAL DE VISUALIZAÇÃO - RENDERIZADO CONDICIONALMENTE */}
      <ModalVisualizacao />
      {/* Modal de Confirmação de Exclusão */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        planta={plantaToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}