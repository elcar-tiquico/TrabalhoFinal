// D:\Elcar\Projecto\frontend\src\lib\api\auth.ts
export interface User {
  id_usuario: number
  nome_completo: string
  email: string
  perfil: string
  ativo: boolean
  ultimo_login?: string
  data_registro?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: User
}

export interface CreateUserData {
  nome_completo: string
  email: string
  password: string
  ativo?: boolean
  perfil?: string
}

export interface UpdateUserData {
  nome_completo?: string
  email?: string
  password?: string
  ativo?: boolean
  perfil?: string
}

export interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    per_page: number
    total: number
    pages: number
  }
}

class AuthAPI {
  private baseURL = 'http://localhost:5003'

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('adminToken')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro no login')
    }

    const data = await response.json()
    
    // Salvar token no localStorage
    localStorage.setItem('adminToken', data.token)
    localStorage.setItem('adminUser', JSON.stringify(data.user))
    
    return data
  }

  async verifyAuth(): Promise<{ valid: boolean; user?: User }> {
    try {
      const response = await fetch(`${this.baseURL}/api/auth/verify`, {
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error('Token inválido')
      }

      const data = await response.json()
      
      // Atualizar dados do usuário no localStorage se houver mudanças
      if (data.user) {
        localStorage.setItem('adminUser', JSON.stringify(data.user))
      }
      
      return data
    } catch (error) {
      this.logout()
      return { valid: false }
    }
  }

  async getUsers(page = 1, perPage = 10, search = ''): Promise<UsersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      search
    })

    const response = await fetch(`${this.baseURL}/api/users?${params}`, {
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao buscar usuários')
    }

    return await response.json()
  }

  async createUser(userData: CreateUserData): Promise<{ message: string; user_id: number }> {
    const response = await fetch(`${this.baseURL}/api/users`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao criar usuário')
    }

    return await response.json()
  }

  async updateUser(userId: number, userData: UpdateUserData): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao atualizar usuário')
    }

    const result = await response.json()
    
    // Se foi atualização do próprio usuário, atualizar localStorage
    const currentUser = this.getCurrentUser()
    if (currentUser && currentUser.id_usuario === userId) {
      const updatedUser = {
        ...currentUser,
        ...userData
      }
      localStorage.setItem('adminUser', JSON.stringify(updatedUser))
    }
    
    return result
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseURL}/api/users/${userId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erro ao deletar usuário')
    }

    return await response.json()
  }

  // Método para alterar perfil do usuário atual
  async updateProfile(profileData: {
    nome_completo?: string
    email?: string
    password?: string
  }): Promise<{ message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    return this.updateUser(currentUser.id_usuario, profileData)
  }

  // Método para alterar senha do usuário atual
  async changePassword(newPassword: string): Promise<{ message: string }> {
    const currentUser = this.getCurrentUser()
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    return this.updateUser(currentUser.id_usuario, { password: newPassword })
  }

  logout(): void {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('adminUser')
    return userData ? JSON.parse(userData) : null
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('adminToken')
  }

  // Verificar se é administrador
  isAdmin(): boolean {
    const user = this.getCurrentUser()
    return user?.perfil === 'Administrador'
  }

  // Verificar se é usuário comum
  isUser(): boolean {
    const user = this.getCurrentUser()
    return user?.perfil === 'Usuario'
  }
}

export const authAPI = new AuthAPI()