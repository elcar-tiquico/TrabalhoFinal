"use client"
import type React from "react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { AdminHeader } from "@/components/admin/header"
import styles from "./admin-layout.module.css"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Verificar autenticação
  useEffect(() => {
    // Pular verificação nas páginas sem layout (landing e login)
    if (pathname === "/admin/login" || pathname === "/admin") {
      return
    }
    
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem("adminToken")
    if (!token) {
      router.push("/admin/login")
    }
  }, [pathname, router])

  // Fechar menu mobile quando mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Renderizar apenas o conteúdo para páginas sem layout (landing e login)
  if (pathname === "/admin/login" || pathname === "/admin") {
    return <>{children}</>
  }

  // Layout para páginas administrativas autenticadas
  return (
    <div className={styles.adminLayout}>
      {/* Overlay para mobile */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        mobileOpen={mobileMenuOpen}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={`${styles.mainContent} ${sidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <AdminHeader 
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />
        <main className={styles.contentArea}>
          {children}
        </main>
      </div>
    </div>
  )
}