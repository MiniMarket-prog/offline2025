"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, Home } from "lucide-react"

export function OfflineNavigationHandler() {
  const [isOffline, setIsOffline] = useState(false)
  const [isNavigationFailed, setIsNavigationFailed] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Set initial status
    setIsOffline(!navigator.onLine)

    // Define event handlers
    const handleOnline = () => {
      setIsOffline(false)
      setIsNavigationFailed(false)
    }

    const handleOffline = () => {
      setIsOffline(true)
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Handle navigation errors
    const handleNavigationError = (event: ErrorEvent) => {
      // Check if the error is likely a navigation error during offline mode
      if (
        isOffline &&
        event.message &&
        (event.message.includes("Failed to fetch") ||
          event.message.includes("NetworkError") ||
          event.message.includes("Network request failed"))
      ) {
        console.log("Caught offline navigation error:", event.message)
        setIsNavigationFailed(true)
        event.preventDefault()
      }
    }

    window.addEventListener("error", handleNavigationError)
    window.addEventListener("unhandledrejection", (event) => {
      if (
        isOffline &&
        event.reason &&
        typeof event.reason.message === "string" &&
        (event.reason.message.includes("Failed to fetch") ||
          event.reason.message.includes("NetworkError") ||
          event.reason.message.includes("Network request failed"))
      ) {
        console.log("Caught offline navigation rejection:", event.reason.message)
        setIsNavigationFailed(true)
        event.preventDefault()
      }
    })

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("error", handleNavigationError)
    }
  }, [isOffline])

  // Reset navigation failed state when pathname changes
  useEffect(() => {
    setIsNavigationFailed(false)
  }, [pathname])

  if (!isOffline && !isNavigationFailed) return null

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
        <AlertDescription className="flex flex-col gap-2">
          {isNavigationFailed ? (
            <>
              <p>Navigation failed while offline. Some pages may not be available.</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => router.push("/")}>
                  <Home className="h-4 w-4 mr-1" />
                  Home
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (navigator.onLine) {
                      window.location.reload()
                    } else {
                      setIsNavigationFailed(false)
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Try Again
                </Button>
              </div>
            </>
          ) : (
            <p>You're offline. Some features may be limited.</p>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
