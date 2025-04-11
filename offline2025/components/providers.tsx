"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { useEffect, useState } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  // Use this to prevent hydration mismatch
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Only render children once mounted on client
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="mini-market-theme"
    >
      {mounted ? children : <div style={{ visibility: "hidden" }}>{children}</div>}
    </ThemeProvider>
  )
}
