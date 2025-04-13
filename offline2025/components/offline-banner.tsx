"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi, RefreshCw, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { processSyncQueue, getSyncQueueStatus, retryFailedSyncItems } from "@/lib/sync-manager"
import { Progress } from "@/components/ui/progress"

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [showBanner, setShowBanner] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ processed: number; failed: number } | null>(null)
  const [queueStatus, setQueueStatus] = useState<{ total: number; pending: number; failed: number }>({
    total: 0,
    pending: 0,
    failed: 0,
  })

  // Update queue status periodically
  useEffect(() => {
    const updateQueueStatus = async () => {
      try {
        const status = await getSyncQueueStatus()
        setQueueStatus({
          total: status.total,
          pending: status.pending,
          failed: status.failed,
        })

        // Show banner if there are pending items
        if (status.total > 0) {
          setShowBanner(true)
        }
      } catch (error) {
        console.error("Error updating queue status:", error)
      }
    }

    // Update immediately
    updateQueueStatus()

    // Then update every 5 seconds
    const interval = setInterval(updateQueueStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    // Set initial status
    setIsOnline(navigator.onLine)
    setShowBanner(!navigator.onLine || queueStatus.total > 0)

    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true)
      // Show reconnected message briefly
      setShowBanner(true)
      // Auto-sync when coming back online
      handleSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowBanner(true)
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

  const handleSync = async () => {
    if (!isOnline) return

    setSyncing(true)
    setSyncResult(null)

    try {
      const result = await processSyncQueue()
      if (result.success) {
        setSyncResult({
          processed: result.processed,
          failed: result.failed,
        })

        // Update queue status
        const status = await getSyncQueueStatus()
        setQueueStatus({
          total: status.total,
          pending: status.pending,
          failed: status.failed,
        })

        // Hide the banner if no pending items and online
        if (status.total === 0 && isOnline) {
          setTimeout(() => {
            setShowBanner(false)
          }, 3000)
        }
      }
    } catch (error) {
      console.error("Error syncing data:", error)
    } finally {
      setSyncing(false)
    }
  }

  const handleRetryFailed = async () => {
    if (!isOnline) return

    setSyncing(true)
    try {
      await retryFailedSyncItems()
      // Update queue status
      const status = await getSyncQueueStatus()
      setQueueStatus({
        total: status.total,
        pending: status.pending,
        failed: status.failed,
      })
    } catch (error) {
      console.error("Error retrying failed items:", error)
    } finally {
      setSyncing(false)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-16 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Alert
        className={
          isOnline
            ? queueStatus.failed > 0
              ? "bg-amber-50 border-amber-200 text-amber-800"
              : "bg-green-50 border-green-200 text-green-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center">
            {isOnline ? <Wifi className="h-4 w-4 mr-2" /> : <WifiOff className="h-4 w-4 mr-2" />}
            <AlertDescription>
              {!isOnline
                ? "You're offline. The app will continue to work and sync when you reconnect."
                : queueStatus.total > 0
                  ? `${queueStatus.pending} pending changes to sync.`
                  : "You're back online!"}
              {queueStatus.failed > 0 && (
                <span className="ml-1 text-red-600 font-medium">{queueStatus.failed} failed.</span>
              )}
            </AlertDescription>
          </div>

          {isOnline && queueStatus.total > 0 && (
            <Button size="sm" variant="outline" className="ml-2 bg-white" onClick={handleSync} disabled={syncing}>
              {syncing ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
              Sync
            </Button>
          )}

          {isOnline && queueStatus.failed > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="ml-2 bg-white"
              onClick={handleRetryFailed}
              disabled={syncing}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>

        {syncing && (
          <div className="mt-2">
            <Progress value={50} className="h-1" />
          </div>
        )}

        {syncResult && (
          <div className="mt-2 text-sm">
            {syncResult.processed > 0 ? (
              <span className="text-green-600">Successfully synced {syncResult.processed} changes.</span>
            ) : null}
            {syncResult.failed > 0 ? (
              <span className="text-red-600 ml-1">Failed to sync {syncResult.failed} changes.</span>
            ) : null}
          </div>
        )}
      </Alert>
    </div>
  )
}
