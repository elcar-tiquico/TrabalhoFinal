"use client"

import { useState } from "react"
import Link from "next/link"
import styles from "./languages.module.css"

// Dados simulados de idiomas
const idiomasIniciais = [
  {
    id: "pt",
    nome: "Português",
    nativo: "Português",
    codigo: "pt",
    flag: "Mz",
    ativo: true,
    padrao: true,
    termosTraduzidos: 245,
    totalTermos: 245,
    porcentagem: 100,
    palavrasDicionario: 0, // Novo campo para palavras no dicionário
  },
  {
    id: "xangana",
    nome: "Xangana",
    nativo: "Xangana",
    codigo: "xangana",
    flag: "🇲🇿",
    ativo: true,
    padrao: false,
    termosTraduzidos: 187,
    totalTermos: 245,
    porcentagem: 76,
    palavrasDicionario: 10, // Novo campo para palavras no dicionário
  },
  {
    id: "xopeee",
    nome: "Xopeee",
    nativo: "Xopeee",
    codigo: "xopeee",
    flag: "🇲🇿",
    ativo: true,
    padrao: false,
    termosTraduzidos: 156,
    totalTermos: 245,
    porcentagem: 64,
    palavrasDicionario: 3, // Novo campo para palavras no dicionário
  },
  {
    id: "macua",
    nome: "Macua",
    nativo: "Emakhuwa",
    codigo: "macua",
    flag: "🇲🇿",
    ativo: true,
    padrao: false,
    termosTraduzidos: 78,
    totalTermos: 245,
    porcentagem: 32,
    palavrasDicionario: 0, // Novo campo para palavras no dicionário
  },
  {
    id: "en",
    nome: "Inglês",
    nativo: "English",
    codigo: "en",
    flag: "🇺🇸",
    ativo: false,
    padrao: false,
    termosTraduzidos: 0,
    totalTermos: 245,
    porcentagem: 0,
    palavrasDicionario: 0, // Novo campo para palavras no dicionário
  },
]

export default function LanguagesPage() {
  const [idiomas, setIdiomas] = useState(idiomasIniciais)
  const [searchTerm, setSearchTerm] = useState("")
  const [showInactive, setShowInactive] = useState(false)

  // Filtrar idiomas com base nos critérios de pesquisa
  const filteredIdiomas = idiomas.filter((idioma) => {
    const matchesSearch =
      searchTerm === "" ||
      idioma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idioma.nativo.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = showInactive ? true : idioma.ativo

    return matchesSearch && matchesStatus
  })

  // Função para alternar o status ativo de um idioma
  const toggleStatus = (id: string) => {
    setIdiomas(
      idiomas.map((idioma) => {
        if (idioma.id === id) {
          return { ...idioma, ativo: !idioma.ativo }
        }
        return idioma
      }),
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gerenciar Idiomas</h1>
        <Link href="/admin/languages/add" className={styles.addButton}>
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
          Adicionar Novo Idioma
        </Link>
      </div>

      {/* Filtros */}
      <div className={styles.filterCard}>
        <div className={styles.filterGrid}>
          {/* Pesquisa por nome */}
          <div className={styles.filterItem}>
            <label htmlFor="search" className={styles.filterLabel}>
              Pesquisar
            </label>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                name="search"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
                placeholder="Nome do idioma"
              />
              <div className={styles.searchIcon}>
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
              </div>
            </div>
          </div>

          {/* Mostrar inativos */}
          <div className={styles.filterItemCheckbox}>
            <div className={styles.checkboxContainer}>
              <input
                id="show-inactive"
                name="show-inactive"
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="show-inactive" className={styles.checkboxLabel}>
                Mostrar idiomas inativos
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de idiomas */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Idioma</th>
                <th className={styles.tableHeaderCell}>Código</th>
                <th className={styles.tableHeaderCell}>Status</th>
                <th className={styles.tableHeaderCell}>Progresso</th>
                <th className={styles.tableHeaderCell}>Dicionário</th>
                <th className={styles.tableHeaderCell}>
                  <span className={styles.srOnly}>Ações</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIdiomas.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.emptyMessage}>
                    Nenhum idioma encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredIdiomas.map((idioma) => (
                  <tr key={idioma.id} className={`${styles.tableRow} ${!idioma.ativo ? styles.inactiveRow : ""}`}>
                    <td className={styles.tableCellLanguage}>
                      <div className={styles.languageInfo}>
                        <div className={styles.flagContainer}>{idioma.flag}</div>
                        <div className={styles.languageNames}>
                          <div className={styles.languageName}>{idioma.nome}</div>
                          <div className={styles.languageNative}>{idioma.nativo}</div>
                        </div>
                        {idioma.padrao && <span className={styles.defaultBadge}>Padrão</span>}
                      </div>
                    </td>
                    <td className={styles.tableCell}>{idioma.codigo}</td>
                    <td className={styles.tableCell}>
                      <span
                        className={`${styles.statusBadge} ${idioma.ativo ? styles.activeBadge : styles.inactiveBadge}`}
                      >
                        {idioma.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.progressContainer}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${idioma.porcentagem}%` }}></div>
                        </div>
                        <span className={styles.progressText}>{idioma.porcentagem}%</span>
                      </div>
                      <div className={styles.progressDetails}>
                        {idioma.termosTraduzidos} de {idioma.totalTermos} termos
                      </div>
                    </td>
                    <td className={styles.tableCell}>
                      <div className={styles.dictionaryInfo}>
                        <div className={styles.dictionaryCount}>{idioma.palavrasDicionario} palavras</div>
                        <Link href={`/admin/languages/dictionary/${idioma.id}`} className={styles.dictionaryLink}>
                          Gerenciar dicionário
                        </Link>
                      </div>
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        <Link href={`/admin/languages/${idioma.id}/translate`} className={styles.translateButton}>
                          Traduzir
                        </Link>
                        <Link href={`/admin/languages/${idioma.id}/edit`} className={styles.editButton}>
                          Editar
                        </Link>
                        <button
                          onClick={() => toggleStatus(idioma.id)}
                          className={idioma.ativo ? styles.deactivateButton : styles.activateButton}
                        >
                          {idioma.ativo ? "Desativar" : "Ativar"}
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
    </div>
  )
}
