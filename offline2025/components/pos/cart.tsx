"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingCart, Trash2, Plus, Minus, X, CreditCard, ShoppingBag, Percent } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type CartItem = {
  product: Product
  quantity: number
  discount: number
}

interface CartProps {
  items: CartItem[]
  onUpdateQuantity: (productId: string, quantity: number) => void
  onUpdateDiscount: (productId: string, discount: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
  onCheckout: () => void
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export default function Cart({
  items,
  onUpdateQuantity,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
  onCheckout,
  subtotal,
  tax,
  total,
  itemCount,
}: CartProps) {
  const [discountEditId, setDiscountEditId] = useState<string | null>(null)
  const [discountValue, setDiscountValue] = useState<string>("")

  const handleDiscountClick = (item: CartItem) => {
    setDiscountEditId(item.product.id)
    setDiscountValue(item.discount.toString())
  }

  const handleDiscountSave = (productId: string) => {
    const discount = Number.parseFloat(discountValue) || 0
    onUpdateDiscount(productId, Math.min(Math.max(discount, 0), 100))
    setDiscountEditId(null)
  }

  const handleDiscountCancel = () => {
    setDiscountEditId(null)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="py-4 px-6">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Cart
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </Badge>
            )}
          </CardTitle>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={onClearCart}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <ShoppingBag className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium">Your cart is empty</h3>
            <p className="text-sm text-gray-500 mt-2">Add products to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100%-2rem)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const itemTotal = item.product.price * item.quantity
                  const discountAmount = (itemTotal * item.discount) / 100
                  const finalTotal = itemTotal - discountAmount

                  return (
                    <TableRow key={item.product.id}>
                      <TableCell className="align-top">
                        <div>
                          <div className="font-medium">{item.product.name}</div>
                          <div className="text-sm text-gray-500">{item.product.barcode}</div>
                          {discountEditId === item.product.id ? (
                            <div className="flex items-center mt-1">
                              <Input
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="h-7 w-16 text-xs"
                                min="0"
                                max="100"
                              />
                              <span className="ml-1 text-xs">%</span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 ml-1"
                                onClick={() => handleDiscountSave(item.product.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleDiscountCancel}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="link"
                              className="p-0 h-auto text-xs flex items-center text-blue-500"
                              onClick={() => handleDiscountClick(item)}
                            >
                              <Percent className="h-3 w-3 mr-1" />
                              {item.discount > 0 ? `${item.discount}% off` : "Add discount"}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right align-top">${item.product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-center align-top">
                        <div className="flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium align-top">
                        ${finalTotal.toFixed(2)}
                        {item.discount > 0 && (
                          <div className="text-xs text-green-600">Save: ${discountAmount.toFixed(2)}</div>
                        )}
                      </TableCell>
                      <TableCell className="w-10 align-top">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => onRemoveItem(item.product.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      <CardFooter className="flex flex-col p-6 border-t">
        <div className="w-full space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Tax (10%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <Button className="w-full mt-4" size="lg" disabled={items.length === 0} onClick={onCheckout}>
          <CreditCard className="mr-2 h-5 w-5" />
          Checkout
        </Button>
      </CardFooter>
    </Card>
  )
}
