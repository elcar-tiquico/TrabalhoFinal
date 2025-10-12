"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import styles from "./referencias.module.css"

interface Referencia {
  id_referencia: number
  link_referencia: string
  tipo_referencia?: 'URL' | 'Artigo' | 'Livro' | 'Tese'
  titulo_referencia?: string
  ano?: string
  autores?: Array<{
    id_autor: number
    nome_autor: string
    afiliacao?: string
    sigla_afiliacao?: string
    ordem_autor: number
    papel: 'primeiro' | 'correspondente' | 'coautor'
  }>
}

interface Autor {
  id_autor: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

interface PlantaComReferencias {
  id_planta: number
  nome_cientifico: string
  numero_exsicata?: string
  familia: string
  nomes_comuns: string[]
  referencias: Referencia[]
  autores: Autor[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Funções auxiliares simplificadas
const getTipoIcon = (tipo: string): string => {
  switch (tipo) {
    case 'URL': return '🔗'
    case 'Artigo': return '📄'
    case 'Livro': return '📚'
    case 'Tese': return '🎓'
    default: return '📋'
  }
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

const formatReference = (referencia: Referencia): string => {
  if (referencia.titulo_referencia && referencia.titulo_referencia !== referencia.link_referencia) {
    return referencia.titulo_referencia
  }
  
  const link = referencia.link_referencia
  if (isValidUrl(link)) {
    const url = new URL(link)
    let domain = url.hostname.replace('www.', '')
    
    if (domain.includes('doi.org')) {
      return `DOI: ${url.pathname.substring(1)}`
    } else if (domain.includes('pubmed') || domain.includes('ncbi')) {
      return `PubMed: ${url.pathname}`
    } else if (domain.includes('scielo')) {
      return `SciELO: ${url.pathname}`
    } else {
      return domain
    }
  }
  
  return link
}

const formatAutoresReferencia = (autores: any[]): string => {
  if (!autores || autores.length === 0) return ''
  
  return autores
    .sort((a, b) => a.ordem_autor - b.ordem_autor)
    .map(autor => autor.nome_autor)
    .join(', ')
}

export default function Referencias() {
  const [plantasComReferencias, setPlantasComReferencias] = useState<PlantaComReferencias[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredPlantas, setFilteredPlantas] = useState<PlantaComReferencias[]>([])
  const [filterType, setFilterType] = useState<'all' | 'autor' | 'planta'>('all')
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10) // 10 plantas por página

  useEffect(() => {
    fetchPlantasComReferencias()
  }, [])

  useEffect(() => {
    // Filtrar plantas baseado no termo de busca e tipo de filtro
    if (searchTerm.trim()) {
      const filtered = plantasComReferencias.filter(planta => {
        const searchLower = searchTerm.toLowerCase()
        
        // Buscar no nome científico
        const nomeMatch = planta.nome_cientifico.toLowerCase().includes(searchLower)
        
        // Buscar nos nomes comuns
        const nomeComumMatch = planta.nomes_comuns.some(nome => 
          nome.toLowerCase().includes(searchLower)
        )
        
        // Buscar nos autores
        const autorMatch = planta.autores.some(autor => 
          autor.nome_autor.toLowerCase().includes(searchLower) ||
          (autor.afiliacao && autor.afiliacao.toLowerCase().includes(searchLower)) ||
          (autor.sigla_afiliacao && autor.sigla_afiliacao.toLowerCase().includes(searchLower))
        )
        
        // Aplicar filtro baseado no tipo selecionado
        switch (filterType) {
          case 'autor':
            return autorMatch
          case 'planta':
            return nomeMatch || nomeComumMatch
          case 'all':
          default:
            return nomeMatch || nomeComumMatch || autorMatch
        }
      })
      setFilteredPlantas(filtered)
    } else {
      setFilteredPlantas(plantasComReferencias)
    }
    
    // Reset para primeira página quando filtros mudam
    setCurrentPage(1)
  }, [searchTerm, plantasComReferencias, filterType])

  const fetchPlantasComReferencias = async () => {
    try {
      setLoading(true)
      
      // Usar a nova rota otimizada
      const response = await fetch(`${API_BASE_URL}/plantas-com-referencias?per_page=1000`)
      
      if (!response.ok) {
        // Fallback para o método anterior se a nova rota não existir
        console.warn('Nova rota não disponível, usando método tradicional...')
        await fetchPlantasComReferenciasFallback()
        return
      }
      
      const data = await response.json()
      const plantas = Array.isArray(data.plantas) ? data.plantas : []
      
      // Converter para o formato esperado
      const plantasComReferenciasList: PlantaComReferencias[] = plantas.map((planta: any)=> ({
        id_planta: planta.id_planta,
        nome_cientifico: planta.nome_cientifico,
        numero_exsicata: planta.numero_exsicata,
        familia: planta.familia || 'Família não especificada',
        nomes_comuns: planta.nomes_comuns || [],
        referencias: planta.referencias || [],
        autores: planta.autores || []
      }))
      
      setPlantasComReferencias(plantasComReferenciasList)
    } catch (error) {
      console.error('Erro ao carregar plantas com referências:', error)
      // Tentar método fallback em caso de erro
      await fetchPlantasComReferenciasFallback()
    } finally {
      setLoading(false)
    }
  }

  const fetchPlantasComReferenciasFallback = async () => {
    try {
      // Método original como fallback
      const response = await fetch(`${API_BASE_URL}/plantas?per_page=1000`)
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      const plantas = Array.isArray(data.plantas) ? data.plantas : []
      
      // Filtrar apenas plantas que têm referências e buscar detalhes
      const plantasComReferenciasList: PlantaComReferencias[] = []
      
      for (const planta of plantas) {
        try {
          // Buscar detalhes completos da planta incluindo relacionamentos
          const plantaResponse = await fetch(`${API_BASE_URL}/plantas/${planta.id_planta}`)
          
          if (plantaResponse.ok) {
            const plantaDetalhada = await plantaResponse.json()
            
            // Verificar se a planta tem referências
            if (plantaDetalhada.referencias && plantaDetalhada.referencias.length > 0) {
              const plantaComRef: PlantaComReferencias = {
                id_planta: plantaDetalhada.id_planta,
                nome_cientifico: plantaDetalhada.nome_cientifico,
                numero_exsicata: plantaDetalhada.numero_exsicata,
                familia: plantaDetalhada.familia || 'Família não especificada',
                nomes_comuns: plantaDetalhada.nomes_comuns || [],
                referencias: plantaDetalhada.referencias || [],
                autores: plantaDetalhada.autores || []
              }
              plantasComReferenciasList.push(plantaComRef)
            }
          }
        } catch (plantaError) {
          console.warn(`Erro ao buscar detalhes da planta ${planta.id_planta}:`, plantaError)
        }
      }
      
      // Ordenar por nome científico
      plantasComReferenciasList.sort((a, b) => 
        a.nome_cientifico.localeCompare(b.nome_cientifico)
      )
      
      setPlantasComReferencias(plantasComReferenciasList)
    } catch (error) {
      console.error('Erro ao carregar plantas com referências:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    }
  }

  // Calcular estatísticas
  const totalReferencias = plantasComReferencias.reduce((total, planta) => 
    total + planta.referencias.length, 0
  )

  // Calcular paginação
  const totalPages = Math.ceil(filteredPlantas.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPlantas = filteredPlantas.slice(startIndex, endIndex)

  // Funções de paginação
  const goToPage = (page: number) => {
    setCurrentPage(page)
    // Scroll para o topo da lista
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1)
    }
  }

  // Gerar números de páginas para mostrar
  const getPageNumbers = () => {
    const delta = 2 // Quantas páginas mostrar antes e depois da atual
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <main>
      <Header />
      <div className="container">
        <div className={styles.referenciasContainer}>
          <div className={styles.referenciasHeader}>
            <h1 className={styles.referenciasTitle}>Referências por Plantas</h1>
            <p className={styles.referenciasSubtitle}>
              Fonte científica das informações sobre plantas medicinais de Moçambique, organizadas por espécie
            </p>
          </div>

          <div className={styles.searchSection}>
            <div className={styles.searchControls}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Pesquisar por planta ou autor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
                <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              <div className={styles.filterButtons}>
                <button 
                  className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  Todos
                </button>
                <button 
                  className={`${styles.filterButton} ${filterType === 'planta' ? styles.active : ''}`}
                  onClick={() => setFilterType('planta')}
                >
                  Por Planta
                </button>
                <button 
                  className={`${styles.filterButton} ${filterType === 'autor' ? styles.active : ''}`}
                  onClick={() => setFilterType('autor')}
                >
                  Por Autor
                </button>
              </div>
            </div>
          </div>

          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{plantasComReferencias.length}</div>
              <div className={styles.statLabel}>Plantas com Referências</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{filteredPlantas.length}</div>
              <div className={styles.statLabel}>Resultados Filtrados</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{totalReferencias}</div>
              <div className={styles.statLabel}>Total de Referências</div>
            </div>
          </div>

          {/* Informações de Paginação */}
          {filteredPlantas.length > 0 && (
            <div className={styles.paginationInfo}>
              <p className={styles.paginationText}>
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredPlantas.length)} de {filteredPlantas.length} plantas
                {totalPages > 1 && ` • Página ${currentPage} de ${totalPages}`}
              </p>
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p>⚠️ Erro ao carregar referências: {error}</p>
              <button onClick={fetchPlantasComReferencias} className={styles.retryButton}>
                Tentar Novamente
              </button>
            </div>
          )}

          {loading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Carregando plantas e referências...</p>
            </div>
          ) : (
            <div className={styles.referenciasContent}>
              {filteredPlantas.length === 0 ? (
                <div className={styles.noResults}>
                  <svg className={styles.noResultsIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className={styles.noResultsTitle}>Nenhuma planta encontrada</h3>
                  <p className={styles.noResultsText}>
                    {searchTerm ? 
                      `Não foram encontradas plantas com referências para "${searchTerm}"` : 
                      'Não há plantas com referências disponíveis no momento'
                    }
                  </p>
                </div>
              ) : (
                <div className={styles.plantasList}>
                  {currentPlantas.map((planta, index) => (
                    <div key={planta.id_planta} className={styles.plantaCard}>
                      {/* Cabeçalho da Planta */}
                      <div className={styles.plantaHeader}>
                        <div className={styles.plantaInfo}>
                          <span className={styles.plantaNumber}>#{startIndex + index + 1}</span>
                          <div className={styles.plantaNomes}>
                            <h2 className={styles.plantaCientifico}>{planta.nome_cientifico}</h2>
                            {planta.nomes_comuns.length > 0 && (
                              <p className={styles.plantaComuns}>
                                <strong>Nomes comuns:</strong> {planta.nomes_comuns.join(', ')}
                              </p>
                            )}
                            <p className={styles.plantaFamilia}>
                              <strong>Família:</strong> {planta.familia}
                            </p>
                            {planta.numero_exsicata && (
                              <p className={styles.plantaExsicata}>
                                <strong>Exsicata:</strong> {planta.numero_exsicata}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.plantaContent}>
                        {/* Referências da Planta - VERSÃO SIMPLIFICADA */}
                        <div className={styles.referenciasSection}>
                          <h3 className={styles.sectionTitle}>
                            <svg className={styles.sectionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            Referências ({planta.referencias.length})
                          </h3>
                          <div className={styles.referenciasList}>
                            {planta.referencias
                              .sort((a, b) => {
                                if (a.ano && b.ano) {
                                  return parseInt(b.ano) - parseInt(a.ano)
                                }
                                return 0
                              })
                              .map((referencia, refIndex) => {
                                const isUrl = referencia.tipo_referencia === 'URL' || isValidUrl(referencia.link_referencia)
                                const formattedRef = formatReference(referencia)
                                
                                return (
                                  <div key={referencia.id_referencia} className={styles.referenciaItem}>
                                    <span className={styles.referenciaIcon}>
                                      {getTipoIcon(referencia.tipo_referencia || 'Outros')}
                                    </span>
                                    
                                    <div className={styles.referenciaContent}>
                                      {/* Autores se existirem */}
                                      {referencia.autores && referencia.autores.length > 0 && (
                                        <div className={styles.referenciaAutoresInfo}>
                                          {formatAutoresReferencia(referencia.autores)}
                                        </div>
                                      )}
                                      
                                      {/* Título/Link */}
                                      <div className={styles.referenciaTitle}>
                                        {isUrl ? (
                                          <a 
                                            href={referencia.link_referencia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.referenciaLink}
                                          >
                                            {formattedRef}
                                          </a>
                                        ) : (
                                          formattedRef
                                        )}
                                      </div>
                                      
                                      {/* Fonte original se diferente */}
                                      {referencia.titulo_referencia && 
                                       referencia.titulo_referencia !== referencia.link_referencia && (
                                        <div className={styles.referenciaOriginal}>
                                          <span className={styles.originalLabel}>Fonte:</span>
                                          <span className={styles.originalValue}>{referencia.link_referencia}</span>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Ano */}
                                    {referencia.ano && (
                                      <span className={styles.referenciaYear}>
                                        {referencia.ano}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Controles de Paginação */}
              {totalPages > 1 && (
                <div className={styles.paginationControls}>
                  <button 
                    className={`${styles.paginationButton} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    ← Anterior
                  </button>

                  <div className={styles.paginationNumbers}>
                    {getPageNumbers().map((pageNum, index) => (
                      <button
                        key={index}
                        className={`${styles.paginationNumber} ${
                          pageNum === currentPage ? styles.active : ''
                        } ${pageNum === '...' ? styles.dots : ''}`}
                        onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
                        disabled={pageNum === '...'}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>

                  <button 
                    className={`${styles.paginationButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    Próxima →
                  </button>
                </div>
              )}
            </div>
          )}

          <div className={styles.infoSection}>
            <h2 className={styles.infoTitle}>Sobre as Referências por Plantas</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Organização por Espécie</h3>
                <p className={styles.infoCardText}>
                  As referências estão organizadas por planta, facilitando a consulta de todas as 
                  fontes científicas relacionadas a uma espécie específica.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Autores Associados</h3>
                <p className={styles.infoCardText}>
                  Cada planta mostra os autores responsáveis pela investigação.
                </p>
              </div>
              <div className={styles.infoCard}>
                <h3 className={styles.infoCardTitle}>Fontes Verificadas</h3>
                <p className={styles.infoCardText}>
                  Todas as referências foram validadas e organizadas para garantir o acesso 
                  directo às fontes primárias de informação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}