"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

// ========================================
// INTERFACES - NOVA BD (SEM numero_exsicata)
// ========================================

// Tipos para os filtros de busca
export interface SearchFilters {
  popularName: string
  scientificName: string
  familia?: string
  parteUsada?: string
  usoTradicional?: string
  provincia?: string
  author?: string
}

// Tipo para os parâmetros da API
export interface ApiSearchParams {
  search_popular?: string
  search_cientifico?: string
  familia?: string
  parte_usada?: string
  indicacao_id?: number
  provincia_id?: number
  autor_id?: number
  page?: number
  per_page?: number
}

// Interface para imagens da planta
// Interface para imagens da planta
export interface PlantImage {
  id_imagem: number
  nome_arquivo: string
  ordem?: number  // ✅ Já está opcional, está correto
  legenda: string  // ✅ REMOVER o ? (não é mais opcional)
  url: string
  data_upload?: string
}

// ✅ Interface da API Flask - NOVA BD
interface ApiPlant {
  id_planta: number
  nome_cientifico: string
  familia: string
  infos_adicionais?: string
  comp_quimica?: string
  prop_farmacologica?: string
  nomes_comuns: string[]
  
  // Províncias com locais
  provincias?: Array<{ 
    id_provincia: number
    nome_provincia: string
    local?: string
  }>
  
  // ✅ Partes usadas COM métodos
  partes_usadas?: Array<{ 
    id_parte: number
    nome_parte: string
    indicacoes?: Array<{ 
      id_indicacao?: number
      id_uso?: number
      descricao: string 
    }>
    metodos_preparacao?: Array<{
      id_preparacao?: number
      id_metodo_preparacao?: number
      descricao?: string
      descricao_metodo_preparacao?: string
    }>
    metodos_extracao?: Array<{
      id_extraccao?: number
      id_metodo_extraccao?: number
      descricao?: string
      descricao_metodo_extraccao?: string
    }>
  }>
  
  // Autores COM afiliações
  autores?: Array<{ 
    id_autor: number
    nome_autor: string
    afiliacao?: string
    sigla_afiliacao?: string
  }>
  
  // Referências COM autores
  referencias?: Array<{ 
    id_referencia: number
    link_referencia?: string
    link?: string
    tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
    titulo_referencia?: string
    titulo?: string
    ano?: string | number
    ano_publicacao?: number
    autores?: Array<{
      id_autor: number
      nome_autor: string
      afiliacao?: string
      sigla_afiliacao?: string
    }>
  }>
  
  // Imagens
  imagens?: Array<{
    id_imagem: number
    nome_arquivo: string
    ordem?: number
    legenda?: string
    url: string
    data_upload?: string
  }>
}

// Interface Plant - FRONTEND
export interface Plant {
  id: number
  nome: string
  familia: string
  nomeCientifico: string
  localColheita: string
  parteUsada: string
  metodoPreparacao: string
  usos: string
  metodoExtracao: string
  composicaoQuimica: string
  propriedadesFarmacologicas: string
  infosAdicionais: string
  afiliacao: string
  referencia: string
  nomes_comuns: string[]
  autores_detalhados: AutorDetalhado[]
  usos_especificos: UsoEspecifico[]
  provincias_detalhadas: ProvinciaDetalhada[]
  referencias_detalhadas: ReferenciaDetalhada[]
  imagens?: PlantImage[]
}

// Interfaces para dados detalhados
export interface AutorDetalhado {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

export interface UsoEspecifico {
  id_uso_planta: number
  id_parte: number
  parte_usada: string
  observacoes?: string
  indicacoes: { id_indicacao: number; descricao: string }[]
  metodos_preparacao: { id_preparacao: number; descricao: string }[]
  metodos_extracao: { id_extraccao: number; descricao: string }[]
}

export interface ProvinciaDetalhada {
  id_provincia: number
  nome_provincia: string
  local?: string
}

export interface ReferenciaDetalhada {
  id_referencia: number
  link_referencia: string
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
  titulo_referencia?: string
  ano?: string | number
  autores?: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
    sigla_afiliacao?: string
  }>
}

