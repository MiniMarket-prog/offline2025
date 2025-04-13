"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Clock, CreditCard, Banknote, Eye, PlusCircle } from "lucide-react"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface RecentSalesProps {
  sales: any[]
  onAddToCart: (product: Product) => void
}

export default function RecentSales({ sales, onAddToCart }: RecentSalesProps) {
  const [selectedSale, setSelectedSale] = useState<any | null>(null)

  if (sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Clock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium">No recent sales</h3>
        <p className="text-sm text-gray-500 mt-2">Complete a sale to see it here</p>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getPaymentIcon = (method: string) => {
    if (method === "card") return <CreditCard className="h-4 w-4" />
    return <Banknote className="h-4 w-4" />
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sales.map((sale) => (
          <Card key={sale.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-sm text-gray-500">{formatDate(sale.date)}</div>
                  <div className="font-bold">${sale.total.toFixed(2)}</div>
                </div>
                <Badge variant="outline" className="flex items-center">
                  {getPaymentIcon(sale.paymentMethod)}
                  <span className="ml-1 capitalize">{sale.paymentMethod}</span>
                </Badge>
              </div>
              <div className="text-sm">
                {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" onClick={() => setSelectedSale(sale)}>
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sale Details Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="text-sm text-gray-500">{selectedSale && formatDate(selectedSale.date)}</div>
                <div className="flex items-center">
                  <Badge variant="outline" className="flex items-center mr-2">
                    {selectedSale && getPaymentIcon(selectedSale.paymentMethod)}
                    <span className="ml-1 capitalize">{selectedSale && selectedSale.paymentMethod}</span>
                  </Badge>
                  <span className="font-bold">${selectedSale && selectedSale.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[300px]">
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
                  {selectedSale &&
                    selectedSale.items.map((item: any) => {
                      const itemTotal = item.product.price * item.quantity
                      const discountAmount = (itemTotal * item.discount) / 100
                      const finalTotal = itemTotal - discountAmount

                      return (
                        <TableRow key={item.product.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product.name}</div>
                              <div className="text-sm text-gray-500">{item.product.barcode}</div>
                              {item.discount > 0 && (
                                <div className="text-xs text-green-600">{item.discount}% discount</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">${item.product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right font-medium">${finalTotal.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onAddToCart(item.product)}
                            >
                              <PlusCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            </ScrollArea>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${selectedSale && selectedSale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>${selectedSale && selectedSale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>${selectedSale && selectedSale.total.toFixed(2)}</span>
              </div>
              {selectedSale && selectedSale.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Amount Paid</span>
                    <span>${selectedSale.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Change</span>
                    <span>${selectedSale.change.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
