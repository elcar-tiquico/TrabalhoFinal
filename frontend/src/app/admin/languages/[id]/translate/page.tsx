"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import styles from "./translate.module.css"

// Dados simulados de traduções
const traducoes = {
  xangana: {
    "search.title": "Lavisisa Svirimbyani",
    "search.popularName": "Vito ra ndhavuko",
    "search.scientificName": "Vito ra sayense",
    "search.traditionalUse": "Matirhiselo ya ndhavuko",
    "search.author": "Mutsari",
    "search.location": "Ndhawu yo kuma",
    "search.button": "Lavisisa",
    "search.clear": "Basisa",
    "search.recording": "Ku rhekoda... Vula vito ra swimbyani",
    "search.placeholder.popular": "Xik: Carqueja, Samambaia...",
    "search.placeholder.scientific": "Xik: Baccharis trimera...",
    "search.placeholder.author": "Xik: Silva, Oliveira...",
    "search.empty": "Siya swiphemu leswi nga riki na nchumu ku lavisisa database hinkwayo",
    "results.title": "Mbuyelo",
    "results.found": "swimbyani leswi kumiweke",
    "results.found_plural": "swimbyani leswi kumiweke",
    "results.download": "Koxela",
    "results.read": "Hlaya",
    "results.searching": "Ku lavisisa swimbyani...",
    "results.searchPrompt": "Lavisisa swimbyani swa mirhi",
    "results.noResults": "Ku hava mbuyelo lowu kumiweke",
    "results.tryAgain":
      "Ringeta marito man'wana yo lavisisa kumbe susa swihambanyisi swin'wana ku ndlandlamuxa mbuyelo.",
    "details.downloadArticle": "Koxela atikili",
    "details.readArticle": "Hlaya atikili",
    "details.moreDetails": "Vona vuxokoxoko byo tala",
    "details.info": "Vuxokoxoko bya Vutivi",
    "plant.family": "Ndyangu",
    "plant.commonName": "Vito ra ntolovelo",
    "plant.location": "Ndhawu yo kuma",
    "plant.specimenNumber": "Nomboro ya Excicata",
    "plant.partUsed": "Xiphemu xa swimbyani lexi tirhisiwaka",
    "plant.preparation": "Ndlela yo Lulamisa (ndhavuko)",
    "plant.uses": "Matirhiselo/Swikombiso",
    "plant.extraction": "Ndlela yo humesa",
    "plant.composition": "Vumbekelo bya Khemikali",
    "plant.properties": "Swihlawulekisi swa Farmakologiki",
    "plant.affiliation": "Vuhlanganisi bya vatsari",
    "plant.reference": "Xikombo",
  },
  xopeee: {
    "search.title": "Pesquisa Plantas",
    "search.popularName": "Nome popular",
    "search.scientificName": "Nome científico",
    "search.traditionalUse": "Uso tradicional",
    "search.author": "Autor",
    "search.location": "Local de observação",
    "search.button": "Consultar",
    "search.clear": "Limpar",
    "search.recording": "Gravando... Fale o nome da planta",
    "search.placeholder.popular": "Ex: Carqueja, Samambaia...",
    "search.placeholder.scientific": "Ex: Baccharis trimera...",
    "search.placeholder.author": "Ex: Silva, Oliveira...",
    "search.empty": "Deixe os filtros em branco para consultar todo nosso banco de dados",
    "results.title": "Resultados",
    "results.found": "planta encontrada",
    "results.found_plural": "plantas encontradas",
    "results.download": "Baixar",
    "results.read": "Ler",
    "results.searching": "Buscando plantas...",
    "results.searchPrompt": "Pesquise plantas medicinais",
    "results.noResults": "Nenhum resultado encontrado",
    "results.tryAgain": "Tente outros termos de busca ou remova alguns filtros para ampliar os resultados.",
    "details.downloadArticle": "Baixar artigo",
    "details.readArticle": "Ler artigo",
    "details.moreDetails": "Ver mais detalhes",
    "details.info": "Informações Detalhadas",
    "plant.family": "Família",
    "plant.commonName": "Nome comum/Vernacular",
    "plant.location": "Local de colheita",
    "plant.specimenNumber": "Número da Excicata",
    "plant.partUsed": "Parte da planta usada",
    "plant.preparation": "Método de Preparação (tradicional)",
    "plant.uses": "Usos/Indicações",
    "plant.extraction": "Método de extração",
    "plant.composition": "Composição Química",
    "plant.properties": "Propriedades Farmacológicas",
    "plant.affiliation": "Afiliação dos autores",
    "plant.reference": "Referência",
  },
}

