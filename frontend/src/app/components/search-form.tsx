"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useSearch } from "@/context/search-context"
import { useLanguage } from "@/context/language-context"
import styles from "./search-form.module.css"

// Tipos baseados na estrutura simplificada
interface Provincia {
  id_provincia: number;
  nome_provincia: string;
}

interface Autor {
  id_autor: number;
  nome_autor: string;
  afiliacao?: string;
  sigla_afiliacao?: string;
}

interface Indicacao {
  id_indicacao: number;
  descricao: string;
}

interface Familia {
  nome_familia: string;
  total_plantas?: number;
}

interface ParteUsada {
  id_parte: number;
  nome_parte: string;
  label?: string;
  value?: string;
}

// URL base da API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Componente de ComboBox com busca
interface ComboBoxProps {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  loading?: boolean
  disabled?: boolean
}

function SearchableComboBox({ 
  id, 
  label, 
  placeholder, 
  value, 
  onChange, 
  options, 
  loading = false, 
  disabled = false 
}: ComboBoxProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const selectedLabel = useMemo(() => {
    if (!value) return ''
    const selectedOption = options.find(opt => opt.value === value)
    return selectedOption ? selectedOption.label : ''
  }, [value, options])

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value
    setSearchTerm(newSearchTerm)
    setHighlightedIndex(-1)
    if (!isOpen) setIsOpen(true)
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true)
        e.preventDefault()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionClick(filteredOptions[highlightedIndex].value)
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputBlur = () => {
    setTimeout(() => setIsOpen(false), 300)
  }

  return (
    <div className={styles.formGroup}>
      <label htmlFor={id} className={styles.formLabel}>
        {label}
      </label>
      <div className={styles.comboBoxContainer}>
        <div className={styles.comboBoxWrapper}>
          <input
            id={id}
            type="text"
            className={`${styles.formInput} ${styles.comboBoxInput}`}
            placeholder={isOpen ? "Digite para filtrar..." : placeholder}
            value={isOpen ? searchTerm : selectedLabel}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            disabled={disabled || loading}
            autoComplete="off"
          />
          <button
            type="button"
            className={styles.comboBoxButton}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled || loading}
            tabIndex={-1}
          >
            <svg
              className={`${styles.comboBoxIcon} ${isOpen ? styles.rotated : ''}`}
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
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
        </div>
        
        {isOpen && (
          <div className={styles.comboBoxDropdown}>
            {loading ? (
              <div className={styles.comboBoxOption}>
                <span className={styles.loadingText}>Carregando...</span>
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className={styles.comboBoxOption}>
                <span className={styles.noResultsText}>
                  {searchTerm ? 'Nenhum resultado encontrado' : 'Nenhuma opção disponível'}
                </span>
              </div>
            ) : (
              <>
                {value && (
                  <button
                    type="button"
                    className={styles.comboBoxOption}
                    onClick={() => handleOptionClick('')}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <span className={styles.clearOptionText}>Limpar seleção</span>
                  </button>
                )}
                {filteredOptions.map((option, index) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.comboBoxOption} ${
                      index === highlightedIndex ? styles.highlighted : ''
                    } ${option.value === value ? styles.selected : ''}`}
                    onClick={() => handleOptionClick(option.value)}
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    {option.label}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function SearchForm() {
  const { filters, setFilters, performSearch, clearSearch, isLoading } = useSearch()
  const { translate } = useLanguage()
  const [isRecordingPopular, setIsRecordingPopular] = useState(false)
  const [isRecordingScientific, setIsRecordingScientific] = useState(false)
  
  // ✅ Estados para validação
  const [validationErrors, setValidationErrors] = useState({
    popularName: '',
    scientificName: ''
  })
  
  // Estados para armazenar dados das comboboxes
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [autores, setAutores] = useState<Autor[]>([])
  const [indicacoes, setIndicacoes] = useState<Indicacao[]>([])
  const [familias, setFamilias] = useState<Familia[]>([])
  const [partesUsadas, setPartesUsadas] = useState<ParteUsada[]>([])
  
  // Estados de loading
  const [loadingProvincias, setLoadingProvincias] = useState(true)
  const [loadingAutores, setLoadingAutores] = useState(true)
  const [loadingIndicacoes, setLoadingIndicacoes] = useState(true)
  const [loadingFamilias, setLoadingFamilias] = useState(true)
  const [loadingPartesUsadas, setLoadingPartesUsadas] = useState(true)
  
  const [error, setError] = useState<string | null>(null)

  // ✅ FUNÇÕES DE VALIDAÇÃO
  const validatePopularName = (value: string): boolean => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, popularName: '' }))
      return true
    }
    
    // Permitir: letras (incluindo acentuadas), espaços, hífens, apóstrofos
    const regex = /^[a-zA-ZÀ-ÿ\s\-']+$/
    
    if (!regex.test(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        popularName: 'Nome popular deve conter apenas letras, espaços e hífens' 
      }))
      return false
    }
    
    if (value.length > 100) {
      setValidationErrors(prev => ({ 
        ...prev, 
        popularName: 'Nome popular deve ter no máximo 100 caracteres' 
      }))
      return false
    }
    
    setValidationErrors(prev => ({ ...prev, popularName: '' }))
    return true
  }
  
  const validateScientificName = (value: string): boolean => {
    if (!value.trim()) {
      setValidationErrors(prev => ({ ...prev, scientificName: '' }))
      return true
    }
    
    // Permitir: letras, espaços, pontos, hífens, × (para híbridos)
    const regex = /^[a-zA-Z\s.\-×]+$/
    
    if (!regex.test(value)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        scientificName: 'Nome científico deve conter apenas letras, espaços, pontos e hífens' 
      }))
      return false
    }
    
    if (value.length > 150) {
      setValidationErrors(prev => ({ 
        ...prev, 
        scientificName: 'Nome científico deve ter no máximo 150 caracteres' 
      }))
      return false
    }
    
    setValidationErrors(prev => ({ ...prev, scientificName: '' }))
    return true
  }

  // Função genérica para fazer requisições
  const fetchData = async <T,>(
    endpoint: string,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    loadingSetter: React.Dispatch<React.SetStateAction<boolean>>,
    entityName: string
  ) => {
    try {
      loadingSetter(true)
      console.log(`Buscando ${entityName} de:`, `${API_BASE_URL}${endpoint}`)
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`${entityName} recebidos:`, data)
        
        if (Array.isArray(data)) {
          setter(data)
        } else {
          console.warn(`Dados de ${entityName} não são um array:`, data)
          setter([])
        }
      } else {
        const errorText = await response.text()
        console.error(`Erro ao buscar ${entityName}:`, errorText)
        throw new Error(`Erro ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error(`Erro na requisição de ${entityName}:`, error)
      setError(`Erro ao carregar ${entityName}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      setter([])
    } finally {
      loadingSetter(false)
    }
  }

  // Função para buscar partes usadas
  const fetchPartesUsadas = async () => {
    try {
      setLoadingPartesUsadas(true)
      console.log('🔍 Buscando partes usadas de:', `${API_BASE_URL}/partes-usadas`)
      
      const response = await fetch(`${API_BASE_URL}/partes-usadas`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Partes usadas recebidas:', data)
        
        if (Array.isArray(data)) {
          setPartesUsadas(data)
        } else {
          console.warn('⚠️ Dados não são array:', data)
          setPartesUsadas([])
        }
      } else {
        const errorText = await response.text()
        console.error('❌ Erro ao buscar partes usadas:', errorText)
        setPartesUsadas([])
      }
    } catch (error) {
      console.error('❌ Erro na requisição:', error)
      setPartesUsadas([])
    } finally {
      setLoadingPartesUsadas(false)
    }
  }

  // Carregar dados quando o componente montar
  useEffect(() => {
    console.log('Componente montado, carregando dados...')
    const loadAllData = async () => {
      setError(null)
      
      const promises = [
        fetchData('/provincias', setProvincias, setLoadingProvincias, 'províncias'),
        fetchData('/autores', setAutores, setLoadingAutores, 'autores'),
        fetchData('/indicacoes', setIndicacoes, setLoadingIndicacoes, 'indicações'),
        fetchData('/familias', setFamilias, setLoadingFamilias, 'famílias'),
        fetchPartesUsadas()
      ]
      
      await Promise.allSettled(promises)
    }
    
    loadAllData()
  }, [])

  // ✅ HANDLE SUBMIT COM VALIDAÇÃO
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar antes de submeter
    const isPopularValid = validatePopularName(filters.popularName || '')
    const isScientificValid = validateScientificName(filters.scientificName || '')
    
    if (!isPopularValid || !isScientificValid) {
      console.log('❌ Validação falhou, não enviando formulário')
      return
    }
    
    // ✅ VERIFICAR SE PELO MENOS UM CAMPO ESTÁ PREENCHIDO
    const hasPopularName = filters.popularName && filters.popularName.trim()
    const hasScientificName = filters.scientificName && filters.scientificName.trim()
    const hasFamilia = filters.familia && filters.familia.trim()
    const hasParteUsada = filters.parteUsada && filters.parteUsada.trim()
    const hasUsoTradicional = filters.usoTradicional && filters.usoTradicional.trim()
    const hasProvincia = filters.provincia && filters.provincia.trim()
    const hasAuthor = filters.author && filters.author.trim()
    
    if (!hasPopularName && !hasScientificName && !hasFamilia && !hasParteUsada && 
        !hasUsoTradicional && !hasProvincia && !hasAuthor) {
      setError('Por favor, preencha pelo menos um campo de pesquisa')
      console.log('❌ Nenhum campo preenchido')
      return
    }
    
    setError(null)
    console.log('✅ Validação passou, enviando formulário:', filters)
    performSearch()
  }

  const handleClear = () => {
    clearSearch()
    setValidationErrors({ popularName: '', scientificName: '' })
  }

  const toggleRecordingPopular = () => {
    setIsRecordingPopular(!isRecordingPopular)
    if (!isRecordingPopular) {
      setTimeout(() => {
        const exemplos = ["Moringa", "Acácia", "Neem", "Baobá"]
        const nomeAleatorio = exemplos[Math.floor(Math.random() * exemplos.length)]
        setFilters((prev) => ({ ...prev, popularName: nomeAleatorio }))
        validatePopularName(nomeAleatorio)
        setIsRecordingPopular(false)
      }, 2000)
    }
  }

  const toggleRecordingScientific = () => {
    setIsRecordingScientific(!isRecordingScientific)
    if (!isRecordingScientific) {
      setTimeout(() => {
        const exemplosCientificos = ["Moringa oleifera", "Strychnos spinosa", "Azadirachta indica"]
        const nomeAleatorio = exemplosCientificos[Math.floor(Math.random() * exemplosCientificos.length)]
        setFilters((prev) => ({ ...prev, scientificName: nomeAleatorio }))
        validateScientificName(nomeAleatorio)
        setIsRecordingScientific(false)
      }, 2000)
    }
  }

  const formatAutorDisplay = (autor: Autor) => {
    let display = autor.nome_autor || `Autor ${autor.id_autor}`
    if (autor.afiliacao && autor.afiliacao.trim()) {
      display += ` (${autor.afiliacao.trim()})`
    }
    if (autor.sigla_afiliacao && autor.sigla_afiliacao.trim()) {
      display += ` [${autor.sigla_afiliacao.trim()}]`
    }
    return display
  }

  // Preparar opções
  const provinciaOptions = useMemo(() => {
    return provincias.map(provincia => ({
      value: provincia.id_provincia.toString(),
      label: provincia.nome_provincia || `Província ${provincia.id_provincia}`
    }))
  }, [provincias])

  const autorOptions = useMemo(() => {
    return autores.map(autor => ({
      value: autor.id_autor.toString(),
      label: formatAutorDisplay(autor)
    }))
  }, [autores])

  const indicacaoOptions = useMemo(() => {
    return indicacoes.map(indicacao => ({
      value: indicacao.id_indicacao.toString(),
      label: indicacao.descricao || `Indicação ${indicacao.id_indicacao}`
    }))
  }, [indicacoes])

  const familiaOptions = useMemo(() => {
    return familias.map(familia => ({
      value: familia.nome_familia,
      label: familia.nome_familia
    }))
  }, [familias])

  const parteUsadaOptions = useMemo(() => {
    if (!Array.isArray(partesUsadas)) {
      console.warn('⚠️ partesUsadas não é array:', partesUsadas)
      return []
    }
    
    return partesUsadas.map(parte => ({
      value: String(parte.id_parte),
      label: parte.nome_parte || parte.label || `Parte ${parte.id_parte}`
    }))
  }, [partesUsadas])

  const retryLoad = () => {
    setError(null)
    fetchData('/provincias', setProvincias, setLoadingProvincias, 'províncias')
    fetchData('/autores', setAutores, setLoadingAutores, 'autores')
    fetchData('/indicacoes', setIndicacoes, setLoadingIndicacoes, 'indicações')
    fetchData('/familias', setFamilias, setLoadingFamilias, 'famílias')
    fetchPartesUsadas()
  }

  return (
    <div className={styles.searchForm}>
      <div className={styles.searchHeader}>
        <h2 className={styles.searchTitle}>{translate("search.title")}</h2>
      </div>
      <div className={styles.searchBody}>
        {error && (
          <div className={styles.errorMessage}>
            <p>⚠️ {error}</p>
            <button onClick={retryLoad} className={styles.retryButton}>
              Tentar Novamente
            </button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Nome Popular COM VALIDAÇÃO */}
          <div className={styles.formGroup}>
            <label htmlFor="nomePopular" className={styles.formLabel}>
              {translate("search.popularName")}
            </label>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                id="nomePopular"
                className={`${styles.formInput} ${validationErrors.popularName ? styles.inputError : ''}`}
                placeholder={translate("search.placeholder.popular")}
                value={filters.popularName || ''}
                onChange={(e) => {
                  const value = e.target.value
                  validatePopularName(value)
                  setFilters((prev) => ({ ...prev, popularName: value }))
                }}
                aria-invalid={!!validationErrors.popularName}
                aria-describedby={validationErrors.popularName ? "popularName-error" : undefined}
              />
              <button
                type="button"
                onClick={toggleRecordingPopular}
                className={`${styles.iconButton} ${isRecordingPopular ? styles.recording : ""}`}
                title="Busca por voz"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" x2="12" y1="19" y2="22"></line>
                </svg>
              </button>
            </div>
            {validationErrors.popularName && (
              <p id="popularName-error" className={styles.errorText}>
                {validationErrors.popularName}
              </p>
            )}
            {isRecordingPopular && (
              <p className={styles.recordingText}>
                <span className={styles.recordingDot}></span>
                {translate("search.recording")}
              </p>
            )}
          </div>

          {/* Nome Científico COM VALIDAÇÃO */}
          <div className={styles.formGroup}>
            <label htmlFor="nomeCientifico" className={styles.formLabel}>
              {translate("search.scientificName")}
            </label>
            <div className={styles.inputWithIcon}>
              <input
                type="text"
                id="nomeCientifico"
                className={`${styles.formInput} ${validationErrors.scientificName ? styles.inputError : ''}`}
                placeholder={translate("search.placeholder.scientific")}
                value={filters.scientificName || ''}
                onChange={(e) => {
                  const value = e.target.value
                  validateScientificName(value)
                  setFilters((prev) => ({ ...prev, scientificName: value }))
                }}
                aria-invalid={!!validationErrors.scientificName}
                aria-describedby={validationErrors.scientificName ? "scientificName-error" : undefined}
              />
            </div>
            {validationErrors.scientificName && (
              <p id="scientificName-error" className={styles.errorText}>
                {validationErrors.scientificName}
              </p>
            )}
            {isRecordingScientific && (
              <p className={styles.recordingText}>
                <span className={styles.recordingDot}></span>
                {translate("search.recording")}
              </p>
            )}
          </div>

          {/* Família Botânica */}
          <SearchableComboBox
            id="familia"
            label="Família Botânica"
            placeholder="Escolha uma família..."
            value={filters.familia || ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, familia: value }))}
            options={familiaOptions}
            loading={loadingFamilias}
          />

          {/* Parte da Planta Usada */}
          <SearchableComboBox
            id="parteUsada"
            label="Parte da Planta Usada"
            placeholder="Escolha uma parte usada..."
            value={filters.parteUsada || ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, parteUsada: value }))}
            options={parteUsadaOptions}
            loading={loadingPartesUsadas}
          />

          {/* Uso Tradicional */}
          <SearchableComboBox
            id="usoTradicional"
            label="Uso Tradicional"
            placeholder="Escolha um uso tradicional..."
            value={filters.usoTradicional || ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, usoTradicional: value }))}
            options={indicacaoOptions}
            loading={loadingIndicacoes}
          />

          {/* Província */}
          <SearchableComboBox
            id="provincia"
            label="Província"
            placeholder="Escolha uma província..."
            value={filters.provincia || ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, provincia: value }))}
            options={provinciaOptions}
            loading={loadingProvincias}
          />

          {/* Autor */}
          <SearchableComboBox
            id="autor"
            label={translate("search.author")}
            placeholder="Escolha um autor..."
            value={filters.author || ''}
            onChange={(value) => setFilters((prev) => ({ ...prev, author: value }))}
            options={autorOptions}
            loading={loadingAutores}
          />

          {/* <p className={styles.helpText}>
            {translate("search.empty")}
          </p> */}

          <div className={styles.formActions}>
            <button type="button" onClick={handleClear} className={styles.clearButton}>
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
                className={styles.buttonIcon}
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              {translate("search.clear")}
            </button>
            <button type="submit" disabled={isLoading} className={styles.searchButton}>
              {isLoading ? (
                <>
                  <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className={styles.spinnerCircle} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {translate("search.searching")}
                </>
              ) : (
                <>
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
                    className={styles.buttonIcon}
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  {translate("search.button")}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}