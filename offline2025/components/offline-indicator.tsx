"use client"

import { useState, useEffect } from "react"
import { isOnline } from "@/lib/supabase"
import { AlertCircle, Wifi, WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [showOfflineWarning, setShowOfflineWarning] = useState(false)

  useEffect(() => {
    // Set initial status after component mounts
    setOnline(isOnline())

    // Define event handlers
    const handleOnline = () => {
      setOnline(true)
    }

    const handleOffline = () => {
      setOnline(false)
      setShowOfflineWarning(true)

      // Hide the warning after 5 seconds
      setTimeout(() => {
        setShowOfflineWarning(false)
      }, 5000)
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return (
    <>
      {/* Always visible status indicator */}
      <div className="fixed bottom-4 right-4 z-50">
        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            online ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {online ? (
            <>
              <Wifi className="h-3.5 w-3.5" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Warning notification when going offline */}
      {showOfflineWarning && !online && (
        <div className="fixed top-4 right-4 z-50 max-w-sm">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">You are offline</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Some features may be limited. The app will automatically sync when you reconnect.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
