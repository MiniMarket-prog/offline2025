"use client"

import { useState, useEffect } from "react"
import { fetchProducts, deleteProduct, fetchCategories } from "@/lib/product-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Package,
  Calendar,
  Search,
  Plus,
  FileText,
  Printer,
  Eye,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isOnline } from "@/lib/supabase"
import { printBarcode } from "@/lib/barcode-utils"
import ProductDetailModal from "./product-detail-modal"
import ProductFormModal from "./product-form-modal"
import StockAdjustmentModal from "./stock-adjustment-modal"
import BulkImportExport from "./bulk-import-export"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Replace direct isOnline() call with state
  const [online, setOnline] = useState(false)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out">("all")
  const [sortField, setSortField] = useState<"name" | "price" | "stock">("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // Add useEffect for online status
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

  const loadData = async () => {
    setLoading(true)
    setError(null)

    const [productsResult, categoriesResult] = await Promise.all([fetchProducts(), fetchCategories()])

    if (productsResult.error) {
      setError(productsResult.error)
    } else {
      setProducts(productsResult.products)
      applyFiltersAndSort(productsResult.products, searchQuery, categoryFilter, stockFilter, sortField, sortDirection)
    }

    if (!categoriesResult.error) {
      setCategories(categoriesResult.categories)
    }

    setLoading(false)
  }

  const applyFiltersAndSort = (
    productList: Product[],
    search: string,
    category: string,
    stock: string,
    sort: string,
    direction: string,
  ) => {
    let result = [...productList]

    // Apply search filter
    if (search) {
      const lowerSearch = search.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerSearch) || product.barcode.toLowerCase().includes(lowerSearch),
      )
    }

    // Apply category filter
    if (category !== "all") {
      result = result.filter((product) => product.category_id === category)
    }

    // Apply stock filter
    if (stock === "low") {
      result = result.filter((product) => product.stock <= product.min_stock && product.stock > 0)
    } else if (stock === "out") {
      result = result.filter((product) => product.stock === 0)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0
      if (sort === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sort === "price") {
        comparison = a.price - b.price
      } else if (sort === "stock") {
        comparison = a.stock - b.stock
      }
      return direction === "asc" ? comparison : -comparison
    })

    setFilteredProducts(result)
  }

  const handleSort = (field: "name" | "price" | "stock") => {
    const newDirection = field === sortField && sortDirection === "asc" ? "desc" : "asc"
    setSortField(field)
    setSortDirection(newDirection)
    applyFiltersAndSort(products, searchQuery, categoryFilter, stockFilter, field, newDirection)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const { success, error } = await deleteProduct(id)

      if (error) {
        setError(error)
      } else if (success) {
        const updatedProducts = products.filter((product) => product.id !== id)
        setProducts(updatedProducts)
        applyFiltersAndSort(updatedProducts, searchQuery, categoryFilter, stockFilter, sortField, sortDirection)
      }
    }
  }

  const handlePrintBarcode = (product: Product) => {
    printBarcode(product)
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)

  const paginate = (pageNumber: number) => {
    setCurrentPage(pageNumber)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFiltersAndSort(products, searchQuery, categoryFilter, stockFilter, sortField, sortDirection)
  }, [searchQuery, categoryFilter, stockFilter, sortField, sortDirection])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>Manage your inventory</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)}>
              <FileText className="h-4 w-4 mr-2" />
              Import/Export
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedProduct(null)
                setIsFormModalOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
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

          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or barcode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={stockFilter} onValueChange={(value: any) => setStockFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon" onClick={() => loadData()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">
                          <Button
                            variant="ghost"
                            className="flex items-center p-0 h-auto font-medium"
                            onClick={() => handleSort("name")}
                          >
                            Name
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortField === "name" ? "opacity-100" : "opacity-50"}`}
                            />
                          </Button>
                        </TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex items-center p-0 h-auto font-medium"
                            onClick={() => handleSort("price")}
                          >
                            Price
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortField === "price" ? "opacity-100" : "opacity-50"}`}
                            />
                          </Button>
                        </TableHead>
                        <TableHead>
                          <Button
                            variant="ghost"
                            className="flex items-center p-0 h-auto font-medium"
                            onClick={() => handleSort("stock")}
                          >
                            Stock
                            <ArrowUpDown
                              className={`ml-2 h-4 w-4 ${sortField === "stock" ? "opacity-100" : "opacity-50"}`}
                            />
                          </Button>
                        </TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        currentItems.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {product.image && (
                                  <div className="h-8 w-8 mr-2 bg-gray-100 rounded-md overflow-hidden">
                                    <img
                                      src={product.image || "/placeholder.svg"}
                                      alt={product.name}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  {product.name}
                                  {product.is_pack && <Package className="h-4 w-4 ml-2 inline text-blue-500" />}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getCategoryName(product.category_id)}</TableCell>
                            <TableCell>{product.barcode}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <span className={product.stock <= product.min_stock ? "text-red-600 font-bold" : ""}>
                                  {product.stock}
                                </span>
                                {product.stock <= product.min_stock && product.stock > 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    Low
                                  </Badge>
                                )}
                                {product.stock === 0 && (
                                  <Badge variant="destructive" className="ml-2">
                                    Out
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
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setIsDetailModalOpen(true)
                                  }}
                                  title="View Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setIsFormModalOpen(true)
                                  }}
                                  title="Edit Product"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedProduct(product)
                                    setIsStockModalOpen(true)
                                  }}
                                  title="Adjust Stock"
                                >
                                  <ArrowUpDown className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePrintBarcode(product)}
                                  title="Print Barcode"
                                >
                                  <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(product.id)}
                                  title="Delete Product"
                                >
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

                {/* Pagination */}
                {filteredProducts.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of{" "}
                      {filteredProducts.length} products
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm">
                        Page {currentPage} of {totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => paginate(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value: string) => {
                          setItemsPerPage(Number(value))
                          setCurrentPage(1)
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue placeholder="10 per page" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per page</SelectItem>
                          <SelectItem value="10">10 per page</SelectItem>
                          <SelectItem value="25">25 per page</SelectItem>
                          <SelectItem value="50">50 per page</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onEdit={(product) => {
          setIsDetailModalOpen(false)
          setIsFormModalOpen(true)
        }}
      />

      <ProductFormModal
        product={selectedProduct}
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={loadData}
      />

      <StockAdjustmentModal
        product={selectedProduct}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={loadData}
      />

      <BulkImportExport isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} onSuccess={loadData} />
    </>
  )
}
