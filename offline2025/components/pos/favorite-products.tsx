"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, PlusCircle, AlertCircle } from "lucide-react"
import ProductImage from "../product/product-image"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface FavoriteProductsProps {
  products: Product[]
  onAddToCart: (product: Product) => void
  onToggleFavorite: (product: Product) => void
}

export default function FavoriteProducts({ products, onAddToCart, onToggleFavorite }: FavoriteProductsProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No favorite products</h3>
        <p className="text-sm text-gray-500 mt-2">Click the star icon on products to add them to your favorites</p>
      </div>
    )
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
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            </Button>
          </div>
          <CardContent className="p-3">
            <div className="mb-2">
              <div className="font-medium line-clamp-1 text-sm">{product.name}</div>
              <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Stock: {product.stock}</div>
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
