"use client"

import { useState } from "react"

type ToastType = "success" | "error" | "warning" | "info"

type Toast = {
  id: string
  message: string
  type: ToastType
  duration?: number
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = (message: string, type: ToastType = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { id, message, type, duration }

    setToasts((prev) => [...prev, newToast])

    if (duration !== Number.POSITIVE_INFINITY) {
      setTimeout(() => {
        dismissToast(id)
      }, duration)
    }

    return id
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return {
    toasts,
    toast,
    dismissToast,
    success: (message: string, duration?: number) => toast(message, "success", duration),
    error: (message: string, duration?: number) => toast(message, "error", duration),
    warning: (message: string, duration?: number) => toast(message, "warning", duration),
    info: (message: string, duration?: number) => toast(message, "info", duration),
  }
}