// Dados originais em português
const originais = {
  "search.title": "Pesquisar Plantas",
  "search.popularName": "Nome popular",
  "search.scientificName": "Nome científico",
  "search.traditionalUse": "Uso tradicional",
  "search.author": "Autor",
  "search.location": "Local de observação",
  "search.button": "Consultar",
  "search.clear": "Limpar",
  "search.recording": "Gravando... Fale o nome da planta",
  "search.placeholder.popular": "Ex: Carqueja, Samambaia...",
  "search.placeholder.scientific": "Ex: Baccharis trimera...",
  "search.placeholder.author": "Ex: Silva, Oliveira...",
  "search.empty": "Deixe os filtros em branco para consultar todo nosso banco de dados",
  "results.title": "Resultados",
  "results.found": "planta encontrada",
  "results.found_plural": "plantas encontradas",
  "results.download": "Baixar",
  "results.read": "Ler",
  "results.searching": "Buscando plantas...",
  "results.searchPrompt": "Pesquise plantas medicinais",
  "results.noResults": "Nenhum resultado encontrado",
  "results.tryAgain": "Tente outros termos de busca ou remova alguns filtros para ampliar os resultados.",
  "details.downloadArticle": "Baixar artigo",
  "details.readArticle": "Ler artigo",
  "details.moreDetails": "Ver mais detalhes",
  "details.info": "Informações Detalhadas",
  "plant.family": "Família",
  "plant.commonName": "Nome comum/Vernacular",
  "plant.location": "Local de colheita",
  "plant.specimenNumber": "Número da Excicata",
  "plant.partUsed": "Parte da planta usada",
  "plant.preparation": "Método de Preparação (tradicional)",
  "plant.uses": "Usos/Indicações",
  "plant.extraction": "Método de extração",
  "plant.composition": "Composição Química",
  "plant.properties": "Propriedades Farmacológicas",
  "plant.affiliation": "Afiliação dos autores",
  "plant.reference": "Referência",
}

// Dados dos idiomas
const idiomas = {
  xangana: {
    id: "xangana",
    nome: "Xangana",
    nativo: "Xangana",
    codigo: "xangana",
    flag: "🇲🇿",
  },
  xopeee: {
    id: "xopeee",
    nome: "Xopeee",
    nativo: "Xopeee",
    codigo: "xopeee",
    flag: "🇲🇿",
  },
}

