"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Star, PlusCircle, RefreshCw, AlertCircle } from "lucide-react"
import ProductImage from "../product/product-image"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface ProductGridProps {
  products: Product[]
  loading: boolean
  onAddToCart: (product: Product) => void
  favoriteProducts: Product[]
  onToggleFavorite: (product: Product) => void
}

export default function ProductGrid({
  products,
  loading,
  onAddToCart,
  favoriteProducts,
  onToggleFavorite,
}: ProductGridProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No products found</h3>
        <p className="text-sm text-gray-500 mt-2">Try adjusting your search or category filter</p>
      </div>
    )
  }

  const isFavorite = (product: Product) => {
    return favoriteProducts.some((fav) => fav.id === product.id)
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <div className="relative">
            <ProductImage
              src={product.image}
              alt={product.name}
              size="md"
              productId={product.id}
              className="w-full h-32 object-cover"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 bg-white/80 rounded-full h-8 w-8"
              onClick={() => onToggleFavorite(product)}
            >
              <Star
                className={`h-4 w-4 ${isFavorite(product) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
              />
            </Button>
          </div>
          <CardContent className="p-3">
            <div className="mb-2">
              <div className="font-medium line-clamp-1 text-sm">{product.name}</div>
              <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Stock: {product.stock}
                {product.stock <= product.min_stock && product.stock > 0 && (
                  <Badge variant="outline" className="ml-1 text-xs bg-yellow-50 text-yellow-800 border-yellow-200">
                    Low
                  </Badge>
                )}
                {product.stock === 0 && (
                  <Badge variant="outline" className="ml-1 text-xs bg-red-50 text-red-800 border-red-200">
                    Out
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onAddToCart(product)}
                disabled={product.stock === 0}
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
