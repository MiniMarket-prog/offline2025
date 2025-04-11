"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createProduct, fetchCategories } from "@/lib/product-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { isOnline } from "@/lib/supabase"
import type { Database } from "@/types/supabase"
import { Textarea } from "@/components/ui/textarea"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export default function ProductForm() {
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [barcode, setBarcode] = useState("")
  const [stock, setStock] = useState("0")
  const [minStock, setMinStock] = useState("5")
  const [image, setImage] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [expiryNotificationDays, setExpiryNotificationDays] = useState("30")
  const [isPack, setIsPack] = useState(false)
  const [parentProductId, setParentProductId] = useState("")
  const [packQuantity, setPackQuantity] = useState("")
  const [packDiscountPercentage, setPackDiscountPercentage] = useState("")

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Database["public"]["Tables"]["products"]["Row"][]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Replace direct isOnline() call with state
  const [online, setOnline] = useState(false)

  useEffect(() => {
    // Set initial online status
    setOnline(isOnline())

    // Add event listeners to update online status in real-time
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  useEffect(() => {
    const loadCategories = async () => {
      const { categories } = await fetchCategories()
      setCategories(categories)
    }

    loadCategories()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const productData = {
      name,
      price: Number.parseFloat(price),
      barcode,
      stock: Number.parseInt(stock),
      min_stock: Number.parseInt(minStock),
      image: image || null,
      description: description || null,
      category_id: categoryId || null,
      purchase_price: purchasePrice ? Number.parseFloat(purchasePrice) : null,
      expiry_date: expiryDate || null,
      expiry_notification_days: expiryNotificationDays ? Number.parseInt(expiryNotificationDays) : null,
      is_pack: isPack,
      parent_product_id: parentProductId || null,
      pack_quantity: packQuantity ? Number.parseInt(packQuantity) : null,
      pack_discount_percentage: packDiscountPercentage ? Number.parseFloat(packDiscountPercentage) : null,
    }

    const { product, error } = await createProduct(productData)

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    setSuccess(true)
    resetForm()
    setLoading(false)
  }

  const resetForm = () => {
    setName("")
    setPrice("")
    setBarcode("")
    setStock("0")
    setMinStock("5")
    setImage("")
    setDescription("")
    setCategoryId("")
    setPurchasePrice("")
    setExpiryDate("")
    setExpiryNotificationDays("30")
    setIsPack(false)
    setParentProductId("")
    setPackQuantity("")
    setPackDiscountPercentage("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Product</CardTitle>
        <CardDescription>Create a new product in your inventory</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!online && (
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription>
                You are currently offline. Product will be created when you reconnect.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Product created successfully!</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (Optional)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">Minimum Stock Level</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image URL (Optional)</Label>
            <Input id="image" value={image} onChange={(e) => setImage(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryNotificationDays">Expiry Notification Days</Label>
              <Input
                id="expiryNotificationDays"
                type="number"
                min="0"
                value={expiryNotificationDays}
                onChange={(e) => setExpiryNotificationDays(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="isPack" checked={isPack} onCheckedChange={(checked) => setIsPack(checked === true)} />
            <Label htmlFor="isPack">This is a pack/bundle product</Label>
          </div>

          {isPack && (
            <div className="space-y-4 border p-4 rounded-md">
              <div className="space-y-2">
                <Label htmlFor="packQuantity">Pack Quantity</Label>
                <Input
                  id="packQuantity"
                  type="number"
                  min="1"
                  value={packQuantity}
                  onChange={(e) => setPackQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packDiscountPercentage">Pack Discount Percentage</Label>
                <Input
                  id="packDiscountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={packDiscountPercentage}
                  onChange={(e) => setPackDiscountPercentage(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
