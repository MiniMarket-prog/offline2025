"use client"

import RootLayout from "./root-layout"
import type { ReactNode } from "react"
import { OfflineIndicator } from "@/components/offline-indicator"
import { FirefoxOfflineDetector } from "@/components/firefox-offline-detector"
import { OfflineBanner } from "@/components/offline-banner"
import { OfflineNavigationHandler } from "@/components/offline-navigation-handler"
import { useEffect, useState } from "react"
import { initSyncManager } from "@/lib/sync-manager"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { initializeStorage } from "@/lib/db-detection"
import { StorageStatus } from "@/components/storage-status"

export default function AppLayout({ children }: { children: ReactNode }) {
  const [initError, setInitError] = useState<string | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [storageType, setStorageType] = useState<"indexeddb" | "localstorage" | "memory" | null>(null)
  const [showStorageWarning, setShowStorageWarning] = useState(false)

  // Initialize storage and sync manager
  useEffect(() => {
    const initializeOfflineSupport = async () => {
      try {
        console.log("Initializing offline support...")

        // Initialize storage with fallbacks
        const storageResult = await initializeStorage()
        setStorageType(storageResult.storageType)

        if (storageResult.error) {
          console.warn("Storage initialization warning:", storageResult.error)
          setShowStorageWarning(true)
        }

        if (storageResult.storageType !== "indexeddb") {
          console.warn(`Using ${storageResult.storageType} instead of IndexedDB`)
          setShowStorageWarning(true)
        }

        // Initialize sync manager
        initSyncManager()
        console.log("Sync manager initialized")

        // Ensure we have offline data
        const { ensureOfflineData } = await import("@/lib/local-storage")
        await ensureOfflineData()
        console.log("Offline data ensured")

        setInitialized(true)
      } catch (error) {
        console.error("Error initializing offline support:", error)
        setInitError(`Failed to initialize offline support: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    initializeOfflineSupport()
  }, [])

  return (
    <RootLayout>
      {/* Firefox offline detector - no visual component */}
      <FirefoxOfflineDetector />

      {initError && (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Initialization Error</AlertTitle>
          <AlertDescription>{initError}</AlertDescription>
        </Alert>
      )}

      {showStorageWarning && storageType && (
        <Alert variant="warning" className="m-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Storage Warning</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              Using {storageType} for data storage.{" "}
              {storageType !== "indexeddb" && "Some offline features may be limited."}
            </p>
            {storageType === "memory" && (
              <p className="font-semibold">Warning: Data will be lost when you close or refresh the page.</p>
            )}
            <Button variant="outline" size="sm" onClick={() => setShowStorageWarning(false)} className="self-end">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {children}
      <div className="fixed bottom-4 left-4 z-50">
        <StorageStatus />
      </div>
      <OfflineIndicator />
      {initialized && <OfflineBanner />}
      <OfflineNavigationHandler />
    </RootLayout>
  )
}
