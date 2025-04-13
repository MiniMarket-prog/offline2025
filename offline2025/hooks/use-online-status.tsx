"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus() {
  // Initialize with the current online status
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true)

  useEffect(() => {
    // Define event handlers
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Force an immediate check
    setIsOnline(navigator.onLine)

    // Clean up event listeners
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
