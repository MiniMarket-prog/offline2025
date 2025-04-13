"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Database, HardDrive, Save } from "lucide-react"
import { getStorageType } from "@/lib/data-bridge"

export function StorageStatus() {
  const [storageType, setStorageType] = useState<"indexeddb" | "localstorage" | "memory" | null>(null)
  const [isPrivate, setIsPrivate] = useState<boolean>(false)

  useEffect(() => {
    // Get storage type after component mounts
    const checkStorageType = async () => {
      try {
        const { isPrivateBrowsingMode } = await import("@/lib/data-bridge")
        const type = getStorageType()
        const privateBrowsing = await isPrivateBrowsingMode()

        setStorageType(type)
        setIsPrivate(privateBrowsing)
      } catch (error) {
        console.error("Error getting storage type:", error)
      }
    }

    checkStorageType()
  }, [])

  if (!storageType) return null

  const getStorageIcon = () => {
    switch (storageType) {
      case "indexeddb":
        return <Database className="h-3.5 w-3.5 mr-1" />
      case "localstorage":
        return <Save className="h-3.5 w-3.5 mr-1" />
      case "memory":
        return <HardDrive className="h-3.5 w-3.5 mr-1" />
      default:
        return null
    }
  }

  const getStorageLabel = () => {
    switch (storageType) {
      case "indexeddb":
        return "IndexedDB"
      case "localstorage":
        return "LocalStorage"
      case "memory":
        return "In-Memory"
      default:
        return "Unknown"
    }
  }

  const getStorageVariant = () => {
    switch (storageType) {
      case "indexeddb":
        return "success"
      case "localstorage":
        return "warning"
      case "memory":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStorageVariant() as any} className="flex items-center gap-1">
        {getStorageIcon()}
        <span>{getStorageLabel()}</span>
      </Badge>
      {isPrivate && (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200">
          Private Browsing
        </Badge>
      )}
    </div>
  )
}
