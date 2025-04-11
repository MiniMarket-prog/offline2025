"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Download, Upload, FileText } from "lucide-react"
import { createProduct } from "@/lib/product-service"
import { Textarea } from "@/components/ui/textarea"
import { getProducts } from "@/lib/data-bridge"
import type { Database } from "@/types/supabase"

// Define the product types directly from the Database type
type ProductRow = Database["public"]["Tables"]["products"]["Row"]

// Define a type for product creation that matches what createProduct expects
type CreateProductInput = Omit<ProductRow, "id" | "created_at">

interface BulkImportExportProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function BulkImportExport({ isOpen, onClose, onSuccess }: BulkImportExportProps) {
  const [importData, setImportData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [failCount, setFailCount] = useState(0)

  const handleExport = () => {
    try {
      const products = getProducts() as ProductRow[]

      // Convert to CSV
      const headers =
        "name,barcode,price,stock,min_stock,category_id,purchase_price,expiry_date,is_pack,pack_quantity,pack_discount_percentage,image,description,expiry_notification_days,parent_product_id\n"

      const csvContent = products.reduce((acc, product) => {
        return (
          acc +
          `"${product.name}",` +
          `"${product.barcode}",` +
          `${product.price},` +
          `${product.stock},` +
          `${product.min_stock},` +
          `"${product.category_id || ""}",` +
          `${product.purchase_price || ""},` +
          `"${product.expiry_date || ""}",` +
          `"${product.is_pack ? "TRUE" : "FALSE"}",` +
          `${product.pack_quantity || ""},` +
          `${product.pack_discount_percentage || ""},` +
          `"${product.image || ""}",` +
          `"${product.description || ""}",` +
          `${product.expiry_notification_days || ""},` +
          `"${product.parent_product_id || ""}"\n`
        )
      }, headers)

      // Create download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `products_export_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError("Failed to export products: " + err.message)
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleImport = async () => {
    setLoading(true)
    setError(null)
    setSuccess(false)
    setSuccessCount(0)
    setFailCount(0)

    try {
      // Parse CSV data
      const lines = importData.trim().split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())

      let successCount = 0
      let failCount = 0

      // Process each line (skip header)
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = parseCSVLine(lines[i])

          if (values.length !== headers.length) {
            failCount++
            continue
          }

          // Create object with all required fields initialized
          const productData: CreateProductInput = {
            name: "",
            barcode: "",
            price: 0,
            stock: 0,
            min_stock: 0,
            is_pack: false,
            image: null,
            description: null,
            category_id: null,
            purchase_price: null,
            expiry_date: null,
            expiry_notification_days: null,
            parent_product_id: null,
            pack_quantity: null,
            pack_discount_percentage: null,
          }

          headers.forEach((header, index) => {
            const value = values[index]

            // Skip if the header doesn't match any product field
            if (!(header in productData)) return

            // Handle empty values
            if (value === "") return // Keep the default null value

            // Handle specific field types
            if (header === "is_pack") {
              productData.is_pack = value === "TRUE"
              return
            }

            // Convert numeric values
            if (
              [
                "price",
                "stock",
                "min_stock",
                "purchase_price",
                "pack_quantity",
                "pack_discount_percentage",
                "expiry_notification_days",
              ].includes(header)
            ) {
              ;(productData as any)[header] = Number(value)
              return
            }
            // For other fields, assign as is
            ;(productData as any)[header] = value
          })

          // Create product
          const { error } = await createProduct(productData)

          if (error) {
            failCount++
          } else {
            successCount++
          }
        } catch (err) {
          failCount++
        }
      }

      setSuccessCount(successCount)
      setFailCount(failCount)
      setSuccess(true)

      if (successCount > 0) {
        setTimeout(() => {
          onSuccess()
        }, 2000)
      }
    } catch (err: any) {
      setError("Failed to import products: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to parse CSV line considering quoted values
  const parseCSVLine = (line: string): string[] => {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }

    result.push(current)
    return result
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Import/Export Products</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 pt-4">
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Export Products to CSV</h3>
              <p className="text-sm text-gray-500 mb-4">
                Download all your products as a CSV file that you can edit in Excel or other spreadsheet software.
              </p>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Products
              </Button>
            </div>

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-800" />
                <AlertDescription>Products exported successfully!</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4 pt-4">
            <Alert>
              <AlertDescription>
                Paste your CSV data below. The first line should contain headers: name, barcode, price, stock,
                min_stock, etc.
              </AlertDescription>
            </Alert>

            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="name,barcode,price,stock,min_stock,..."
              rows={10}
            />

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-800" />
                <AlertDescription>
                  Import completed: {successCount} products imported successfully, {failCount} failed.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button onClick={handleImport} disabled={loading || !importData.trim()}>
                <Upload className="h-4 w-4 mr-2" />
                {loading ? "Importing..." : "Import Products"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
