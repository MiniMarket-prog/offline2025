"use client"

import RootLayout from "./root-layout"
import type { ReactNode } from "react"
import { OfflineIndicator } from "@/components/offline-indicator"
import { useEffect } from "react"

export default function AppLayout({ children }: { children: ReactNode }) {
  // Ensure we have offline data when the app loads
  useEffect(() => {
    const loadOfflineData = async () => {
      try {
        const { ensureOfflineData } = await import("@/lib/local-storage")
        await ensureOfflineData()
      } catch (error) {
        console.error("Error loading offline data:", error)
      }
    }

    loadOfflineData()
  }, [])

  return (
    <RootLayout>
      {children}
      <OfflineIndicator />
    </RootLayout>
  )
}
