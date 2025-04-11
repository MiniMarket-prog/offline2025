"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Plus, Minus } from "lucide-react"
import { updateStock } from "@/lib/product-service"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]

interface StockAdjustmentModalProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function StockAdjustmentModal({ product, isOpen, onClose, onSuccess }: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState("1")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")
  const [reason, setReason] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!product) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const adjustmentQuantity = Number.parseInt(quantity) * (adjustmentType === "add" ? 1 : -1)

    try {
      const { product: updatedProduct, error } = await updateStock(product.id, adjustmentQuantity, reason)

      if (error) throw new Error(error)

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock for {product.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Stock updated successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Current Stock: {product.stock} units</Label>
          </div>

          <div className="space-y-2">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(value) => setAdjustmentType(value as "add" | "remove")}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="flex items-center">
                  <Plus className="h-4 w-4 mr-1 text-green-600" />
                  Add Stock
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="remove" />
                <Label htmlFor="remove" className="flex items-center">
                  <Minus className="h-4 w-4 mr-1 text-red-600" />
                  Remove Stock
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., New shipment received, Damaged goods, etc."
            />
          </div>

          <div className="pt-2">
            <Alert className={adjustmentType === "add" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <AlertDescription>
                {adjustmentType === "add"
                  ? `Adding ${quantity} units will increase stock to ${product.stock + Number.parseInt(quantity)} units.`
                  : `Removing ${quantity} units will decrease stock to ${Math.max(
                      0,
                      product.stock - Number.parseInt(quantity),
                    )} units.`}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (adjustmentType === "remove" && Number.parseInt(quantity) > product.stock)}
            >
              {loading ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