// Tipo para o contexto
interface SearchContextType {
  filters: SearchFilters
  setFilters: React.Dispatch<React.SetStateAction<SearchFilters>>
  results: Plant[]
  isLoading: boolean
  hasSearched: boolean
  error: string | null
  performSearch: (customParams?: Partial<ApiSearchParams>) => Promise<void>
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Filtros iniciais
const initialFilters: SearchFilters = {
  popularName: "",
  scientificName: "",
  familia: "",
  parteUsada: "",
  usoTradicional: "",
  provincia: "",
  author: "",
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  const [results, setResults] = useState<Plant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função para processar URLs de imagens
  const processImageUrl = (url: string, plantaId: number): string => {
    if (!url) return ''
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    
    if (url.startsWith('/uploads/')) {
      return `${API_BASE_URL}${url}`
    }
    
    if (!url.startsWith('/')) {
      return `${API_BASE_URL}/uploads/plantas_imagens/${plantaId}/${url}`
    }
    
    return `${API_BASE_URL}${url}`
  }

  // ✅ Função para converter dados da API
  const convertApiPlantToFrontend = (apiPlant: ApiPlant): Plant => {
    console.log("🔄 Convertendo planta:", apiPlant.nome_cientifico, apiPlant)
    

    console.log("🔍 Campos recebidos da API:", {
      comp_quimica: apiPlant.comp_quimica,
      prop_farmacologica: apiPlant.prop_farmacologica,
      infos_adicionais: apiPlant.infos_adicionais,
      partes_usadas_count: apiPlant.partes_usadas?.length || 0
    })

    // Processar autores
    const autores_detalhados: AutorDetalhado[] = apiPlant.autores?.map(a => ({
      id_autor: a.id_autor,
      nome_autor: a.nome_autor,
      afiliacao: a.afiliacao,
      sigla_afiliacao: a.sigla_afiliacao
    })) || []

    // ✅ Processar usos específicos COM métodos
    const usos_especificos: UsoEspecifico[] = apiPlant.partes_usadas?.map(parte => ({
      id_uso_planta: 0,
      id_parte: parte.id_parte,
      parte_usada: parte.nome_parte || '',
      observacoes: undefined,
      
      indicacoes: parte.indicacoes?.map(ind => ({
        id_indicacao: ind.id_indicacao || ind.id_uso || 0,
        descricao: ind.descricao || ''
      })) || [],
      
      metodos_preparacao: parte.metodos_preparacao?.map(mp => ({
        id_preparacao: mp.id_preparacao || mp.id_metodo_preparacao || 0,
        descricao: mp.descricao || mp.descricao_metodo_preparacao || ''
      })) || [],
      
      metodos_extracao: parte.metodos_extracao?.map(me => ({
        id_extraccao: me.id_extraccao || me.id_metodo_extraccao || 0,
        descricao: me.descricao || me.descricao_metodo_extraccao || ''
      })) || []
    })) || []

    // Processar províncias
    const provincias_detalhadas: ProvinciaDetalhada[] = apiPlant.provincias?.map(p => ({
      id_provincia: p.id_provincia,
      nome_provincia: p.nome_provincia || '',
      local: p.local
    })) || []

    // Processar referências
    const referencias_detalhadas: ReferenciaDetalhada[] = apiPlant.referencias?.map(r => ({
      id_referencia: r.id_referencia,
      link_referencia: r.link_referencia || r.link || '',
      tipo_referencia: r.tipo_referencia,
      titulo_referencia: r.titulo_referencia || r.titulo,
      ano: r.ano || r.ano_publicacao,
      autores: r.autores?.map(autor => ({
        id_autor: autor.id_autor,
        nome_autor: autor.nome_autor,
        afiliacao: autor.afiliacao,
        sigla_afiliacao: autor.sigla_afiliacao
      })) || []
    })) || []

    // Processar imagens
    const imagens: PlantImage[] = apiPlant.imagens?.map(img => ({
      id_imagem: img.id_imagem,
      nome_arquivo: img.nome_arquivo,
      ordem: img.ordem ?? 0,  // ✅ Se undefined, usa 0
      legenda: img.legenda || '',  // ✅ Se undefined/null, usa string vazia
      url: processImageUrl(img.url, apiPlant.id_planta),
      data_upload: img.data_upload
    })) || []

    console.log(`📸 Imagens processadas para planta ${apiPlant.id_planta}:`, imagens)

    // Criar strings resumidas
    const autoresStr = autores_detalhados.map(a => {
      let display = a.nome_autor
      if (a.afiliacao) display += ` (${a.afiliacao})`
      if (a.sigla_afiliacao) display += ` [${a.sigla_afiliacao}]`
      return display
    }).join(', ')
    
    const provinciasStr = provincias_detalhadas.map(p => {
      if (p.local) {
        return `${p.nome_provincia} (${p.local})`
      }
      return p.nome_provincia
    }).filter(Boolean).join('; ')
    
    const partesUsadasStr = usos_especificos.map(uso => uso.parte_usada).filter(Boolean).join(', ')
    
    const usosStr = usos_especificos.map(uso => {
      const parteName = uso.parte_usada
      const indicacoes = uso.indicacoes.map(ind => ind.descricao).filter(Boolean)
      
      let texto = parteName
      
      if (indicacoes.length > 0) {
        texto += `: ${indicacoes.join(', ')}`
      }
      
      if (uso.metodos_preparacao && uso.metodos_preparacao.length > 0) {
        const metodos = uso.metodos_preparacao.map(m => m.descricao).filter(Boolean)
        if (metodos.length > 0) {
          texto += ` [Preparação: ${metodos.join(', ')}]`
        }
      }
      
      if (uso.metodos_extracao && uso.metodos_extracao.length > 0) {
        const metodos = uso.metodos_extracao.map(m => m.descricao).filter(Boolean)
        if (metodos.length > 0) {
          texto += ` [Extração: ${metodos.join(', ')}]`
        }
      }
      
      return texto
    }).filter(Boolean).join(' | ')
    
    const nomesComunsStr = apiPlant.nomes_comuns?.join(', ') || ''
    
    const referenciasStr = referencias_detalhadas.map(r => {
      let text = ''
      
      if (r.autores && r.autores.length > 0) {
        const autoresTexto = r.autores.map(autor => {
          let nome = autor.nome_autor
          if (autor.sigla_afiliacao) nome += ` (${autor.sigla_afiliacao})`
          return nome
        }).join('; ')
        text = autoresTexto + '. '
      }
      
      if (r.titulo_referencia && r.titulo_referencia !== r.link_referencia) {
        text += r.titulo_referencia
      } else {
        text += r.link_referencia
      }
      
      if (r.ano) text += ` (${r.ano})`
      if (r.tipo_referencia && r.tipo_referencia !== 'URL') {
        text += ` [${r.tipo_referencia}]`
      }
      
      return text
    }).filter(Boolean).join('; ')
    
    const afiliacaoStr = autores_detalhados[0]?.afiliacao || ''

    const metodosPreparacaoStr = usos_especificos
      .flatMap(uso => uso.metodos_preparacao.map(m => m.descricao))
      .filter(Boolean)
      .join(', ')
    
    const metodosExtracaoStr = usos_especificos
      .flatMap(uso => uso.metodos_extracao.map(m => m.descricao))
      .filter(Boolean)
      .join(', ')

    const result: Plant = {
      id: apiPlant.id_planta,
      nome: nomesComunsStr,
      familia: apiPlant.familia,
      nomeCientifico: apiPlant.nome_cientifico,
      localColheita: provinciasStr,
      parteUsada: partesUsadasStr,
      metodoPreparacao: metodosPreparacaoStr,
      usos: usosStr,
      metodoExtracao: metodosExtracaoStr,
      composicaoQuimica: apiPlant.comp_quimica || '',
      propriedadesFarmacologicas: apiPlant.prop_farmacologica || '',
      infosAdicionais: apiPlant.infos_adicionais || '',
      afiliacao: afiliacaoStr,
      referencia: referenciasStr,
      nomes_comuns: apiPlant.nomes_comuns || [],
      autores_detalhados,
      usos_especificos,
      provincias_detalhadas,
      referencias_detalhadas,
      imagens
    }

    console.log("✅ Resultado da conversão:", result)

    console.log("✅ Resultado da conversão:", result)
    console.log("✅ Verificar campos convertidos:", {
      composicaoQuimica: result.composicaoQuimica,
      propriedadesFarmacologicas: result.propriedadesFarmacologicas,
      infosAdicionais: result.infosAdicionais,
      metodos_prep: result.metodoPreparacao,
      metodos_ext: result.metodoExtracao
    })
    
    return result
  }

  // Função principal de busca
  const performSearch = async (customParams?: Partial<ApiSearchParams>) => {
    console.log("🔍 Iniciando busca com filtros:", filters)
    console.log("🔍 Parâmetros customizados:", customParams)
    
    setIsLoading(true)
    setError(null)
    
    try {
      const searchParams: any = {
        page: 1,
        per_page: 50,
        ...customParams,
      }

      if (!customParams) {
        if (filters.popularName && filters.popularName.trim()) {
          searchParams.search_popular = filters.popularName.trim()
        }
        
        if (filters.scientificName && filters.scientificName.trim()) {
          searchParams.search_cientifico = filters.scientificName.trim()
        }

        if (filters.familia && filters.familia.trim()) {
          searchParams.familia = filters.familia.trim()
        }

        if (filters.parteUsada && filters.parteUsada.trim()) {
          searchParams.parte_usada = filters.parteUsada.trim()
        }
        
        if (filters.usoTradicional && filters.usoTradicional !== "") {
          searchParams.indicacao_id = parseInt(filters.usoTradicional)
        }
        
        if (filters.provincia && filters.provincia !== "") {
          searchParams.provincia_id = parseInt(filters.provincia)
        }
        
        if (filters.author && filters.author !== "") {
          searchParams.autor_id = parseInt(filters.author)
        }
      }

      console.log("📤 Parâmetros finais da busca:", searchParams)

      const url = new URL(`${API_BASE_URL}/api/plantas`)
      
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.append(key, value.toString())
        }
      })

