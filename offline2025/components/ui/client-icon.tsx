"use client"

import type React from "react"
import { useEffect, useState } from "react"

export function ClientIcon({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    // Return a placeholder with the same dimensions to prevent layout shift
    return <span className="inline-block" style={{ width: "1em", height: "1em" }}></span>
  }

  return <>{children}</>
}
