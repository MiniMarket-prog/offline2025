"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Download, Trash, ImageIcon, RefreshCw } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import {
  downloadAllProductImages,
  clearLocalImages,
  getLocalImagesCount,
  getLocalImagesSize,
} from "@/lib/image-downloader"
import { isOnline } from "@/lib/supabase"

export default function ImageDownloader() {
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [imagesCount, setImagesCount] = useState(0)
  const [imagesSize, setImagesSize] = useState(0)
  const [online, setOnline] = useState(true)

  useEffect(() => {
    // Update stats on mount
    updateStats()

    // Check online status
    setOnline(isOnline())

    // Set up event listeners for online/offline status
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Set up interval to update stats
    const interval = setInterval(updateStats, 5000)

    return () => {
      clearInterval(interval)
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const updateStats = () => {
    setImagesCount(getLocalImagesCount())
    setImagesSize(getLocalImagesSize())
    setOnline(isOnline())
  }

  const handleDownloadImages = async () => {
    setError(null)
    setSuccess(false)
    setDownloading(true)
    setProgress(0)
    setResult(null)

    if (!online) {
      setError("Cannot download images while offline")
      setDownloading(false)
      return
    }

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 90))
      }, 300)

      const result = await downloadAllProductImages()
      clearInterval(progressInterval)
      setProgress(100)
      setResult(result)
      setSuccess(true)
      updateStats()
    } catch (error: any) {
      setError(`Failed to download images: ${error.message}`)
    } finally {
      setDownloading(false)
    }
  }

  const handleClearImages = async () => {
    setError(null)
    setSuccess(false)

    try {
      const count = clearLocalImages()
      setSuccess(true)
      setResult({ total: count, success: count, failed: 0 })
      updateStats()
    } catch (error: any) {
      setError(`Failed to clear images: ${error.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
          <CardDescription>Download and manage product images for offline use</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>
                {result
                  ? `Operation completed successfully! Downloaded ${result.success} images, ${result.failed} failed.`
                  : "Operation completed successfully!"}
              </AlertDescription>
            </Alert>
          )}

          {downloading && (
            <div className="space-y-2">
              <p className="text-sm">Downloading images...</p>
              <Progress value={progress} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-4">
              <div className="flex items-center space-x-2 mb-2">
                <ImageIcon className="h-5 w-5 text-blue-600" />
                <h3 className="font-medium">Stored Images</h3>
              </div>
              <p className="text-2xl font-bold">{imagesCount}</p>
              <p className="text-sm text-gray-500">Images stored locally</p>
            </div>
            <div className="border rounded-md p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Download className="h-5 w-5 text-green-600" />
                <h3 className="font-medium">Storage Used</h3>
              </div>
              <p className="text-2xl font-bold">{imagesSize} KB</p>
              <p className="text-sm text-gray-500">Local storage space used</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Download Product Images</h3>
              <p className="text-sm text-gray-500">
                Download all product images for offline use. This ensures your products display correctly even when
                offline.
              </p>
              <Button onClick={handleDownloadImages} disabled={downloading || !online} className="w-full sm:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Download All Product Images
              </Button>
              {!online && (
                <p className="text-sm text-amber-600 mt-1">
                  You are currently offline. Connect to the internet to download images.
                </p>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">Clear Local Images</h3>
              <p className="text-sm text-gray-500">
                Remove all locally stored product images to free up space. Images will be fetched from remote URLs when
                needed.
              </p>
              <Button
                onClick={handleClearImages}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={imagesCount === 0}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear Local Images
              </Button>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">Refresh Image Stats</h3>
              <p className="text-sm text-gray-500">Update the image storage statistics displayed above.</p>
              <Button onClick={updateStats} variant="ghost" className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Stats
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
