"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function RegisterServiceWorker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/service-worker.js", {
            scope: "/",
            updateViaCache: "none", // Don't use cache for updates
          })
          .then((reg) => {
            console.log("Service Worker registered with scope:", reg.scope)
            setRegistration(reg)

            // Check if there's already a waiting service worker
            if (reg.waiting) {
              setUpdateAvailable(true)
            }

            // Check for updates
            reg.addEventListener("updatefound", () => {
              const newWorker = reg.installing
              if (newWorker) {
                newWorker.addEventListener("statechange", () => {
                  if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                    setUpdateAvailable(true)
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error("Service Worker registration failed:", error)
            setError(`Service Worker registration failed: ${error.message}`)
          })

        // Detect controller change
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          console.log("Service worker controller changed - reloading page")
          window.location.reload()
        })
      })
    }

    // Ensure manifest is loaded
    const linkElement = document.querySelector('link[rel="manifest"]') || document.createElement("link")
    if (!document.querySelector('link[rel="manifest"]')) {
      linkElement.setAttribute("rel", "manifest")
      linkElement.setAttribute("href", "/manifest.json")
      document.head.appendChild(linkElement)
    }
  }, [])

  const updateServiceWorker = () => {
    if (registration && registration.waiting) {
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: "SKIP_WAITING" })
    }
  }

  return (
    <>
      {error && (
        <div className="fixed bottom-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Alert className="bg-red-50 border-red-200 text-red-800">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {updateAvailable && (
        <div className="fixed bottom-4 left-4 right-4 z-50">
          <Alert className="bg-blue-50 border-blue-200 text-blue-800">
            <div className="flex items-center justify-between w-full">
              <AlertDescription>A new version of the app is available!</AlertDescription>
              <Button size="sm" onClick={updateServiceWorker}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Now
              </Button>
            </div>
          </Alert>
        </div>
      )}
    </>
  )
}
