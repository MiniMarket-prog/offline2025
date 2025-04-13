"use client"

import { useEffect } from "react"
import { setOfflineStatus } from "@/lib/supabase"

export function FirefoxOfflineDetector() {
  useEffect(() => {
    // Initial check
    const checkOfflineStatus = async () => {
      // For Firefox, navigator.onLine might not update immediately
      // when using the "Work Offline" mode
      const isCurrentlyOnline = await fetch("/api/ping", {
        method: "HEAD",
        cache: "no-cache",
        headers: { Pragma: "no-cache" },
      })
        .then(() => true)
        .catch(() => false)

      // If the fetch fails but navigator.onLine is true, we're in Firefox offline mode
      if (!isCurrentlyOnline && navigator.onLine) {
        console.log("Firefox offline mode detected")
        setOfflineStatus(true)
      } else if (isCurrentlyOnline && !navigator.onLine) {
        // If fetch succeeds but navigator.onLine is false, correct it
        setOfflineStatus(false)
      }
    }

    // Check immediately
    checkOfflineStatus()

    // Set up regular checks
    const intervalId = setInterval(checkOfflineStatus, 5000)

    // Listen for online/offline events
    const handleOnline = () => {
      console.log("Browser reports online")
      checkOfflineStatus() // Verify with a fetch
    }

    const handleOffline = () => {
      console.log("Browser reports offline")
      setOfflineStatus(true)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  // This component doesn't render anything
  return null
}
