"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "./add-language.module.css"

export default function AddLanguagePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Estado para os dados do idioma
  const [languageData, setLanguageData] = useState({
    nome: "",
    nativo: "",
    codigo: "",
    flag: "🇲🇿", // Padrão para Moçambique
    ativo: true,
    padrao: false,
    descricao: "",
  })

  // Lista de emojis de bandeiras para seleção
  const flagEmojis = [
    { emoji: "🇲🇿", name: "Moçambique" },
    { emoji: "🇧🇷", name: "Brasil" },
    { emoji: "🇦🇴", name: "Angola" },
    { emoji: "🇨🇻", name: "Cabo Verde" },
    { emoji: "🇬🇼", name: "Guiné-Bissau" },
    { emoji: "🇵🇹", name: "Portugal" },
    { emoji: "🇸🇹", name: "São Tomé e Príncipe" },
    { emoji: "🇺🇸", name: "Estados Unidos" },
    { emoji: "🇬🇧", name: "Reino Unido" },
    { emoji: "🇪🇸", name: "Espanha" },
    { emoji: "🇫🇷", name: "França" },
  ]

  // Função para lidar com a mudança nos campos do formulário
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const newValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    setLanguageData((prev) => ({ ...prev, [name]: newValue }))
  }

  // Função para lidar com o envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Simulação de envio para API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulação de sucesso
      setSuccessMessage(`Idioma "${languageData.nome}" adicionado com sucesso!`)

      // Limpar formulário após 2 segundos
      setTimeout(() => {
        // Redirecionar para a página de dicionário do novo idioma
        router.push(`/admin/languages/dictionary/${languageData.codigo}`)
      }, 2000)
    } catch (error) {
      console.error("Erro ao adicionar idioma:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Gerar código de idioma a partir do nome
  const generateLanguageCode = () => {
    if (languageData.nome) {
      const code = languageData.nome
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z]/g, "")
        .substring(0, 10)

      setLanguageData((prev) => ({ ...prev, codigo: code }))
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Adicionar Novo Idioma</h1>
          <p className={styles.subtitle}>
            Preencha o formulário abaixo para adicionar um novo idioma ao sistema. Após a criação, você poderá adicionar
            palavras ao dicionário de correspondência.
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

      {successMessage && (
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
              <p>{successMessage}</p>
              <p className={styles.redirectText}>
                Redirecionando para a página de dicionário para adicionar palavras...
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            {/* Informações Básicas */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Informações Básicas</h2>
            </div>

            {/* Nome do Idioma */}
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>
                Nome do Idioma *
              </label>
              <div>
                <input
                  type="text"
                  name="nome"
                  id="nome"
                  required
                  value={languageData.nome}
                  onChange={handleChange}
                  onBlur={generateLanguageCode}
                  className={styles.input}
                  placeholder="Ex: Português, Inglês, Xangana..."
                />
              </div>
              <p className={styles.hint}>Nome do idioma em português</p>
            </div>

            {/* Nome Nativo */}
            <div className={styles.formGroup}>
              <label htmlFor="nativo" className={styles.label}>
                Nome Nativo *
              </label>
              <div>
                <input
                  type="text"
                  name="nativo"
                  id="nativo"
                  required
                  value={languageData.nativo}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: Português, English, Xangana..."
                />
              </div>
              <p className={styles.hint}>Nome do idioma na língua nativa</p>
            </div>

            {/* Código do Idioma */}
            <div className={styles.formGroup}>
              <label htmlFor="codigo" className={styles.label}>
                Código do Idioma *
              </label>
              <div>
                <input
                  type="text"
                  name="codigo"
                  id="codigo"
                  required
                  value={languageData.codigo}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Ex: pt, en, xangana..."
                />
              </div>
              <p className={styles.hint}>Código único para identificar o idioma no sistema</p>
            </div>

            {/* Bandeira */}
            <div className={styles.formGroup}>
              <label htmlFor="flag" className={styles.label}>
                Bandeira *
              </label>
              <div>
                <select
                  id="flag"
                  name="flag"
                  required
                  value={languageData.flag}
                  onChange={handleChange}
                  className={styles.select}
                >
                  {flagEmojis.map((flag) => (
                    <option key={flag.emoji} value={flag.emoji}>
                      {flag.emoji} {flag.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div className={styles.formGroupFull}>
              <label htmlFor="descricao" className={styles.label}>
                Descrição do Idioma
              </label>
              <div>
                <textarea
                  id="descricao"
                  name="descricao"
                  rows={3}
                  value={languageData.descricao}
                  onChange={handleChange}
                  className={styles.textarea}
                  placeholder="Descreva brevemente o idioma, sua origem, regiões onde é falado, etc."
                />
              </div>
            </div>

            {/* Configurações */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Configurações</h2>
            </div>

            {/* Status */}
            <div className={styles.formGroup}>
              <div className={styles.checkboxItem}>
                <input
                  id="ativo"
                  name="ativo"
                  type="checkbox"
                  checked={languageData.ativo}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <label htmlFor="ativo" className={styles.checkboxLabel}>
                  Ativar idioma
                </label>
              </div>
              <p className={styles.checkboxHint}>Se desativado, o idioma não será exibido para os usuários</p>
            </div>

            {/* Idioma Padrão */}
            <div className={styles.formGroup}>
              <div className={styles.checkboxItem}>
                <input
                  id="padrao"
                  name="padrao"
                  type="checkbox"
                  checked={languageData.padrao}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <label htmlFor="padrao" className={styles.checkboxLabel}>
                  Definir como idioma padrão
                </label>
              </div>
              <p className={styles.checkboxHint}>
                Se marcado, este idioma será o padrão para novos usuários. Apenas um idioma pode ser padrão.
              </p>
            </div>

            {/* Informações Adicionais */}
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Próximos Passos</h2>
              <p className={styles.sectionInfo}>
                Após adicionar o idioma, você será redirecionado para a página de dicionário, onde poderá adicionar
                palavras e suas traduções para criar um dicionário de correspondência palavra por palavra entre
                Português e {languageData.nome || "o novo idioma"}.
              </p>
            </div>
          </div>

          <div className={styles.formActions}>
            <div className={styles.actionButtons}>
              <Link href="/admin/languages" className={styles.cancelButton}>
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.submitButton} ${isSubmitting ? styles.submitting : ""}`}
              >
                {isSubmitting ? (
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
                  "Adicionar Idioma"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
