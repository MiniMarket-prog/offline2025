"use client"

import { useState, useEffect, useCallback } from "react"

export type ToastType = "default" | "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  title?: string
  description?: string
  type: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastOptions {
  title?: string
  description?: string
  type?: ToastType
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

// Create a context to store toasts
const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 1000

const toasts: Toast[] = []
let listeners: ((toasts: Toast[]) => void)[] = []

const emitChange = () => {
  listeners.forEach((listener) => {
    listener(toasts)
  })
}

export const useToast = () => {
  const [mounted, setMounted] = useState(false)
  const [localToasts, setLocalToasts] = useState<Toast[]>([])

  useEffect(() => {
    setMounted(true)

    const listener = (updatedToasts: Toast[]) => {
      setLocalToasts(updatedToasts)
    }

    listeners.push(listener)

    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])

  const toast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      type: options.type || "default",
      duration: options.duration || 5000,
      action: options.action,
    }

    toasts.push(newToast)

    if (toasts.length > TOAST_LIMIT) {
      toasts.shift()
    }

    emitChange()

    // Auto-dismiss toast after duration
    setTimeout(() => {
      dismiss(id)
    }, newToast.duration)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    const index = toasts.findIndex((toast) => toast.id === id)

    if (index !== -1) {
      toasts.splice(index, 1)
      emitChange()
    }
  }, [])

  const dismissAll = useCallback(() => {
    toasts.splice(0, toasts.length)
    emitChange()
  }, [])

  if (!mounted) {
    return {
      toast: () => "",
      dismiss: () => {},
      dismissAll: () => {},
      toasts: [],
    }
  }

  return {
    toast,
    dismiss,
    dismissAll,
    toasts: localToasts,
  }
}
