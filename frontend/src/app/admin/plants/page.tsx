"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import styles from "./plants.module.css"
import modalStyles from "./modal.module.css"
import DeleteConfirmModal from './DeleteConfirmModal'
import PlantImageGallery from '../../components/PlantImageGallery';

// ✅ TIPOS ATUALIZADOS PARA NOVA ESTRUTURA DE BD
interface Planta {
  id_planta: number
  nome_cientifico: string
  familia: string
  infos_adicionais?: string
  data_adicao?: string
  nomes_comuns: string[]
  // ✅ MUDANÇA: provincias é um array de objetos, não strings
  provincias: Array<{
    id_provincia: number
    provincia: string
    local?: string  // opcional, caso venha da API
  }>
  imagens?: Array<{
    id_imagem: number
    nome_arquivo: string
    ordem: number
    legenda?: string
    url: string
    url_armazenamento?: string
    referencia_img?: string
  }>
}

interface PlantaDetalhada {
  id_planta: number
  nome_cientifico: string
  familia: string  // ✅ APENAS STRING - campo TEXT direto
  infos_adicionais?: string
  comp_quimica?: string  // ✅ Campo TEXT
  prop_farmacologica?: string  // ✅ Campo TEXT
  // ❌ REMOVIDO: data_adicao
  
  nomes_comuns: Array<{
    id_nome: number
    nome: string
  }>
  
  // ✅ Locais de colheita (nova estrutura)
  locais?: Array<{
    id_local: number
    nome_local: string
    provincia: string
  }>
  
  // ✅ Províncias (compatibilidade)
  provincias?: Array<{
    id_provincia: number
    provincia: string
  }>
  
  imagens?: Array<{
    id_imagem: number
    nome_arquivo: string
    ordem: number
    legenda?: string
    url: string
    url_armazenamento?: string
    referencia_img?: string
    data_upload?: string
  }>
  
  // ✅ Partes usadas com indicações E MÉTODOS
  partes_usadas?: Array<{
    id_parte: number
    nome_parte: string
    // ✅ CORREÇÃO: Indicações com campos corretos
    indicacoes: Array<{
      id_indicacao: number  // ✅ Usar id_indicacao (não id_uso)
      descricao: string     // ✅ Usar descricao (não descricao_uso)
    }>
    metodos_preparacao?: Array<{
      id_preparacao: number
      descricao: string
    }>
    metodos_extracao?: Array<{
      id_extraccao: number
      descricao: string
    }>
  }>

  // ✅ Para compatibilidade com DeleteConfirmModal
  usos_medicinais: Array<{
    id_uso: number
    parte_usada: string
    observacoes?: string
  }>
  
  autores?: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
    afiliacoes?: Array<{
      nome_afiliacao: string
      sigla_afiliacao?: string
    }>
  }>
  
  referencias?: Array<{
    id_referencia: number
    titulo_referencia?: string
    link_referencia?: string
    ano_publicacao?: string
    autores?: Array<{
      id_autor: number
      nome_autor: string
    }>
  }>

  // ✅ Compatibilidade
  compostos?: Array<any>
  propriedades?: Array<any>
  indicacoes?: Array<any>
  metodos_extracao?: Array<any>
  metodos_preparacao?: Array<any>
}

interface Familia {
  nome_familia: string  // ✅ REMOVIDO id_familia - não é entidade
  total_plantas: number
}

interface Provincia {
  id_provincia: number
  provincia: string  // ✅ MUDOU: era 'nome_provincia'
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

type SearchType = "geral" | "autor" | "parte_usada" | "indicacao"
type SortField = "nome_cientifico" | "familia" | "data_adicao" | "nomes_comuns"
type SortOrder = "asc" | "desc"

// Configuração da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

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

  // Estados para modals
  const [showViewModal, setShowViewModal] = useState<boolean>(false)
  const [selectedPlanta, setSelectedPlanta] = useState<PlantaDetalhada | null>(null)
  const [loadingModal, setLoadingModal] = useState<boolean>(false)

