"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI, type User, type CreateUserData, type UpdateUserData } from "../../../lib/api/auth"
import styles from "./users.module.css"

interface UserFormData {
  nome_completo: string
  email: string
  password: string
  ativo: boolean
  perfil: string
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<UserFormData>({
    nome_completo: "",
    email: "",
    password: "",
    ativo: true,
    perfil: "Usuario"
  })
  const [formError, setFormError] = useState("")
  const [formLoading, setFormLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [currentPage, searchTerm])

  const checkAuthAndLoadData = async () => {
    try {
      const authResult = await authAPI.verifyAuth()
      if (!authResult.valid) {
        router.push("/admin/login")
        return
      }
      
      const user = authResult.user || authAPI.getCurrentUser()
      setCurrentUser(user)
      
      if (user?.perfil !== 'Administrador') {
        setError("Você não tem permissão para acessar esta página.")
        return
      }
      
      await loadUsers()
    } catch (err) {
      router.push("/admin/login")
    }
  }

  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await authAPI.getUsers(currentPage, 10, searchTerm)
      setUsers(response.users)
      setTotalPages(response.pagination.pages)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar utilizadores")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    setFormError("")
    
    try {
      const createData: CreateUserData = {
        nome_completo: formData.nome_completo,
        email: formData.email,
        password: formData.password,
        ativo: formData.ativo,
        perfil: formData.perfil
      }
      
      await authAPI.createUser(createData)
      setShowCreateModal(false)
      resetForm()
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar utilizador")
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setFormLoading(true)
    setFormError("")
    
    try {
      const updateData: UpdateUserData = {
        nome_completo: formData.nome_completo,
        email: formData.email,
        ativo: formData.ativo,
        perfil: formData.perfil
      }
      
      if (formData.password.trim()) {
        updateData.password = formData.password
      }
      
      await authAPI.updateUser(editingUser.id_usuario, updateData)
      setShowEditModal(false)
      setEditingUser(null)
      resetForm()
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao atualizar utilizador")
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir o utilizador ${user.nome_completo}?`)) {
      return
    }

    try {
      await authAPI.deleteUser(user.id_usuario)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir utilizador")
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      nome_completo: user.nome_completo,
      email: user.email,
      password: "",
      ativo: user.ativo,
      perfil: user.perfil
    })
    setFormError("")
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      email: "",
      password: "",
      ativo: true,
      perfil: "Usuario"
    })
    setFormError("")
  }

  const handleLogout = () => {
    authAPI.logout()
    router.push("/admin/login")
  }

  const isEditingOwnAccount = (user: User) => {
    return currentUser?.id_usuario === user.id_usuario
  }

  const canEditUser = (user: User) => {
    return currentUser?.perfil === 'Administrador'
  }

  const canDeleteUser = (user: User) => {
    return currentUser?.perfil === 'Administrador' && !isEditingOwnAccount(user)
  }

  // Se não é admin, não mostra a página
  if (currentUser && currentUser.perfil !== 'Administrador') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Acesso Negado</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Sair
          </button>
        </div>
        <div className={styles.errorAlert}>
          <span>Você não tem permissão para acessar esta página.</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestão de Utilizadores</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>
          Sair
        </button>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <span>{error}</span>
          <button onClick={() => setError("")} className={styles.closeAlert}>×</button>
        </div>
      )}

      <div className={styles.filterCard}>
        <div className={styles.controls}>
          <div className={styles.searchSection}>
            <div className={styles.searchInputContainer}>
              <input
                type="text"
                placeholder="Pesquisar utilizadores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
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
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className={styles.createButton}
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
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="16"></line>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            Novo Utilizador
          </button>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Carregando utilizadores...</p>
            </div>
          ) : users.length === 0 ? (
            <div className={styles.loadingState}>
              <p>Nenhum utilizador encontrado</p>
            </div>
          ) : (
            <table className={styles.usersTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id_usuario}>
                    <td className={styles.nameCell}>
                      <div className={styles.userAvatar}>
                        {user.nome_completo.charAt(0).toUpperCase()}
                      </div>
                      <strong>{user.nome_completo}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.roleBadge} ${user.perfil === 'Admin' ? styles.adminBadge : ''}`}>
                        {user.perfil}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.ativo ? styles.statusActive : styles.statusInactive}`}>
                        {user.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      {user.ultimo_login 
                        ? new Date(user.ultimo_login).toLocaleDateString('pt-PT')
                        : 'Nunca'
                      }
                    </td>
                    <td className={styles.tableCellActions}>
                      <div className={styles.actionButtons}>
                        {canEditUser(user) && (
                          <button
                            onClick={() => openEditModal(user)}
                            className={styles.editButton}
                            title="Editar"
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
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                        )}
                        {canDeleteUser(user) && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className={styles.deleteButton}
                            title="Excluir"
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
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Anterior
          </button>
          <span className={styles.paginationInfo}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Próxima
          </button>
        </div>
      )}

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Criar Novo Utilizador</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {formError && (
                <div className={styles.errorAlert}>
                  <span>{formError}</span>
                </div>
              )}
              
              <form onSubmit={handleCreateUser} className={styles.formGrid}>
                <div className={styles.formItem}>
                  <label htmlFor="nome_completo" className={styles.formLabel}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                    required
                    className={styles.formInput}
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="email" className={styles.formLabel}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className={styles.formInput}
                    placeholder="Digite o email"
                  />
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="password" className={styles.formLabel}>
                    Senha
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                    className={styles.formInput}
                    placeholder="Digite a senha (mín. 6 caracteres)"
                  />
                  <p className={styles.formHint}>A senha deve ter pelo menos 6 caracteres</p>
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="perfil" className={styles.formLabel}>
                    Perfil do Utilizador
                  </label>
                  <select
                    id="perfil"
                    value={formData.perfil}
                    onChange={(e) => setFormData(prev => ({ ...prev, perfil: e.target.value }))}
                    required
                    className={styles.formInput}
                  >
                    <option value="Usuario">Utilizador</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                  <p className={styles.formHint}>
                    Utilizador: Acesso a tudo exceto gestão de utilizadores. Admin: Acesso total.
                  </p>
                </div>
                
                <div className={styles.formItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                      className={styles.checkbox}
                    />
                    Utilizador Ativo
                  </label>
                </div>
              </form>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  resetForm()
                }}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleCreateUser}
                disabled={formLoading}
                className={styles.btnPrimary}
              >
                {formLoading ? 'Criando...' : 'Criar Utilizador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Editar Utilizador</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  resetForm()
                }}
                className={styles.modalCloseButton}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {formError && (
                <div className={styles.errorAlert}>
                  <span>{formError}</span>
                </div>
              )}
              
              <form onSubmit={handleUpdateUser} className={styles.formGrid}>
                <div className={styles.formItem}>
                  <label htmlFor="edit_nome_completo" className={styles.formLabel}>
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    id="edit_nome_completo"
                    value={formData.nome_completo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome_completo: e.target.value }))}
                    required
                    className={styles.formInput}
                    placeholder="Digite o nome completo"
                  />
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="edit_email" className={styles.formLabel}>
                    Email
                  </label>
                  <input
                    type="email"
                    id="edit_email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className={styles.formInput}
                    placeholder="Digite o email"
                  />
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="edit_password" className={styles.formLabel}>
                    Nova Senha (deixar vazio para manter a atual)
                  </label>
                  <input
                    type="password"
                    id="edit_password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className={styles.formInput}
                    placeholder="Digite nova senha (opcional)"
                  />
                  {formData.password && (
                    <p className={styles.formHint}>A senha deve ter pelo menos 6 caracteres</p>
                  )}
                </div>
                
                <div className={styles.formItem}>
                  <label htmlFor="edit_perfil" className={styles.formLabel}>
                    Perfil do Utilizador
                  </label>
                  <select
                    id="edit_perfil"
                    value={formData.perfil}
                    onChange={(e) => setFormData(prev => ({ ...prev, perfil: e.target.value }))}
                    required
                    className={styles.formInput}
                  >
                    <option value="Usuario">Utilizador</option>
                    <option value="Admin">Administrador</option>
                  </select>
                  <p className={styles.formHint}>
                    Utilizador: Acesso a tudo exceto gestão de utilizadores. Admin: Acesso total.
                  </p>
                </div>
                
                <div className={styles.formItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={formData.ativo}
                      onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                      className={styles.checkbox}
                      disabled={isEditingOwnAccount(editingUser)}
                    />
                    Utilizador Ativo
                    {isEditingOwnAccount(editingUser) && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        (Não pode desativar sua própria conta)
                      </span>
                    )}
                  </label>
                </div>
              </form>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                  resetForm()
                }}
                className={styles.btnSecondary}
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleUpdateUser}
                disabled={formLoading}
                className={styles.btnPrimary}
              >
                {formLoading ? 'Atualizando...' : 'Atualizar Utilizador'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}