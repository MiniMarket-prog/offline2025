"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchCategories } from "@/lib/product-service"
import { generateBarcodeSVG, printBarcode } from "@/lib/barcode-utils"
import { Package, Calendar, Printer, Edit } from "lucide-react"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

interface ProductDetailModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onEdit: (product: Product) => void
}

export default function ProductDetailModal({ product, isOpen, onClose, onEdit }: ProductDetailModalProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [barcodeImage, setBarcodeImage] = useState<string>("")

  useEffect(() => {
    const loadCategories = async () => {
      const { categories } = await fetchCategories()
      setCategories(categories)
    }

    if (isOpen) {
      loadCategories()
    }
  }, [isOpen])

  useEffect(() => {
    if (product?.barcode) {
      const barcodeImg = generateBarcodeSVG(product.barcode)
      setBarcodeImage(barcodeImg)
    }
  }, [product])

  if (!product) return null

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized"
    const category = categories.find((c) => c.id === categoryId)
    return category ? category.name : "Unknown"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const handlePrintBarcode = () => {
    if (product) {
      printBarcode(product)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <span className="mr-2">{product.name}</span>
            {product.is_pack && (
              <Badge variant="secondary" className="flex items-center">
                <Package className="h-3 w-3 mr-1" />
                Pack
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="barcode">Barcode</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Category</h4>
                <p>{getCategoryName(product.category_id)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Price</h4>
                <p className="font-bold">${product.price.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Purchase Price</h4>
                <p>${product.purchase_price?.toFixed(2) || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Barcode</h4>
                <p>{product.barcode}</p>
              </div>
              {product.is_pack && (
                <>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Pack Quantity</h4>
                    <p>{product.pack_quantity || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Pack Discount</h4>
                    <p>{product.pack_discount_percentage ? `${product.pack_discount_percentage}%` : "N/A"}</p>
                  </div>
                </>
              )}
            </div>

            {product.image && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-500 mb-2">Product Image</h4>
                <div className="relative h-40 w-40 mx-auto border rounded-md overflow-hidden">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Current Stock</h4>
                <p className={product.stock <= product.min_stock ? "text-red-600 font-bold" : ""}>
                  {product.stock} units
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Minimum Stock</h4>
                <p>{product.min_stock} units</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Expiry Date</h4>
                <div className="flex items-center">
                  {product.expiry_date && <Calendar className="h-4 w-4 mr-1 text-orange-500" />}
                  <p>{formatDate(product.expiry_date)}</p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Expiry Notification</h4>
                <p>{product.expiry_notification_days || 30} days before</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Stock History</h4>
              <div className="text-center text-gray-500 py-4 border rounded-md">
                Stock history will be available in a future update
              </div>
            </div>
          </TabsContent>

          <TabsContent value="barcode" className="space-y-4">
            <div className="flex flex-col items-center">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Barcode</h4>
              {barcodeImage ? (
                <div className="border p-4 rounded-md">
                  <img src={barcodeImage || "/placeholder.svg"} alt={`Barcode for ${product.barcode}`} />
                </div>
              ) : (
                <p className="text-gray-500">No barcode available</p>
              )}

              <Button className="mt-4" onClick={handlePrintBarcode}>
                <Printer className="h-4 w-4 mr-2" />
                Print Barcode
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-500">Created: {formatDate(product.created_at)}</div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => onEdit(product)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
