"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, PackageCheck, Clock } from "lucide-react"
import { isOnline } from "@/lib/supabase"
import { fetchLowStockProducts, fetchExpiringProducts } from "@/lib/product-service"

type Product = {
  id: string
  name: string
  barcode?: string
  category_id?: string
  category_name?: string
  price: number
  cost_price: number
  stock_quantity: number
  min_stock_level: number
  expiry_date?: string | null
  created_at: string
  updated_at: string
}

export default function InventorySummary() {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([])
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const online = isOnline()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch low stock products
        const lowStock = await fetchLowStockProducts()
        setLowStockProducts(Array.isArray(lowStock) ? lowStock : [])

        // Fetch expiring products
        const expiring = await fetchExpiringProducts()
        setExpiringProducts(Array.isArray(expiring) ? expiring : [])
      } catch (err) {
        console.error("Error loading inventory summary:", err)
        setError("Failed to load inventory data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">Inventory Alerts</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "success" : "destructive"}>{online ? "Online" : "Offline"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-8 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <p>{error}</p>
          </div>
        ) : (
          <Tabs defaultValue="low-stock">
            <TabsList className="mb-4">
              <TabsTrigger value="low-stock" className="flex items-center">
                <PackageCheck className="h-4 w-4 mr-2" />
                Low Stock ({lowStockProducts.length})
              </TabsTrigger>
              <TabsTrigger value="expiring" className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Expiring Soon ({expiringProducts.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="low-stock">
              {lowStockProducts.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No low stock products</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Product</th>
                        <th className="text-center py-2 px-2">Current Stock</th>
                        <th className="text-center py-2 px-2">Min Level</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((product) => (
                        <tr key={product.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-2">{product.name}</td>
                          <td className="text-center py-2 px-2">{product.stock_quantity}</td>
                          <td className="text-center py-2 px-2">{product.min_stock_level}</td>
                          <td className="text-center py-2 px-2">
                            <Badge variant={product.stock_quantity === 0 ? "destructive" : "warning"}>
                              {product.stock_quantity === 0 ? "Out of Stock" : "Low Stock"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="expiring">
              {expiringProducts.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No products expiring soon</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">Product</th>
                        <th className="text-center py-2 px-2">Expiry Date</th>
                        <th className="text-center py-2 px-2">Stock</th>
                        <th className="text-center py-2 px-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expiringProducts.map((product) => {
                        const daysToExpiry = product.expiry_date
                          ? Math.ceil(
                              (new Date(product.expiry_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24),
                            )
                          : 0

                        return (
                          <tr key={product.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-2">{product.name}</td>
                            <td className="text-center py-2 px-2">
                              {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : "N/A"}
                            </td>
                            <td className="text-center py-2 px-2">{product.stock_quantity}</td>
                            <td className="text-center py-2 px-2">
                              <Badge variant={daysToExpiry <= 7 ? "destructive" : "warning"}>
                                {daysToExpiry <= 0
                                  ? "Expired"
                                  : daysToExpiry === 1
                                    ? "Expires Tomorrow"
                                    : `Expires in ${daysToExpiry} days`}
                              </Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
