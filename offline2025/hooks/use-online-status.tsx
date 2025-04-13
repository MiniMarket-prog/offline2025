"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus() {
  // Initialize with null to avoid hydration mismatch
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    // Set initial status after component mounts
    setIsOnline(navigator.onLine)

    // Define event handlers
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // Return false during SSR to avoid hydration mismatch
  return isOnline === null ? true : isOnline
}