  const [urlProcessed, setUrlProcessed] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false)
  const [plantaToDelete, setPlantaToDelete] = useState<PlantaDetalhada | null>(null)
  const [isDeleting, setIsDeleting] = useState<boolean>(false)

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
        ✨ ${tipo === 'planta' ? 'Planta' : 'Família'} encontrada!
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    let isCancelled = false
    
    const carregarPlantasComDebounce = async () => {
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
    
    return () => {
      isCancelled = true
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm, selectedFamily, selectedLocation, searchType, sortBy, sortOrder])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFamily, selectedLocation, searchType, debouncedSearchTerm])

  useEffect(() => {
    carregarFiltros()
  }, [])

  useEffect(() => {
    const processUrlParams = async () => {
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const urlParams = new URLSearchParams(window.location.search)
      const highlightId = urlParams.get('highlight')
      const pageParam = urlParams.get('page')
      const urlSearchType = urlParams.get('search_type') 
      const urlSearchTerm = urlParams.get('search_term')
      const familiaParam = urlParams.get('familia')
      const highlightFamilia = urlParams.get('highlight_familia')
      
      console.log('🔍 Processando parâmetros da URL:', {
        highlight: highlightId,
        page: pageParam,
        searchType: urlSearchType,
        searchTerm: urlSearchTerm,
        familia: familiaParam,
        highlightFamilia: highlightFamilia
      })
      
      if (familiaParam) {
        console.log(`🏷️ Aplicando filtro de família da URL: "${familiaParam}"`)
        const decodedFamilia = decodeURIComponent(familiaParam)
        
        setSelectedFamily(decodedFamilia)
        await new Promise(resolve => setTimeout(resolve, 50))
        
        if (highlightFamilia === 'true') {
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
          
          setTimeout(() => {
            if (indicator.parentNode) {
              indicator.style.animation = 'slideOutRight 0.3s ease-in'
              setTimeout(() => {
                document.body.removeChild(indicator)
              }, 300)
            }
          }, 4000)
          
          setTimeout(() => {
            const familySelect = document.getElementById('family')
            if (familySelect) {
              familySelect.style.borderColor = '#9333ea'
              familySelect.style.boxShadow = '0 0 0 2px rgba(147, 51, 234, 0.2)'
              familySelect.style.backgroundColor = '#faf5ff'
              
              familySelect.scrollIntoView({ behavior: 'smooth', block: 'center' })
              
              setTimeout(() => {
                familySelect.style.borderColor = ''
                familySelect.style.boxShadow = ''
                familySelect.style.backgroundColor = ''
              }, 3000)
            }
          }, 1000)
        }
      }
      
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
      
      if (pageParam) {
        const pageNumber = parseInt(pageParam, 10)
        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log(`📄 Aplicando página da URL: ${pageNumber}`)
          setCurrentPage(pageNumber)
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
      
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
              }
            }, 2000)
          }
        }, 4000)
        
        return () => clearTimeout(highlightTimeout)
      }
      
      if (highlightId || pageParam || urlSearchType || urlSearchTerm || familiaParam || highlightFamilia) {
        setTimeout(() => {
          console.log('🧹 Limpando URL...')
          window.history.replaceState({}, document.title, window.location.pathname)
        }, 500)
      }
    }
    
    processUrlParams()
  }, [])

  useEffect(() => {
    if (showViewModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }    
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
      
      console.log('📋 Estados atuais:', {
        currentPage,
        itemsPerPage,
        debouncedSearchTerm,
        searchType,
        selectedFamily,
        selectedLocation
      })
      
      if (debouncedSearchTerm) {
        console.log(`🔍 Aplicando busca: "${debouncedSearchTerm}" (tipo: ${searchType})`)
        
        if (searchType === 'geral') {
          params.append('search', debouncedSearchTerm)
        } else {
          endpoint = `${API_BASE_URL}/api/admin/plantas/busca-avancada`
          params.append(searchType, debouncedSearchTerm)
        }
      }
      
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

  const handleDeleteClick = async (plantaId: number): Promise<void> => {
    try {
      console.log(`🔄 Carregando detalhes da planta ${plantaId} para exclusão`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${plantaId}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const plantaDetalhada = normalizarPlantaDetalhada(data)
      
      setPlantaToDelete(plantaDetalhada)
      setShowDeleteModal(true)
      
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes para exclusão:', error)
      alert('Erro ao carregar detalhes da planta. Tente novamente.')
    }
  }

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
      
      setShowDeleteModal(false)
      setPlantaToDelete(null)
      
      await carregarPlantas()
      
      alert('🗑️ Planta excluída com sucesso!')
      
    } catch (error) {
      console.error('❌ Erro ao excluir planta:', error)
      alert(`Erro ao excluir planta: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCloseDeleteModal = (): void => {
    if (!isDeleting) {
      setShowDeleteModal(false)
      setPlantaToDelete(null)
    }
  }

  const carregarDetalhesPlanta = async (id: number): Promise<PlantaDetalhada | null> => {
    try {
      setLoadingModal(true)
      console.log(`🔄 Carregando detalhes da planta ${id}`)
      
      const response = await fetch(`${API_BASE_URL}/api/admin/plantas/${id}`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const plantaNormalizada = normalizarPlantaDetalhada(data)
      console.log('✅ Detalhes carregados:', plantaNormalizada)
      
      return plantaNormalizada
    } catch (err) {
      console.error('❌ Erro ao carregar detalhes:', err)
      alert('Erro ao carregar detalhes da planta')
      return null
    } finally {
      setLoadingModal(false)
    }
  }

  const handleViewPlanta = async (id: number): Promise<void> => {
    const detalhes = await carregarDetalhesPlanta(id)
    if (detalhes) {
      setSelectedPlanta(detalhes)
      setShowViewModal(true)
    }
  }

  const fecharModal = (): void => {
    setShowViewModal(false)
    setSelectedPlanta(null)
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

const formatarProvincias = (provincias: any): string => {
  console.log('🔍 formatarProvincias recebeu:', provincias)
  
  if (!provincias || provincias.length === 0) {
    return 'Não informado'
  }
  
  // Se for array de objetos
  if (Array.isArray(provincias)) {
    if (typeof provincias[0] === 'object' && provincias[0] !== null) {
      // Tenta acessar diferentes campos possíveis
      const resultado = provincias
        .map(p => p.provincia || p.nome_provincia || p.local)
        .filter(Boolean)
        .join(', ')
      
      console.log('✅ Resultado formatado:', resultado)
      return resultado || 'Não informado'
    }
    
    // Se for array de strings
    if (typeof provincias[0] === 'string') {
      return provincias.join(', ')
    }
  }
  
  return 'Não informado'
}

  const formatarFamilia = (familia: string | null | undefined): string => {
    return familia ? familia.toUpperCase() : 'NÃO INFORMADA'
  }

  // ✅ FUNÇÃO HELPER: Normalizar imagens para o formato esperado pelo PlantImageGallery
  const normalizarImagens = (imagens: PlantaDetalhada['imagens']) => {
    if (!imagens || imagens.length === 0) return []
    
    return imagens.map((img, index) => ({
      id_imagem: img.id_imagem,
      nome_arquivo: img.nome_arquivo,
      ordem: img.ordem || index + 1,
      legenda: img.legenda,
      url: img.url || img.url_armazenamento || '',
      referencia_img: img.referencia_img,
      data_upload: img.data_upload
    }))
  }

  // ✅ FUNÇÃO HELPER: Normalizar dados da API para PlantaDetalhada
const normalizarPlantaDetalhada = (data: any): PlantaDetalhada => {
  console.log('📦 Dados recebidos da API:', data)
  
  // Nomes comuns
  const nomes_comuns = (data.nomes_comuns || []).map((nome: string, index: number) => ({
    id_nome: index + 1,
    nome: nome
  }))
  console.log(`✅ ${nomes_comuns.length} nomes comuns processados`)
  
  // Locais
  const locais = (data.locais || []).map((local: any) => ({
    id_local: local.id_local,
    nome_local: local.nome_local,
    provincia: local.provincia
  }))
  console.log(`✅ ${locais.length} locais processados`)
  
  // ✅ FIX: Partes usadas com indicações CORRETAS
const partes_usadas = (data.partes_usadas || []).map((parte: any) => {
  console.log('🌿 Parte usada recebida:', parte)
  console.log('📋 Indicações recebidas:', parte.indicacoes)
  
  return {
    id_parte: parte.id_parte,
    nome_parte: parte.nome_parte,
    // ✅ CORREÇÃO: Mapear corretamente as indicações
    indicacoes: (parte.indicacoes || []).map((ind: any) => {
      console.log('🎯 Indicação individual:', ind)
      return {
        id_indicacao: ind.id_indicacao,  // ✅ Manter id_indicacao
        descricao: ind.descricao          // ✅ Usar 'descricao' diretamente
      }
    }),
    metodos_preparacao: parte.metodos_preparacao || [],
    metodos_extracao: parte.metodos_extracao || []
  }
})
  console.log(`✅ ${partes_usadas.length} partes usadas processadas`)
  
  // Imagens
  const imagens = (data.imagens || []).map((img: any, index: number) => ({
    id_imagem: img.id_imagem,
    nome_arquivo: img.nome_arquivo,
    ordem: img.ordem || index + 1,
    legenda: img.legenda,
    url: img.url || img.url_armazenamento || '',
    url_armazenamento: img.url_armazenamento || img.url,
    referencia_img: img.referencia_img,
    data_upload: img.data_upload
  }))
  
  // Autores
  const autores = (data.autores || []).map((autor: any) => ({
    id_autor: autor.id_autor,
    nome_autor: autor.nome_autor,
    afiliacoes: autor.afiliacoes || []
  }))
  
  // Referências
  const referencias = (data.referencias || []).map((ref: any) => ({
    id_referencia: ref.id_referencia,
    titulo_referencia: ref.titulo_referencia,
    link_referencia: ref.link_referencia,
    ano_publicacao: ref.ano_publicacao,
    autores: ref.autores || []
  }))
  
  // Usos medicinais (compatibilidade)
  const usos_medicinais = data.usos_medicinais || []
  
  const resultado = {
    id_planta: data.id_planta,
    nome_cientifico: data.nome_cientifico,
    familia: data.familia || '',
    infos_adicionais: data.infos_adicionais,
    comp_quimica: data.comp_quimica,
    prop_farmacologica: data.prop_farmacologica,
    nomes_comuns: nomes_comuns,
    locais: locais,
    provincias: data.provincias,
    partes_usadas: partes_usadas,
    imagens: imagens,
    autores: autores,
    referencias: referencias,
    usos_medicinais: usos_medicinais,
    compostos: data.compostos,
    propriedades: data.propriedades,
    indicacoes: data.indicacoes,
    metodos_extracao: data.metodos_extracao,
    metodos_preparacao: data.metodos_preparacao
  }
  
  console.log('✅ Planta normalizada:', {
    nomes_comuns: resultado.nomes_comuns.length,
    locais: resultado.locais.length,
    partes: resultado.partes_usadas.length,
    imagens: resultado.imagens.length
  })
  
  return resultado
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

  // ✅ COMPONENTE: Modal de Visualização - VERSÃO SIMPLIFICADA
// ✅ SUBSTITUIR O COMPONENTE ModalVisualizacao COMPLETO
// Procure por "const ModalVisualizacao = () => {" no seu código e substitua TODO o componente

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
                  <span><strong>{formatarFamilia(selectedPlanta.familia)}</strong></span>
                </div>
                {selectedPlanta.infos_adicionais && (
                  <div className={modalStyles.infoItem}>
                    <label>Informações Adicionais:</label>
                    <span>{selectedPlanta.infos_adicionais}</span>
                  </div>
                )}
              </div>
            </section>

            {/* ===== SEÇÃO DE IMAGENS ===== */}
            {selectedPlanta.imagens && selectedPlanta.imagens.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Imagens da Planta</h3>
                <PlantImageGallery imagens={normalizarImagens(selectedPlanta.imagens)} />
              </section>
            )}

            {/* ===== NOMES COMUNS ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Nomes Comuns</h3>
              <div className={modalStyles.badgesContainer}>
                {selectedPlanta.nomes_comuns && selectedPlanta.nomes_comuns.length > 0 ? (
                  selectedPlanta.nomes_comuns.map((nome, index) => (
                    <span key={index} className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}>
                      {typeof nome === 'string' ? nome : nome.nome}
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
                {selectedPlanta.provincias && selectedPlanta.provincias.length > 0 ? (
                  selectedPlanta.provincias.map((provincia) => (
                    <span 
                      key={provincia.id_provincia} 
                      className={`${modalStyles.badge} ${modalStyles.badgeBlue}`}
                    >
                      {provincia.local} ({provincia.nome_provincia})
                    </span>
                  ))
                ) : (
                  <span className={modalStyles.noData}>Distribuição não informada</span>
                )}
              </div>
            </section>

            {/* ===== COMPOSIÇÃO QUÍMICA (TEXTO) ===== */}
            {selectedPlanta.comp_quimica && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Composição Química</h3>
                <div className={modalStyles.textContent}>
                  <p>{selectedPlanta.comp_quimica}</p>
                </div>
              </section>
            )}

            {/* ===== PROPRIEDADES FARMACOLÓGICAS (TEXTO) ===== */}
            {selectedPlanta.prop_farmacologica && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Propriedades Farmacológicas</h3>
                <div className={modalStyles.textContent}>
                  <p>{selectedPlanta.prop_farmacologica}</p>
                </div>
              </section>
            )}

            {/* ===== PARTES USADAS COM INDICAÇÕES E MÉTODOS ===== */}
{selectedPlanta.partes_usadas && selectedPlanta.partes_usadas.length > 0 && (
  <section className={modalStyles.modalSection}>
    <h3 className={modalStyles.sectionTitle}>Usos Medicinais</h3>
    <div className={modalStyles.partesUsadasList}>
      {selectedPlanta.partes_usadas.map((parte, index) => (
        <div 
          key={parte.id_parte} 
          className={modalStyles.parteUsadaCard}
          style={{
            position: 'relative',
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.25rem',
            marginBottom: index < selectedPlanta.partes_usadas!.length - 1 ? '1.5rem' : '0',
            transition: 'all 0.2s'
          }}
        >
          {/* ✅ Header da parte usada */}
          <div 
            className={modalStyles.parteUsadaHeader}
            style={{
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '2px solid #e5e7eb'
            }}
          >
            <strong style={{ 
              fontSize: '1.1rem', 
              color: '#002856',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {parte.nome_parte}
            </strong>
          </div>
          
          {/* Indicações */}
          {parte.indicacoes && parte.indicacoes.length > 0 && (
            <div className={modalStyles.indicacoesList}>
              <h4 className={modalStyles.indicacoesTitle}>Indicações:</h4>
              <div className={modalStyles.badgesContainer}>
                {parte.indicacoes.map((indicacao, idx) => (
                  <span 
                    key={indicacao.id_indicacao || idx}
                    className={modalStyles.badge}
                  >
                    {indicacao.descricao}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Métodos de Preparação */}
          {parte.metodos_preparacao && parte.metodos_preparacao.length > 0 && (
            <div className={modalStyles.indicacoesList}>
              <h4 className={modalStyles.indicacoesTitle}>Métodos de Preparação:</h4>
              <div className={modalStyles.badgesContainer}>
                {parte.metodos_preparacao.map((metodo, idx) => (
                  <span 
                    key={metodo.id_preparacao || metodo.id_metodo_preparacao || idx}
                    className={`${modalStyles.badge} ${modalStyles.badgeGreen}`}
                  >
                    {metodo.descricao || metodo.descricao_metodo_preparacao}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Métodos de Extração */}
          {parte.metodos_extracao && parte.metodos_extracao.length > 0 && (
            <div className={modalStyles.indicacoesList}>
              <h4 className={modalStyles.indicacoesTitle}>Métodos de Extração:</h4>
              <div className={modalStyles.badgesContainer}>
                {parte.metodos_extracao.map((metodo, idx) => (
                  <span 
                    key={metodo.id_extraccao || metodo.id_metodo_extraccao || idx}
                    className={`${modalStyles.badge} ${modalStyles.badgePurple}`}
                  >
                    {metodo.descricao || metodo.descricao_metodo_extraccao}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </section>
)}

            {/* ===== AUTORES E PESQUISADORES ===== */}
            {selectedPlanta.autores && selectedPlanta.autores.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Autores e Pesquisadores</h3>
                <div className={modalStyles.autoresList}>
                  {selectedPlanta.autores.map((autor) => (
                    <div key={autor.id_autor} className={modalStyles.autorItem}>
                      <div className={modalStyles.autorNome}>
                        <strong>{autor.nome_autor}</strong>
                      </div>
                      {autor.afiliacoes && autor.afiliacoes.length > 0 && (
                        <div className={modalStyles.autorAfiliacao}>
                          {autor.afiliacoes.map((afiliacao, idx) => (
                            <span key={idx}>
                              {afiliacao.nome_afiliacao}
                              {afiliacao.sigla_afiliacao && ` (${afiliacao.sigla_afiliacao})`}
                              {idx < autor.afiliacoes!.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== REFERÊNCIAS BIBLIOGRÁFICAS ===== */}
            {selectedPlanta.referencias && selectedPlanta.referencias.length > 0 && (
              <section className={modalStyles.modalSection}>
                <h3 className={modalStyles.sectionTitle}>Referências Bibliográficas</h3>
                <div className={modalStyles.referenciasList}>
                  {selectedPlanta.referencias.map((ref) => (
                    <div key={ref.id_referencia} className={modalStyles.referenciaItem}>
                      <div className={modalStyles.refTitulo}>
                        <strong>{ref.titulo_referencia || 'Título não informado'}</strong>
                      </div>
                      <div className={modalStyles.refDetails}>
                        {ref.ano_publicacao && (
                          <span className={modalStyles.refAno}>({ref.ano_publicacao})</span>
                        )}
                      </div>
                      {ref.link_referencia && (
                        <div className={modalStyles.refLink}>
                          <a href={ref.link_referencia} target="_blank" rel="noopener noreferrer">
                            Ver referência completa
                          </a>
                        </div>
                      )}
                      {ref.autores && ref.autores.length > 0 && (
                        <div className={modalStyles.autoresReferencia}>
                          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                            Autores: {ref.autores.map(a => a.nome_autor).join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== ESTATÍSTICAS DA PLANTA ===== */}
            <section className={modalStyles.modalSection}>
              <h3 className={modalStyles.sectionTitle}>Estatísticas da Planta</h3>
              <div className={modalStyles.readonlyStats}>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>
                    {selectedPlanta.nomes_comuns?.length || 0}
                  </span>
                  <span className={modalStyles.statLabel}>Nomes Comuns</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>
                    {selectedPlanta.locais?.length || selectedPlanta.provincias?.length || 0}
                  </span>
                  <span className={modalStyles.statLabel}>Locais</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>
                    {selectedPlanta.partes_usadas?.length || 0}
                  </span>
                  <span className={modalStyles.statLabel}>Partes Usadas</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>
                    {selectedPlanta.autores?.length || 0}
                  </span>
                  <span className={modalStyles.statLabel}>Autores</span>
                </div>
                <div className={modalStyles.statItem}>
                  <span className={modalStyles.statNumber}>
                    {selectedPlanta.referencias?.length || 0}
                  </span>
                  <span className={modalStyles.statLabel}>Referências</span>
                </div>
                {selectedPlanta.imagens && selectedPlanta.imagens.length > 0 && (
                  <div className={modalStyles.statItem}>
                    <span className={modalStyles.statNumber}>
                      {selectedPlanta.imagens.length}
                    </span>
                    <span className={modalStyles.statLabel}>Imagens</span>
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
            </select>
          </div>

          {/* Campo de pesquisa */}
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              {searchType === 'geral' && 'Pesquisar'}
              {searchType === 'autor' && 'Nome do Autor'}
              {searchType === 'parte_usada' && 'Parte da Planta'}
              {searchType === 'indicacao' && 'Uso Medicinal'}
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
                  searchType === 'indicacao' ? 'Ex: diabetes, hipertensão' : ''
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
              {familias.map((familia, idx) => (
                <option key={idx} value={familia.nome_familia}>
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
                <option key={provincia.id_provincia} value={provincia.provincia}>
                  {provincia.provincia} ({provincia.total_plantas} plantas)
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
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className={styles.emptyMessage}>
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
                  <td colSpan={4} className={styles.emptyMessage}>
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
                    
                    <td className={styles.tableCell}>
                      <div>
                        <em>{planta.nome_cientifico}</em>
                        
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
                      </div>
                    </td>
                    
                    <td className={styles.tableCell}>
                      <strong>{formatarFamilia(planta.familia)}</strong>
                    </td>
                    
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <button 
                          onClick={() => handleViewPlanta(planta.id_planta)}
                          className={styles.viewButton}
                          title="Ver detalhes completos"
                        >
                          Ver
                        </button>
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

      {/* Modal de Visualização */}
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