export default function TranslateLanguagePage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const languageId = id as string

  const [idioma, setIdioma] = useState<any>(null)
  const [traducao, setTraducao] = useState<Record<string, string>>({})
  const [filtro, setFiltro] = useState("")
  const [categoria, setCategoria] = useState("all")
  const [apenasNaoTraduzidos, setApenasNaoTraduzidos] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagemSucesso, setMensagemSucesso] = useState("")

  // Carregar dados do idioma e traduções
  useEffect(() => {
    if (languageId && (languageId === "xangana" || languageId === "xopeee")) {
      setIdioma(idiomas[languageId])
      setTraducao(traducoes[languageId] || {})
    } else {
      router.push("/admin/languages")
    }
  }, [languageId, router])

  if (!idioma) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingContent}>
          <svg className={styles.loadingSpinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle
              className={styles.loadingCircle}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className={styles.loadingPath}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className={styles.loadingText}>Carregando...</p>
        </div>
      </div>
    )
  }

  // Filtrar as chaves de tradução
  const filtrarChaves = () => {
    let chaves = Object.keys(originais)

    // Filtrar por texto
    if (filtro) {
      chaves = chaves.filter(
        (chave) =>
          chave.toLowerCase().includes(filtro.toLowerCase()) ||
          originais[chave as keyof typeof originais].toLowerCase().includes(filtro.toLowerCase()) ||
          (traducao[chave] && traducao[chave].toLowerCase().includes(filtro.toLowerCase())),
      )
    }

    // Filtrar por categoria
    if (categoria !== "all") {
      chaves = chaves.filter((chave) => chave.startsWith(categoria))
    }

    // Filtrar apenas não traduzidos
    if (apenasNaoTraduzidos) {
      chaves = chaves.filter((chave) => !traducao[chave] || traducao[chave] === "")
    }

    return chaves
  }

  // Atualizar uma tradução
  const atualizarTraducao = (chave: string, valor: string) => {
    setTraducao((prev) => ({ ...prev, [chave]: valor }))
  }

  // Salvar traduções
  const salvarTraducoes = async () => {
    setSalvando(true)

    try {
      // Simulação de envio para API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulação de sucesso
      setMensagemSucesso("Traduções salvas com sucesso!")

      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setMensagemSucesso("")
      }, 3000)
    } catch (error) {
      console.error("Erro ao salvar traduções:", error)
    } finally {
      setSalvando(false)
    }
  }

  // Categorias disponíveis
  const categorias = [
    { id: "all", nome: "Todas as categorias" },
    { id: "search.", nome: "Pesquisa" },
    { id: "results.", nome: "Resultados" },
    { id: "details.", nome: "Detalhes" },
    { id: "plant.", nome: "Plantas" },
  ]

  // Calcular progresso
  const totalTermos = Object.keys(originais).length
  const termosTraduzidos = Object.keys(traducao).filter((chave) => traducao[chave] && traducao[chave] !== "").length
  const porcentagem = Math.round((termosTraduzidos / totalTermos) * 100)

  // Chaves filtradas
  const chavesFiltradas = filtrarChaves()

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            <span className={styles.flag}>{idioma.flag}</span>
            Traduzir para {idioma.nome}
          </h1>
          <p className={styles.subtitle}>
            Traduza os termos da interface para o idioma {idioma.nome} ({idioma.nativo}).
          </p>
        </div>
        <Link href="/admin/languages" className={styles.backButton}>
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
            className={styles.backIcon}
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </Link>
      </div>

      {mensagemSucesso && (
        <div className={styles.successMessage}>
          <div className={styles.successContent}>
            <div className={styles.successIconContainer}>
              <svg
                className={styles.successIcon}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className={styles.successText}>
              <p>{mensagemSucesso}</p>
            </div>
          </div>
        </div>
      )}

      {/* Progresso */}
      <div className={styles.progressCard}>
        <h2 className={styles.cardTitle}>Progresso da Tradução</h2>
        <div className={styles.progressBar}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${porcentagem}%` }}></div>
          </div>
          <span className={styles.progressPercent}>{porcentagem}%</span>
        </div>
        <p className={styles.progressText}>
          {termosTraduzidos} de {totalTermos} termos traduzidos
        </p>
      </div>

      {/* Filtros */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          {/* Pesquisa */}
          <div className={styles.filterGroup}>
            <label htmlFor="filtro" className={styles.filterLabel}>
              Pesquisar
            </label>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                name="filtro"
                id="filtro"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className={styles.searchInput}
                placeholder="Pesquisar termos"
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

          {/* Categoria */}
          <div className={styles.filterGroup}>
            <label htmlFor="categoria" className={styles.filterLabel}>
              Categoria
            </label>
            <select
              id="categoria"
              name="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={styles.select}
            >
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Apenas não traduzidos */}
          <div className={styles.filterGroup}>
            <div className={styles.checkboxContainer}>
              <input
                id="apenas-nao-traduzidos"
                name="apenas-nao-traduzidos"
                type="checkbox"
                checked={apenasNaoTraduzidos}
                onChange={(e) => setApenasNaoTraduzidos(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="apenas-nao-traduzidos" className={styles.checkboxLabel}>
                Mostrar apenas termos não traduzidos
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de traduções */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th className={styles.tableHeaderCell}>Chave</th>
                <th className={styles.tableHeaderCell}>Português (Original)</th>
                <th className={styles.tableHeaderCell}>{idioma.nome}</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {chavesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.emptyMessage}>
                    Nenhum termo encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                chavesFiltradas.map((chave) => (
                  <tr key={chave} className={styles.tableRow}>
                    <td className={styles.keyCell}>{chave}</td>
                    <td className={styles.originalCell}>{originais[chave as keyof typeof originais]}</td>
                    <td className={styles.translationCell}>
                      <textarea
                        rows={2}
                        value={traducao[chave] || ""}
                        onChange={(e) => atualizarTraducao(chave, e.target.value)}
                        className={styles.translationTextarea}
                        placeholder={`Tradução para ${idioma.nome}...`}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Botões de ação */}
      <div className={styles.actions}>
        <button type="button" onClick={() => router.push("/admin/languages")} className={styles.cancelButton}>
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvarTraducoes}
          disabled={salvando}
          className={`${styles.saveButton} ${salvando ? styles.saving : ""}`}
        >
          {salvando ? (
            <>
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
              Salvando...
            </>
          ) : (
            "Salvar Traduções"
          )}
        </button>
      </div>
    </div>
  )
}
