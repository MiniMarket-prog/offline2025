"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Database, FileText } from "lucide-react"
import { generateDemoData, runDiagnostics } from "@/lib/setup-service"
import { Progress } from "@/components/ui/progress"
import BulkImportExport from "@/components/product/bulk-import-export"

export default function SystemOperations() {
  const [demoSuccess, setDemoSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null)
  const [runningDiagnostics, setRunningDiagnostics] = useState(false)
  const [diagnosticProgress, setDiagnosticProgress] = useState(0)
  const [importExportOpen, setImportExportOpen] = useState(false)

  const handleGenerateDemoData = async () => {
    setError(null)
    setDemoSuccess(false)
    setLoading(true)

    const { success, error } = await generateDemoData()

    if (success) {
      setDemoSuccess(true)
    } else {
      setError(`Failed to generate demo data: ${error}`)
    }

    setLoading(false)
  }

  const handleRunDiagnostics = async () => {
    setError(null)
    setDiagnosticResults(null)
    setRunningDiagnostics(true)
    setDiagnosticProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setDiagnosticProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return 90
        }
        return prev + 10
      })
    }, 300)

    try {
      const results = await runDiagnostics()
      setDiagnosticResults(results)
      setDiagnosticProgress(100)
    } catch (err: any) {
      setError(`Failed to run diagnostics: ${err.message}`)
    } finally {
      clearInterval(interval)
      setRunningDiagnostics(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Demo Data</CardTitle>
          <CardDescription>Generate sample data for testing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {demoSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Demo data generated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Generate sample products, categories, and sales data for testing purposes. This will create:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 space-y-1">
              <li>5 product categories</li>
              <li>10 sample products with varying stock levels</li>
              <li>10 sample sales transactions</li>
            </ul>
            <Button onClick={handleGenerateDemoData} disabled={loading}>
              <Database className="h-4 w-4 mr-2" />
              Generate Demo Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Import/Export</CardTitle>
          <CardDescription>Import and export product data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Import products from CSV or export your products to a CSV file.</p>
            <Button onClick={() => setImportExportOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Open Import/Export Tool
            </Button>
          </div>

          <BulkImportExport
            isOpen={importExportOpen}
            onClose={() => setImportExportOpen(false)}
            onSuccess={() => {
              setImportExportOpen(false)
              setDemoSuccess(true)
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Diagnostics</CardTitle>
          <CardDescription>Check system health and connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {runningDiagnostics && (
            <div className="space-y-2">
              <p className="text-sm">Running diagnostics...</p>
              <Progress value={diagnosticProgress} />
            </div>
          )}

          {diagnosticResults && (
            <div className="space-y-4">
              <h3 className="font-medium">Diagnostic Results:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">File Storage</span>
                    {diagnosticResults.fileStorage ? (
                      <span className="text-green-600 text-sm">Working</span>
                    ) : (
                      <span className="text-red-600 text-sm">Not Working</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Local Storage</span>
                    {diagnosticResults.localStorageAccess ? (
                      <span className="text-green-600 text-sm">Working</span>
                    ) : (
                      <span className="text-red-600 text-sm">Not Working</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Supabase Connection</span>
                    {diagnosticResults.supabaseConnection ? (
                      <span className="text-green-600 text-sm">Connected</span>
                    ) : (
                      <span className="text-amber-600 text-sm">Offline</span>
                    )}
                  </div>
                </div>
                <div className="border rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Data Integrity</span>
                    {diagnosticResults.dataIntegrity ? (
                      <span className="text-green-600 text-sm">Good</span>
                    ) : (
                      <span className="text-red-600 text-sm">Issues Found</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleRunDiagnostics} disabled={runningDiagnostics}>
            Run System Diagnostics
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
