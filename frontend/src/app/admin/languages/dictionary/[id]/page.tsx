"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

// Tipo para as entradas do dicionário
type DictionaryEntry = {
  id: number
  portugues: string
  traducao: string
  categoria: string
  notas?: string
  exemplos?: string
  dataCriacao: string
  dataAtualizacao: string
}

// Dados simulados de idiomas
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
  // Simulação de um novo idioma adicionado
  macua: {
    id: "macua",
    nome: "Macua",
    nativo: "Emakhuwa",
    codigo: "macua",
    flag: "🇲🇿",
  },
}

// Dados simulados de dicionário
const dicionariosIniciais: Record<string, DictionaryEntry[]> = {
  xangana: [
    {
      id: 1,
      portugues: "planta",
      traducao: "swimbyani",
      categoria: "botânica",
      notas: "Termo geral para plantas",
      exemplos: "As swimbyani são importantes para o ecossistema.",
      dataCriacao: "2023-05-15",
      dataAtualizacao: "2023-05-15",
    },
    {
      id: 2,
      portugues: "folha",
      traducao: "tluka",
      categoria: "botânica",
      exemplos: "As tluka desta planta são verdes.",
      dataCriacao: "2023-05-15",
      dataAtualizacao: "2023-06-20",
    },
    {
      id: 3,
      portugues: "raiz",
      traducao: "misinya",
      categoria: "botânica",
      dataCriacao: "2023-05-16",
      dataAtualizacao: "2023-05-16",
    },
    {
      id: 4,
      portugues: "flor",
      traducao: "sviluva",
      categoria: "botânica",
      dataCriacao: "2023-05-16",
      dataAtualizacao: "2023-05-16",
    },
    {
      id: 5,
      portugues: "fruto",
      traducao: "mihandzu",
      categoria: "botânica",
      dataCriacao: "2023-05-17",
      dataAtualizacao: "2023-05-17",
    },
    {
      id: 6,
      portugues: "semente",
      traducao: "mbewu",
      categoria: "botânica",
      dataCriacao: "2023-05-17",
      dataAtualizacao: "2023-05-17",
    },
    {
      id: 7,
      portugues: "árvore",
      traducao: "nsinya",
      categoria: "botânica",
      dataCriacao: "2023-05-18",
      dataAtualizacao: "2023-05-18",
    },
    {
      id: 8,
      portugues: "medicinal",
      traducao: "ya mirhi",
      categoria: "medicina",
      dataCriacao: "2023-05-18",
      dataAtualizacao: "2023-05-18",
    },
    {
      id: 9,
      portugues: "doença",
      traducao: "vuvabyi",
      categoria: "medicina",
      dataCriacao: "2023-05-19",
      dataAtualizacao: "2023-05-19",
    },
    {
      id: 10,
      portugues: "cura",
      traducao: "ku horisa",
      categoria: "medicina",
      dataCriacao: "2023-05-19",
      dataAtualizacao: "2023-05-19",
    },
  ],
  xopeee: [
    {
      id: 1,
      portugues: "planta",
      traducao: "planta",
      categoria: "botânica",
      dataCriacao: "2023-06-10",
      dataAtualizacao: "2023-06-10",
    },
    {
      id: 2,
      portugues: "folha",
      traducao: "folha",
      categoria: "botânica",
      dataCriacao: "2023-06-10",
      dataAtualizacao: "2023-06-10",
    },
    {
      id: 3,
      portugues: "raiz",
      traducao: "raiz",
      categoria: "botânica",
      dataCriacao: "2023-06-11",
      dataAtualizacao: "2023-06-11",
    },
  ],
  macua: [],
}

// Categorias disponíveis
const categorias = [
  "botânica",
  "medicina",
  "agricultura",
  "ecologia",
  "geografia",
  "clima",
  "geral",
  "outros",
  "anatomia",
  "farmacologia",
  "química",
  "biologia",
]

