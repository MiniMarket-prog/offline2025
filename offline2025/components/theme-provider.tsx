"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  attribute?: string
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
  attribute = "data-theme",
  enableSystem = true,
  disableTransitionOnChange = false,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or default
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    if (savedTheme) {
      setThemeState(savedTheme)
    } else if (enableSystem) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      setThemeState(systemTheme)
    }
    setMounted(true)
  }, [enableSystem, storageKey])

  // Update theme attribute on document
  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    // Remove all theme-related classes or attributes
    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(theme)
    } else {
      root.setAttribute(attribute, theme)
    }

    // Handle color-scheme
    if (disableTransitionOnChange) {
      document.documentElement.style.setProperty("color-scheme", theme)
    }
  }, [theme, mounted, attribute, disableTransitionOnChange])

  const setTheme = React.useCallback(
    (theme: Theme) => {
      setThemeState(theme)
      localStorage.setItem(storageKey, theme)
    },
    [storageKey],
  )

  const value = {
    theme,
    setTheme,
  }

  // Avoid hydration mismatch by not rendering anything until mounted
  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }

  return context
}
