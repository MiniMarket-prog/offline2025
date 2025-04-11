"use client"

import { useState, useEffect } from "react"
import { fetchProducts, deleteProduct, fetchCategories } from "@/lib/product-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, Trash2, Edit, Package, Calendar } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isOnline } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [online, setOnline] = useState(false) // Changed to useState

  // Added useEffect for online status
  useEffect(() => {
    // Set initial online status
    setOnline(isOnline())
    
    // Add event listeners to update online status in real-time
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const [productsResult, categoriesResult] = await Promise.all([fetchProducts(), fetchCategories()])

    if (productsResult.error) {
      setError(productsResult.error)
    } else {
      setProducts(productsResult.products)
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.categories)
    }

    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { success, error } = await deleteProduct(id)

      if (error) {
        setError(error)
      } else if (success) {
        setProducts(products.filter((product) => product.id !== id))
      }
    }
  }

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Unknown"
  }

  const isExpiringSoon = (expiryDate: string | null, days: number | null = 30) => {
    if (!expiryDate) return false

    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return daysUntilExpiry >= 0 && daysUntilExpiry <= (days || 30)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage your inventory</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!online && (
          <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertDescription>You are currently offline. Product list may not be up to date.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          {product.name}
                          {product.is_pack && <Package className="h-4 w-4 ml-2 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell>{product.barcode}</TableCell>
                      <TableCell>{getCategoryName(product.category_id)}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {product.stock}
                          {product.stock <= product.min_stock && (
                            <Badge variant="destructive" className="ml-2">
                              Low
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {isExpiringSoon(product.expiry_date, product.expiry_notification_days) && (
                            <Badge variant="warning" className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(product.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}