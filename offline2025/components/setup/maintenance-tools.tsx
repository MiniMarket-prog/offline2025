"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Zap, Trash, Shield } from "lucide-react"
import { optimizeDatabase, clearCache, verifyDataIntegrity } from "@/lib/setup-service"

export default function MaintenanceTools() {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleOptimizeDatabase = async () => {
    setError(null)
    setSuccess(false)
    setMessage(null)
    setLoading(true)

    const { success, error } = await optimizeDatabase()

    if (success) {
      setSuccess(true)
      setMessage("Database optimized successfully!")
    } else {
      setError(`Failed to optimize database: ${error}`)
    }

    setLoading(false)
  }

  const handleClearCache = async () => {
    setError(null)
    setSuccess(false)
    setMessage(null)
    setLoading(true)

    const { success, error } = await clearCache()

    if (success) {
      setSuccess(true)
      setMessage("Cache cleared successfully!")
    } else {
      setError(`Failed to clear cache: ${error}`)
    }

    setLoading(false)
  }

  const handleVerifyDataIntegrity = async () => {
    setError(null)
    setSuccess(false)
    setMessage(null)
    setLoading(true)

    const { success, error, message, fixedIssues } = await verifyDataIntegrity()

    if (success) {
      setSuccess(true)
      setMessage(message || `Data integrity verified! ${fixedIssues || 0} issues fixed.`)
    } else {
      setError(`Failed to verify data integrity: ${error}`)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && message && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-800" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Performance Optimization</CardTitle>
          <CardDescription>Optimize database performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">Optimize your database for better performance. This will:</p>
          <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
            <li>Remove duplicate entries</li>
            <li>Clean up orphaned references</li>
            <li>Optimize data structures</li>
          </ul>
          <Button onClick={handleOptimizeDatabase} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Optimize Database
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Management</CardTitle>
          <CardDescription>Clear application cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Clear the application cache to free up memory and resolve potential issues. This will not delete your data,
            only temporary cached information.
          </p>
          <Button onClick={handleClearCache} disabled={loading}>
            <Trash className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Integrity</CardTitle>
          <CardDescription>Verify and fix data consistency issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Scan your database for data integrity issues and automatically fix them. This tool will check for:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
            <li>Missing required fields</li>
            <li>Invalid data types</li>
            <li>Inconsistent relationships</li>
          </ul>
          <Button onClick={handleVerifyDataIntegrity} disabled={loading}>
            <Shield className="h-4 w-4 mr-2" />
            Verify Data Integrity
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
