"use client"

import { useState, useEffect } from "react"

export function useMobile(breakpoint = 768): boolean {
  // Initialize with null to avoid hydration mismatch
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // Function to check if window width is less than breakpoint
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
    }

    // Set initial value
    checkMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile)

    // Clean up event listener
    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [breakpoint])

  // Return false during SSR to avoid hydration mismatch
  // Once mounted on client, it will return the actual value
  return isMobile === null ? false : isMobile
}
