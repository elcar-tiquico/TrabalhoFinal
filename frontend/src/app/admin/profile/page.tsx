"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { authAPI, type User } from "../../../lib/api/auth"
import styles from "./profile.module.css"

interface ProfileFormData {
  nome_completo: string
  email: string
  password: string
  confirmPassword: string
}

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    nome_completo: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadProfile()
  }, [])

  const checkAuthAndLoadProfile = async () => {
    try {
      const authResult = await authAPI.verifyAuth()
      if (!authResult.valid) {
        router.push("/admin/login")
        return
      }
      
      const currentUser = authResult.user || authAPI.getCurrentUser()
      if (!currentUser) {
        router.push("/admin/login")
        return
      }
      
      setUser(currentUser)
      setFormData({
        nome_completo: currentUser.nome_completo,
        email: currentUser.email,
        password: "",
        confirmPassword: ""
      })
      
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err)
      router.push("/admin/login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Limpar mensagens ao editar
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return
    
    setIsSaving(true)
    setError("")
    setSuccess("")
    
    try {
      // Validações
      if (!formData.nome_completo.trim()) {
        setError("Nome completo é obrigatório")
        return
      }
      
      if (!formData.email.trim()) {
        setError("Email é obrigatório")
        return
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError("Formato de email inválido")
        return
      }
      
      // Validar senha se estiver alterando
      if (showPasswordChange) {
        if (!formData.password) {
          setError("Nova senha é obrigatória")
          return
        }
        
        if (formData.password.length < 6) {
          setError("Senha deve ter pelo menos 6 caracteres")
          return
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError("Senhas não coincidem")
          return
        }
      }
      
      // Preparar dados para atualização
      const updateData: any = {
        nome_completo: formData.nome_completo.trim(),
        email: formData.email.trim().toLowerCase()
      }
      
      if (showPasswordChange && formData.password) {
        updateData.password = formData.password
      }
      
      // Atualizar perfil
      await authAPI.updateUser(user.id_usuario, updateData)
      
      // Atualizar dados locais
      const updatedUser = {
        ...user,
        nome_completo: updateData.nome_completo,
        email: updateData.email
      }
      
      setUser(updatedUser)
      localStorage.setItem('adminUser', JSON.stringify(updatedUser))
      
      setSuccess("Perfil atualizado com sucesso!")
      
      // Limpar campos de senha
      if (showPasswordChange) {
        setFormData(prev => ({
          ...prev,
          password: "",
          confirmPassword: ""
        }))
        setShowPasswordChange(false)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar perfil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = () => {
    authAPI.logout()
    router.push("/admin/login")
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Carregando perfil...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.errorAlert}>
          <span>Erro ao carregar perfil do usuário</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header com estilo similar ao da gestão de utilizadores */}
      <div className={styles.header}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
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
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sair
        </button>
      </div>

      {/* Alertas de erro e sucesso */}
      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button onClick={() => setError("")} className={styles.closeAlert}>×</button>
        </div>
      )}

      {success && (
        <div className={styles.successAlert}>
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className={styles.closeAlert}>×</button>
        </div>
      )}

      {/* Card de informações do utilizador */}
      <div className={styles.userInfoCard}>
        <div className={styles.userInfoHeader}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.nome_completo.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <h2 className={styles.userName}>{user.nome_completo}</h2>
              <p className={styles.userEmail}>{user.email}</p>
              <span className={`${styles.roleBadge} ${user.perfil === 'Administrador' ? styles.adminBadge : ''}`}>
                {user.perfil}
              </span>
            </div>
          </div>
          <div className={styles.userStats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Status</span>
              <span className={`${styles.statusBadge} ${user.ativo ? styles.statusActive : styles.statusInactive}`}>
                {user.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Último Login</span>
              <span className={styles.statValue}>
                {user.ultimo_login 
                  ? new Date(user.ultimo_login).toLocaleDateString('pt-PT')
                  : 'Nunca'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Card de edição do perfil */}
      <div className={styles.editCard}>
        <div className={styles.editCardHeader}>
          <h2 className={styles.editCardTitle}>Editar Perfil</h2>
        </div>
        
        <div className={styles.editCardBody}>
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formItem}>
              <label htmlFor="nome_completo" className={styles.formLabel}>
                Nome Completo
              </label>
              <input
                type="text"
                id="nome_completo"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className={styles.formItem}>
              <label htmlFor="email" className={styles.formLabel}>
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                placeholder="Digite o email"
                required
              />
            </div>

            {/* Seção de alteração de senha */}
            <div className={styles.passwordSection}>
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className={styles.togglePasswordButton}
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
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <circle cx="12" cy="16" r="1"></circle>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                {showPasswordChange ? "Cancelar alteração de senha" : "Alterar senha"}
              </button>
              
              {showPasswordChange && (
                <div className={styles.passwordFields}>
                  <div className={styles.formItem}>
                    <label htmlFor="password" className={styles.formLabel}>
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div className={styles.formItem}>
                    <label htmlFor="confirmPassword" className={styles.formLabel}>
                      Confirmar Nova Senha
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      placeholder="Repita a nova senha"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        
        <div className={styles.editCardFooter}>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSaving}
            className={styles.btnPrimary}
          >
            {isSaving ? (
              <>
                <div className={styles.spinner}></div>
                Salvando...
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
                >
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                  <polyline points="17 21 17 13 7 13 7 21"></polyline>
                  <polyline points="7 3 7 8 15 8"></polyline>
                </svg>
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}