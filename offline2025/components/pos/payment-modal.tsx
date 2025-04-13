"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Banknote, Receipt } from "lucide-react"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type CartItem = {
  product: Product
  quantity: number
  discount: number
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onCompleteSale: (paymentMethod: string, amountPaid: number, change: number) => void
  cart: CartItem[]
  subtotal: number
  tax: number
  total: number
  itemCount: number
}

export default function PaymentModal({
  isOpen,
  onClose,
  onCompleteSale,
  cart,
  subtotal,
  tax,
  total,
  itemCount,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [amountPaid, setAmountPaid] = useState<string>(total.toFixed(2))
  const [change, setChange] = useState<number>(0)

  useEffect(() => {
    if (isOpen) {
      setAmountPaid(total.toFixed(2))
      setPaymentMethod("cash")
      calculateChange(total.toFixed(2))
    }
  }, [isOpen, total])

  const calculateChange = (amount: string) => {
    const paid = Number.parseFloat(amount) || 0
    setChange(Math.max(0, paid - total))
  }

  const handleAmountPaidChange = (value: string) => {
    setAmountPaid(value)
    calculateChange(value)
  }

  const handleQuickAmount = (amount: number) => {
    const newAmount = (Math.ceil(total / amount) * amount).toFixed(2)
    setAmountPaid(newAmount)
    calculateChange(newAmount)
  }

  const handleCompleteSale = () => {
    const paid = Number.parseFloat(amountPaid) || 0
    onCompleteSale(paymentMethod, paid, change)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Sale</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Tabs defaultValue="cash" onValueChange={(value) => setPaymentMethod(value as "cash" | "card")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cash">
                <Banknote className="mr-2 h-4 w-4" />
                Cash
              </TabsTrigger>
              <TabsTrigger value="card">
                <CreditCard className="mr-2 h-4 w-4" />
                Card
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cash" className="space-y-4 pt-4">
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" onClick={() => handleQuickAmount(5)}>
                  $5
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(10)}>
                  $10
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(20)}>
                  $20
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(50)}>
                  $50
                </Button>
                <Button variant="outline" onClick={() => handleQuickAmount(100)}>
                  $100
                </Button>
                <Button variant="outline" onClick={() => setAmountPaid(total.toFixed(2))}>
                  Exact
                </Button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount Paid</label>
                <div className="flex items-center">
                  <span className="text-lg mr-2">$</span>
                  <Input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => handleAmountPaidChange(e.target.value)}
                    min={total}
                    step="0.01"
                    className="text-lg"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-md">
                <span className="font-medium">Change</span>
                <span className="text-xl font-bold">${change.toFixed(2)}</span>
              </div>
            </TabsContent>

            <TabsContent value="card" className="pt-4">
              <div className="p-6 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="mb-4">Process card payment on your terminal</p>
                <p className="text-2xl font-bold mb-6">${total.toFixed(2)}</p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-500">
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCompleteSale}
              disabled={paymentMethod === "cash" && Number.parseFloat(amountPaid) < total}
            >
              <Receipt className="mr-2 h-4 w-4" />
              Complete Sale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