export default function DictionaryPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const languageId = id as string

  const [idioma, setIdioma] = useState<any>(null)
  const [dicionario, setDicionario] = useState<DictionaryEntry[]>([])
  const [filtro, setFiltro] = useState("")
  const [categoriaFiltro, setCategoriaFiltro] = useState("")
  const [ordenacao, setOrdenacao] = useState<"portugues" | "traducao" | "dataCriacao" | "dataAtualizacao">("portugues")
  const [direcaoOrdenacao, setDirecaoOrdenacao] = useState<"asc" | "desc">("asc")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isEditing, setIsEditing] = useState<number | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [visualizacao, setVisualizacao] = useState<"tabela" | "cartoes">("tabela")
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  // Referência para o formulário de adição/edição
  const formRef = useRef<HTMLDivElement>(null)

  // Estado para nova entrada ou edição
  const [novaEntrada, setNovaEntrada] = useState<Omit<DictionaryEntry, "id" | "dataCriacao" | "dataAtualizacao">>({
    portugues: "",
    traducao: "",
    categoria: "geral",
    notas: "",
    exemplos: "",
  })

  // Carregar dados do idioma e dicionário
  useEffect(() => {
    setIsLoading(true)

    // Simulação de carregamento de dados
    setTimeout(() => {
      if (languageId && idiomas[languageId as keyof typeof idiomas]) {
        setIdioma(idiomas[languageId as keyof typeof idiomas])

        // Verificar se existe um dicionário para este idioma
        if (dicionariosIniciais[languageId]) {
          setDicionario(dicionariosIniciais[languageId])
        } else {
          // Iniciar com um dicionário vazio
          setDicionario([])
        }
      } else {
        // Idioma não encontrado, redirecionar para a lista de idiomas
        router.push("/admin/languages")
      }

      setIsLoading(false)
    }, 800)
  }, [languageId, router])

  // Função para ordenar entradas
  const ordenarEntradas = (entradas: DictionaryEntry[]) => {
    return [...entradas].sort((a, b) => {
      let valorA, valorB

      switch (ordenacao) {
        case "portugues":
          valorA = a.portugues.toLowerCase()
          valorB = b.portugues.toLowerCase()
          break
        case "traducao":
          valorA = a.traducao.toLowerCase()
          valorB = b.traducao.toLowerCase()
          break
        case "dataCriacao":
          valorA = new Date(a.dataCriacao).getTime()
          valorB = new Date(b.dataCriacao).getTime()
          break
        case "dataAtualizacao":
          valorA = new Date(a.dataAtualizacao).getTime()
          valorB = new Date(b.dataAtualizacao).getTime()
          break
        default:
          valorA = a.portugues.toLowerCase()
          valorB = b.portugues.toLowerCase()
      }

      if (direcaoOrdenacao === "asc") {
        return valorA > valorB ? 1 : -1
      } else {
        return valorA < valorB ? 1 : -1
      }
    })
  }

  // Função para filtrar entradas do dicionário
  const filtrarEntradas = () => {
    return dicionario.filter((entrada) => {
      const matchesSearch =
        filtro === "" ||
        entrada.portugues.toLowerCase().includes(filtro.toLowerCase()) ||
        entrada.traducao.toLowerCase().includes(filtro.toLowerCase()) ||
        (entrada.notas && entrada.notas.toLowerCase().includes(filtro.toLowerCase())) ||
        (entrada.exemplos && entrada.exemplos.toLowerCase().includes(filtro.toLowerCase()))

      const matchesCategoria = categoriaFiltro === "" || entrada.categoria === categoriaFiltro

      return matchesSearch && matchesCategoria
    })
  }

  // Entradas filtradas e ordenadas
  const entradasFiltradas = ordenarEntradas(filtrarEntradas())

  // Paginação
  const totalPaginas = Math.ceil(entradasFiltradas.length / itensPorPagina)
  const entradasPaginadas = entradasFiltradas.slice((paginaAtual - 1) * itensPorPagina, paginaAtual * itensPorPagina)

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNovaEntrada((prev) => ({ ...prev, [name]: value }))
  }

  // Função para adicionar nova entrada
  const handleAddEntry = () => {
    // Validar campos obrigatórios
    if (!novaEntrada.portugues || !novaEntrada.traducao) {
      setErrorMessage("Os campos Português e Tradução são obrigatórios.")
      return
    }

    // Verificar se já existe uma entrada com o mesmo termo em português
    const existingEntry = dicionario.find(
      (entry) => entry.portugues.toLowerCase() === novaEntrada.portugues.toLowerCase(),
    )

    if (existingEntry) {
      setErrorMessage(`Já existe uma entrada para "${novaEntrada.portugues}" no dicionário.`)
      return
    }

    // Data atual formatada como YYYY-MM-DD
    const dataAtual = new Date().toISOString().split("T")[0]

    // Adicionar nova entrada
    const newEntry: DictionaryEntry = {
      id: dicionario.length > 0 ? Math.max(...dicionario.map((e) => e.id)) + 1 : 1,
      ...novaEntrada,
      dataCriacao: dataAtual,
      dataAtualizacao: dataAtual,
    }

    setDicionario([...dicionario, newEntry])

    // Limpar formulário
    setNovaEntrada({
      portugues: "",
      traducao: "",
      categoria: "geral",
      notas: "",
      exemplos: "",
    })

    setIsAdding(false)
    setSuccessMessage("Palavra adicionada com sucesso!")

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  // Função para iniciar edição de uma entrada
  const startEditing = (entry: DictionaryEntry) => {
    setIsEditing(entry.id)
    setNovaEntrada({
      portugues: entry.portugues,
      traducao: entry.traducao,
      categoria: entry.categoria,
      notas: entry.notas || "",
      exemplos: entry.exemplos || "",
    })

    // Rolar para o formulário
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Função para salvar edição
  const handleSaveEdit = () => {
    // Validar campos obrigatórios
    if (!novaEntrada.portugues || !novaEntrada.traducao) {
      setErrorMessage("Os campos Português e Tradução são obrigatórios.")
      return
    }

    // Verificar se já existe outra entrada com o mesmo termo em português (exceto a atual)
    const existingEntry = dicionario.find(
      (entry) => entry.id !== isEditing && entry.portugues.toLowerCase() === novaEntrada.portugues.toLowerCase(),
    )

    if (existingEntry) {
      setErrorMessage(`Já existe uma entrada para "${novaEntrada.portugues}" no dicionário.`)
      return
    }

    // Data atual formatada como YYYY-MM-DD
    const dataAtual = new Date().toISOString().split("T")[0]

    // Atualizar entrada
    const updatedDictionary = dicionario.map((entry) =>
      entry.id === isEditing
        ? {
            ...entry,
            ...novaEntrada,
            dataAtualizacao: dataAtual,
          }
        : entry,
    )

    setDicionario(updatedDictionary)

    // Limpar formulário
    setNovaEntrada({
      portugues: "",
      traducao: "",
      categoria: "geral",
      notas: "",
      exemplos: "",
    })

    setIsEditing(null)
    setSuccessMessage("Palavra atualizada com sucesso!")

    // Limpar mensagem após 3 segundos
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  // Função para cancelar adição/edição
  const handleCancel = () => {
    setIsAdding(false)
    setIsEditing(null)
    setNovaEntrada({
      portugues: "",
      traducao: "",
      categoria: "geral",
      notas: "",
      exemplos: "",
    })
    setErrorMessage("")
  }

  // Função para excluir uma entrada
  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir esta palavra?")) {
      const updatedDictionary = dicionario.filter((entry) => entry.id !== id)
      setDicionario(updatedDictionary)

      setSuccessMessage("Palavra excluída com sucesso!")

      // Limpar mensagem após 3 segundos
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    }
  }

  // Função para importar dicionário
  const handleImport = () => {
    // Simulação de importação
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = ".json,.csv,.xlsx"
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        // Simulação de processamento do arquivo
        setTimeout(() => {
          setSuccessMessage(`Arquivo "${file.name}" importado com sucesso! Foram adicionadas 15 novas palavras.`)
          setTimeout(() => {
            setSuccessMessage("")
          }, 3000)
        }, 1000)
      }
    }
    fileInput.click()
  }

  // Função para exportar dicionário
  const handleExport = () => {
    // Simulação de exportação
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dicionario, null, 2))
    const downloadAnchorNode = document.createElement("a")
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute(
      "download",
      `dicionario_${languageId}_${new Date().toISOString().split("T")[0]}.json`,
    )
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()

    setSuccessMessage("Dicionário exportado com sucesso!")
    setTimeout(() => {
      setSuccessMessage("")
    }, 3000)
  }

  // Função para alternar a direção da ordenação
  const toggleOrdenacao = (campo: "portugues" | "traducao" | "dataCriacao" | "dataAtualizacao") => {
    if (ordenacao === campo) {
      setDirecaoOrdenacao(direcaoOrdenacao === "asc" ? "desc" : "asc")
    } else {
      setOrdenacao(campo)
      setDirecaoOrdenacao("asc")
    }
  }

  // Função para mudar de página
  const mudarPagina = (pagina: number) => {
    setPaginaAtual(pagina)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-purple-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-gray-500">Carregando dicionário...</p>
        </div>
      </div>
    )
  }

  if (!idioma) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Idioma não encontrado.</p>
          <Link
            href="/admin/languages"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Voltar para a lista de idiomas
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <span className="text-3xl mr-2">{idioma.flag}</span>
            Dicionário: Português → {idioma.nome}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Gerencie o dicionário de correspondência palavra por palavra entre Português e {idioma.nome} (
            {idioma.nativo}
            ).
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex flex-wrap gap-2">
          <button
            onClick={handleImport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Importar
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
              className="mr-2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportar
          </button>
          <Link
            href="/admin/languages"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
              className="mr-2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Voltar
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-500"
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
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="bg-purple-50 overflow-hidden shadow rounded-lg border border-purple-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-purple-600"
                  >
                    <path d="m5 8 6 6"></path>
                    <path d="m4 14 6-6 2-3"></path>
                    <path d="M2 5h12"></path>
                    <path d="M7 2h1"></path>
                    <path d="m22 22-5-10-5 10"></path>
                    <path d="M14 18h6"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total de Palavras</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{dicionario.length}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 overflow-hidden shadow rounded-lg border border-green-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-green-600"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categorias</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {new Set(dicionario.map((e) => e.categoria)).size}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 overflow-hidden shadow rounded-lg border border-blue-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-600"
                  >
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-6"></path>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categoria Principal</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {dicionario.length > 0
                          ? Object.entries(
                              dicionario.reduce(
                                (acc, curr) => {
                                  acc[curr.categoria] = (acc[curr.categoria] || 0) + 1
                                  return acc
                                },
                                {} as Record<string, number>,
                              ),
                            ).sort((a, b) => b[1] - a[1])[0][0]
                          : "N/A"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 overflow-hidden shadow rounded-lg border border-yellow-100">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-yellow-600"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Última Atualização</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">
                        {dicionario.length > 0
                          ? new Date(
                              Math.max(...dicionario.map((e) => new Date(e.dataAtualizacao).getTime())),
                            ).toLocaleDateString("pt-BR")
                          : "N/A"}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário de adição/edição */}
      {(isAdding || isEditing !== null) && (
        <div ref={formRef} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {isEditing !== null ? "Editar Palavra" : "Adicionar Nova Palavra"}
          </h2>

          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            {/* Palavra em Português */}
            <div className="sm:col-span-3">
              <label htmlFor="portugues" className="block text-sm font-medium text-gray-700">
                Palavra em Português *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="portugues"
                  id="portugues"
                  required
                  value={novaEntrada.portugues}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Ex: planta, folha, raiz..."
                />
              </div>
            </div>

            {/* Tradução */}
            <div className="sm:col-span-3">
              <label htmlFor="traducao" className="block text-sm font-medium text-gray-700">
                Tradução em {idioma.nome} *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="traducao"
                  id="traducao"
                  required
                  value={novaEntrada.traducao}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder={`Ex: tradução em ${idioma.nome}...`}
                />
              </div>
            </div>

            {/* Categoria */}
            <div className="sm:col-span-3">
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                Categoria *
              </label>
              <div className="mt-1">
                <select
                  id="categoria"
                  name="categoria"
                  required
                  value={novaEntrada.categoria}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Exemplos */}
            <div className="sm:col-span-3">
              <label htmlFor="exemplos" className="block text-sm font-medium text-gray-700">
                Exemplos de Uso
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  id="exemplos"
                  name="exemplos"
                  value={novaEntrada.exemplos || ""}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Ex: Frases de exemplo usando a palavra..."
                />
              </div>
            </div>

            {/* Notas */}
            <div className="sm:col-span-6">
              <label htmlFor="notas" className="block text-sm font-medium text-gray-700">
                Notas ou Observações
              </label>
              <div className="mt-1">
                <textarea
                  id="notas"
                  name="notas"
                  rows={3}
                  value={novaEntrada.notas || ""}
                  onChange={handleChange}
                  className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                  placeholder="Informações adicionais, contexto de uso, variações regionais, etc."
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={isEditing !== null ? handleSaveEdit : handleAddEntry}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              {isEditing !== null ? "Salvar Alterações" : "Adicionar Palavra"}
            </button>
          </div>
        </div>
      )}

      {/* Filtros e Visualização */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Dicionário</h2>
          <div className="flex items-center space-x-4 mt-3 sm:mt-0">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setVisualizacao("tabela")}
                className={`p-2 rounded-md ${
                  visualizacao === "tabela"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title="Visualização em tabela"
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
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button
                onClick={() => setVisualizacao("cartoes")}
                className={`p-2 rounded-md ${
                  visualizacao === "cartoes"
                    ? "bg-purple-100 text-purple-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
                title="Visualização em cartões"
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
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
            {!isAdding && isEditing === null && (
              <button
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
                  className="mr-2"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Adicionar Palavra
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Pesquisa */}
          <div>
            <label htmlFor="filtro" className="block text-sm font-medium text-gray-700">
              Pesquisar
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="filtro"
                id="filtro"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                placeholder="Pesquisar palavras..."
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
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
                  className="text-gray-400"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
          </div>

          {/* Filtro por categoria */}
          <div>
            <label htmlFor="categoriaFiltro" className="block text-sm font-medium text-gray-700">
              Categoria
            </label>
            <select
              id="categoriaFiltro"
              name="categoriaFiltro"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Visualização em Tabela */}
      {visualizacao === "tabela" && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleOrdenacao("portugues")}
                  >
                    <div className="flex items-center">
                      Português
                      {ordenacao === "portugues" && (
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
                          className={`ml-1 ${direcaoOrdenacao === "desc" ? "transform rotate-180" : ""}`}
                        >
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleOrdenacao("traducao")}
                  >
                    <div className="flex items-center">
                      {idioma.nome}
                      {ordenacao === "traducao" && (
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
                          className={`ml-1 ${direcaoOrdenacao === "desc" ? "transform rotate-180" : ""}`}
                        >
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Categoria
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Exemplos/Notas
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleOrdenacao("dataAtualizacao")}
                  >
                    <div className="flex items-center">
                      Atualização
                      {ordenacao === "dataAtualizacao" && (
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
                          className={`ml-1 ${direcaoOrdenacao === "desc" ? "transform rotate-180" : ""}`}
                        >
                          <polyline points="18 15 12 9 6 15"></polyline>
                        </svg>
                      )}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entradasPaginadas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {dicionario.length === 0
                        ? "Nenhuma palavra adicionada ainda. Clique em 'Adicionar Palavra' para começar."
                        : "Nenhuma palavra encontrada com os filtros selecionados."}
                    </td>
                  </tr>
                ) : (
                  entradasPaginadas.map((entrada) => (
                    <tr key={entrada.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {entrada.portugues}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{entrada.traducao}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {entrada.categoria.charAt(0).toUpperCase() + entrada.categoria.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {entrada.exemplos ? entrada.exemplos : entrada.notas || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entrada.dataAtualizacao).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => startEditing(entrada)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Editar
                          </button>
                          <button onClick={() => handleDelete(entrada.id)} className="text-red-600 hover:text-red-900">
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
      )}

      {/* Visualização em Cartões */}
      {visualizacao === "cartoes" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {entradasPaginadas.length === 0 ? (
            <div className="col-span-full bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-center text-gray-500">
              {dicionario.length === 0
                ? "Nenhuma palavra adicionada ainda. Clique em 'Adicionar Palavra' para começar."
                : "Nenhuma palavra encontrada com os filtros selecionados."}
            </div>
          ) : (
            entradasPaginadas.map((entrada) => (
              <div
                key={entrada.id}
                className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{entrada.portugues}</h3>
                      <p className="text-purple-600 font-medium">{entrada.traducao}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {entrada.categoria.charAt(0).toUpperCase() + entrada.categoria.slice(1)}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  {entrada.exemplos && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Exemplos</h4>
                      <p className="text-sm text-gray-700">{entrada.exemplos}</p>
                    </div>
                  )}
                  {entrada.notas && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notas</h4>
                      <p className="text-sm text-gray-700">{entrada.notas}</p>
                    </div>
                  )}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Atualizado em {new Date(entrada.dataAtualizacao).toLocaleDateString("pt-BR")}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(entrada)}
                        className="text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(entrada.id)}
                        className="text-xs text-red-600 hover:text-red-900"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Paginação */}
      {entradasFiltradas.length > itensPorPagina && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => mudarPagina(Math.max(1, paginaAtual - 1))}
              disabled={paginaAtual === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={() => mudarPagina(Math.min(totalPaginas, paginaAtual + 1))}
              disabled={paginaAtual === totalPaginas}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(paginaAtual - 1) * itensPorPagina + 1}</span> a{" "}
                <span className="font-medium">{Math.min(paginaAtual * itensPorPagina, entradasFiltradas.length)}</span>{" "}
                de <span className="font-medium">{entradasFiltradas.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => mudarPagina(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Anterior</span>
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

                {/* Páginas */}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                  <button
                    key={pagina}
                    onClick={() => mudarPagina(pagina)}
                    aria-current={paginaAtual === pagina ? "page" : undefined}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      paginaAtual === pagina
                        ? "z-10 bg-purple-50 border-purple-500 text-purple-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  onClick={() => mudarPagina(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="sr-only">Próximo</span>
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
    </div>
  )
}
