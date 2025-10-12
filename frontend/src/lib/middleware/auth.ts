// D:\Elcar\Projecto\frontend\src\lib\middleware\auth.ts
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI } from "../api/auth"

export const useAuthGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authAPI.verifyAuth()
        if (result.valid) {
          setIsAuthenticated(true)
        } else {
          router.push("/admin/login")
        }
      } catch (error) {
        router.push("/admin/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { isAuthenticated, isLoading }
}

// Hook para páginas que devem redirecionar se o usuário já estiver logado
export const useGuestGuard = () => {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const result = await authAPI.verifyAuth()
        if (result.valid) {
          router.push("/admin/dashboard")
        }
      } catch (error) {
        // Usuario não autenticado, pode continuar na página
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  return { isLoading }
}