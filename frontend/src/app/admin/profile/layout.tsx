// D:\Elcar\Projecto\frontend\src\app\profile\layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Perfil do Usuário - Sistema de Plantas Medicinais',
  description: 'Editar perfil e configurações do usuário',
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}