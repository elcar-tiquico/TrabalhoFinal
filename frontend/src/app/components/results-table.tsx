"use client"

import { useState, useRef, useEffect } from "react"
import { useSearch } from "@/context/search-context"
import { PlantDetails } from "@/components/plant-details"
import { useLanguage } from "@/context/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import styles from "./results-table.module.css"

// Interfaces para tipagem
interface Autor {
  id_autor?: number
  nome_autor: string
  afiliacao?: string
  sigla_afiliacao?: string
}

interface Plant {
  id: number
  nome?: string
  nomes_comuns?: string[]
  familia?: string
  nomeCientifico: string
  afiliacao?: string
  autores_detalhados?: Autor[]
}

interface TooltipPosition {
  top: boolean
  bottom: boolean
  left: boolean
  right: boolean
}

// Componente para tooltip de autores com posicionamento dinâmico
function AuthorTooltip({ plant }: { plant: Plant }) {
  const [showTooltip, setShowTooltip] = useState<boolean>(false)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    top: false,
    left: false,
    right: false,
    bottom: false
  })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  // Extrair autores dos dados
  const autores = plant.autores_detalhados || []
  
  // Função para calcular a melhor posição do tooltip
  const calculateTooltipPosition = () => {
    if (!buttonRef.current || !showTooltip) return
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Espaços disponíveis
    const spaceAbove = buttonRect.top
    const spaceBelow = viewportHeight - buttonRect.bottom
    const spaceLeft = buttonRect.left
    const spaceRight = viewportWidth - buttonRect.right
    
    // Dimensões do tooltip
    const tooltipWidth = Math.min(288, viewportWidth - 32) // 18rem = 288px, com margem
    const tooltipHeight = 200 // altura estimada
    
    const newPosition = {
      top: false,
      bottom: false,
      left: false,
      right: false
    }
    
    // Decidir posição vertical
    if (spaceAbove >= tooltipHeight + 16) {
      newPosition.top = true
    } else {
      newPosition.bottom = true
    }
    
    // Decidir posição horizontal
    if (spaceRight >= tooltipWidth) {
      newPosition.left = true
    } else if (spaceLeft >= tooltipWidth) {
      newPosition.right = true
    } else {
      // Se não couber nem à esquerda nem à direita, centralizar
      newPosition.left = true
    }
    
    setTooltipPosition(newPosition)
  }
  
  useEffect(() => {
    if (showTooltip) {
      // Pequeno delay para garantir que o tooltip foi renderizado
      const timer = setTimeout(calculateTooltipPosition, 10)
      return () => clearTimeout(timer)
    }
  }, [showTooltip])
  
  // Recalcular posição quando a janela redimensionar
  useEffect(() => {
    if (showTooltip) {
      const handleResize = () => calculateTooltipPosition()
      const handleScroll = () => calculateTooltipPosition()
      
      window.addEventListener('resize', handleResize)
      window.addEventListener('scroll', handleScroll, true)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('scroll', handleScroll, true)
      }
    }
  }, [showTooltip])
  
  if (autores.length === 0) {
    return <span className={styles.authorInfo}>{plant.afiliacao}</span>
  }

  const getTooltipStyle = () => {
    if (!buttonRef.current || !showTooltip) {
      return {
        position: 'fixed' as const,
        zIndex: 1000,
        width: 'min(18rem, calc(100vw - 2rem))',
        maxWidth: '18rem',
        maxHeight: '20rem',
        overflowY: 'auto' as const
      }
    }
    
    const buttonRect = buttonRef.current.getBoundingClientRect()
    const style: any = {
      position: 'fixed' as const,
      zIndex: 1000,
      width: 'min(18rem, calc(100vw - 2rem))',
      maxWidth: '18rem',
      maxHeight: '20rem',
      overflowY: 'auto' as const
    }
    
    // Posicionamento vertical
    if (tooltipPosition.top) {
      style.bottom = `calc(100vh - ${buttonRect.top}px + 0.5rem)`
    } else {
      style.top = `calc(${buttonRect.bottom}px + 0.5rem)`
    }
    
    // Posicionamento horizontal
    if (tooltipPosition.right) {
      style.right = `calc(100vw - ${buttonRect.right}px)`
    } else {
      style.left = `${Math.max(16, buttonRect.left)}px` // Mínimo de 16px da borda
    }
    
    return style
  }

  const handleButtonBlur = (e: any) => {
    // Só fecha se o foco não for para o tooltip
    if (!tooltipRef.current?.contains(e.relatedTarget)) {
      setShowTooltip(false)
    }
  }

  const handleButtonClick = () => {
    setShowTooltip(!showTooltip)
  }

  const handleMouseEnter = () => {
    setShowTooltip(true)
  }

  const handleMouseLeave = () => {
    setShowTooltip(false)
  }

  return (
    <div className={styles.authorTooltipContainer}>
      <button
        ref={buttonRef}
        className={styles.authorButton}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleButtonClick}
        onFocus={handleMouseEnter}
        onBlur={handleButtonBlur}
        aria-expanded={showTooltip}
        aria-haspopup="true"
        type="button"
      >
        👥 Autores
      </button>
      
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={styles.authorTooltip}
          style={getTooltipStyle()}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="tooltip"
          tabIndex={-1}
        >
          <div className={styles.tooltipTitle}>Autores e Afiliações:</div>
          <div className={styles.authorsList}>
            {autores.map((autor: any, index: number) => (
              <div key={autor.id_autor || index} className={styles.authorItem}>
                <div className={styles.authorName}>{autor.nome_autor}</div>
                {autor.afiliacao && (
                  <div className={styles.authorAffiliation}>
                    🏛️ {autor.afiliacao}
                    {autor.sigla_afiliacao && (
                      <span className={styles.authorSigla}> ({autor.sigla_afiliacao})</span>
                    )}
                  </div>
                )}
                {index < autores.length - 1 && <div className={styles.authorDivider}></div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function ResultsTable() {
  const { results, isLoading, hasSearched } = useSearch()
  const { translate } = useLanguage()
  const [selectedPlant, setSelectedPlant] = useState<number | null>(null)

  const toggleDetails = (id: number) => {
    setSelectedPlant(selectedPlant === id ? null : id)
  }

  const handleToggleClick = (e: any, id: number) => {
    e.stopPropagation()
    toggleDetails(id)
  }

  const handleHeaderClick = (id: number) => {
    toggleDetails(id)
  }

  // Estado de carregamento
  if (isLoading) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.loadingState}>
          <div className={styles.loadingIcon}>
            <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle
                className={styles.spinnerCircle}
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className={styles.spinnerPath}
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
          <h3 className={styles.loadingTitle}>{translate("results.searching")}</h3>
          <p className={styles.loadingText}>
            Consultando a nossa base de dados... Isso pode levar alguns instantes.
          </p>
        </div>
      </div>
    )
  }

  // Nenhuma busca realizada ainda
  if (!hasSearched) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
          </div>
          <h3 className={styles.emptyTitle}>{translate("results.searchPrompt")}</h3>
          <p className={styles.emptyText}>
            Use o formulário ao lado para pesquisar informações sobre plantas medicinais de Moçambique.
          </p>
        </div>
      </div>
    )
  }

  // Nenhum resultado encontrado
  if (results.length === 0) {
    return (
      <div className={styles.resultsCard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
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
          </div>
          <h3 className={styles.emptyTitle}>{translate("results.noResults")}</h3>
          <p className={styles.emptyText}>{translate("results.tryAgain")}</p>
        </div>
      </div>
    )
  }

  // Resultados encontrados
  return (
    <div className={styles.resultsCard}>
      <div className={styles.resultsHeader}>
        <h2 className={styles.resultsTitle}>{translate("results.title")}</h2>
        <div className={styles.resultsActions}>
          <span className={styles.resultsCount}>
            {results.length} {results.length === 1 ? translate("results.found") : translate("results.found_plural")}
          </span>
          <LanguageSwitcher />
        </div>
      </div>

      <div className={styles.resultsList}>
        {results.map((plant: any) => (
          <div key={plant.id} className={styles.resultItem}>
            <div 
              className={styles.resultItemHeader} 
              onClick={() => handleHeaderClick(plant.id)}
            >
              <div className={styles.resultItemInfo}>
                {/* Nomes populares (normal) */}
                <h3 className={styles.resultItemTitle}>
                  {plant.nomes_comuns?.join(' • ') || plant.nome}
                </h3>
                
                {/* Família (MAIÚSCULAS) */}
                <p className={styles.resultItemFamily}>{plant.familia?.toUpperCase()}</p>
                
                {/* Nome científico (itálico) */}
                <p className={styles.resultItemScientific}>
                  <em>{plant.nomeCientifico}</em>
                </p>
                
                {/* Tooltip de autores */}
                <div className={styles.authorSection}>
                  <AuthorTooltip plant={plant} />
                </div>
              </div>

              <div className={styles.resultItemActions}>
                <button
                  className={styles.toggleButton}
                  onClick={(e) => handleToggleClick(e, plant.id)}
                  type="button"
                  aria-label={selectedPlant === plant.id ? "Fechar detalhes" : "Ver detalhes"}
                >
                  {selectedPlant === plant.id ? (
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
                      aria-hidden="true"
                    >
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
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
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {selectedPlant === plant.id && <PlantDetails plant={plant} />}
          </div>
        ))}
      </div>
    </div>
  )
}