      console.log("🌐 URL da requisição:", url.toString())

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      console.log("📡 Status da resposta:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erro na resposta:", errorText)
        throw new Error(`Erro na busca: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log("📦 Dados recebidos:", data)

      let plantas: any[] = []
      
      if (Array.isArray(data)) {
        plantas = data
      } else if (data.plantas && Array.isArray(data.plantas)) {
        plantas = data.plantas
      } else if (data.items && Array.isArray(data.items)) {
        plantas = data.items
      } else {
        console.warn("⚠️ Estrutura de resposta não reconhecida:", data)
        plantas = []
      }

      // Buscar detalhes completos de cada planta
      const plantsWithDetails = await Promise.all(
        plantas.map(async (plant: any) => {
          try {
            const detailResponse = await fetch(`${API_BASE_URL}/api/plantas/${plant.id_planta}`)
            if (detailResponse.ok) {
              const detailData: ApiPlant = await detailResponse.json()
              return convertApiPlantToFrontend(detailData)
            }
            return convertApiPlantToFrontend(plant)
          } catch (error) {
            console.error('❌ Erro ao buscar detalhes da planta:', error)
            return convertApiPlantToFrontend(plant)
          }
        })
      )
      
      console.log("✅ Resultados transformados:", plantsWithDetails)
      
      setResults(plantsWithDetails)
      setHasSearched(true)
      
    } catch (error) {
      console.error("❌ Erro na busca:", error)
      setError(error instanceof Error ? error.message : "Erro desconhecido na busca")
      setResults([])
      setHasSearched(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Função para limpar a busca
  const clearSearch = () => {
    console.log("🧹 Limpando busca")
    setFilters(initialFilters)
    setResults([])
    setHasSearched(false)
    setError(null)
  }

  const contextValue: SearchContextType = {
    filters,
    setFilters,
    results,
    isLoading,
    hasSearched,
    error,
    performSearch,
    clearSearch,
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
}

// Hook para usar o contexto
export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error("useSearch deve ser usado dentro de um SearchProvider")
  }
  return context
}