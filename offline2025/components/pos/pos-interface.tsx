"use client"

import { useState, useEffect } from "react"
import { fetchProducts, fetchCategories } from "@/lib/product-service"
import { Card } from "@/components/ui/card"
import ProductSearch from "./product-search"
import ProductGrid from "./product-grid"
import Cart from "./cart"
import PaymentModal from "./payment-modal"
import RecentSales from "./recent-sales"
import FavoriteProducts from "./favorite-products"
import CategoryFilter from "./category-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type CartItem = {
  product: Product
  quantity: number
  discount: number
}

export default function PosInterface() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([])
  // Remove the ref to avoid the issue
  // const searchInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const isMobile = useMobile()

  // Load products and categories
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const [productsResult, categoriesResult] = await Promise.all([
          fetchProducts().catch(() => ({ products: [], error: "Failed to fetch products" })),
          fetchCategories().catch(() => ({ categories: [], error: "Failed to fetch categories" })),
        ])

        if (!productsResult.error) {
          setProducts(productsResult.products)
          setFilteredProducts(productsResult.products)
        } else {
          console.error("Error loading products:", productsResult.error)
          // Try to load from localStorage as fallback
          const storedProducts = localStorage.getItem("cached_products")
          if (storedProducts) {
            try {
              const parsedProducts = JSON.parse(storedProducts)
              setProducts(parsedProducts)
              setFilteredProducts(parsedProducts)
            } catch (e) {
              console.error("Error parsing stored products:", e)
            }
          }
        }

        if (!categoriesResult.error) {
          setCategories(categoriesResult.categories)
        } else {
          console.error("Error loading categories:", categoriesResult.error)
          // Try to load from localStorage as fallback
          const storedCategories = localStorage.getItem("cached_categories")
          if (storedCategories) {
            try {
              setCategories(JSON.parse(storedCategories))
            } catch (e) {
              console.error("Error parsing stored categories:", e)
            }
          }
        }

        // Load favorites from localStorage
        try {
          const storedFavorites = localStorage.getItem("favorite_products")
          if (storedFavorites) {
            const favoriteIds = JSON.parse(storedFavorites)
            const favorites = productsResult.products.filter((product: Product) => favoriteIds.includes(product.id))
            setFavoriteProducts(favorites)
          }
        } catch (e) {
          console.error("Error loading favorites:", e)
        }

        // Load recent sales from localStorage
        try {
          const storedSales = localStorage.getItem("recent_sales")
          if (storedSales) {
            setRecentSales(JSON.parse(storedSales))
          }
        } catch (e) {
          console.error("Error loading recent sales:", e)
        }
      } catch (error) {
        console.error("Error in loadData:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Add caching after successful data fetch
  useEffect(() => {
    // Cache products when they change
    if (products.length > 0) {
      try {
        localStorage.setItem("cached_products", JSON.stringify(products))
      } catch (e) {
        console.error("Error caching products:", e)
      }
    }
  }, [products])

  useEffect(() => {
    // Cache categories when they change
    if (categories.length > 0) {
      try {
        localStorage.setItem("cached_categories", JSON.stringify(categories))
      } catch (e) {
        console.error("Error caching categories:", e)
      }
    }
  }, [categories])

  // Filter products based on search query and category
  useEffect(() => {
    let result = [...products]

    // Apply search filter
    if (searchQuery) {
      const lowerSearch = searchQuery.toLowerCase()
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerSearch) || product.barcode.toLowerCase().includes(lowerSearch),
      )
    }

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((product) => product.category_id === selectedCategory)
    }

    setFilteredProducts(result)
  }, [searchQuery, selectedCategory, products])

  // Focus search input on mount - removed since we're not using ref anymore
  // useEffect(() => {
  //   if (searchInputRef.current) {
  //     searchInputRef.current.focus()
  //   }
  // }, [])

  // Handle barcode scan or manual entry
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    // Check for exact barcode match for auto-add
    const exactMatch = products.find((product) => product.barcode === query)
    if (exactMatch) {
      handleAddToCart(exactMatch)
      setSearchQuery("")
      toast({
        title: "Product Added",
        description: `${exactMatch.name} added to cart`,
      })
    }
  }

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      } else {
        return [...prevCart, { product, quantity: 1, discount: 0 }]
      }
    })
  }

  // Update cart item quantity
  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCart((prevCart) => {
      if (quantity <= 0) {
        return prevCart.filter((item) => item.product.id !== productId)
      }
      return prevCart.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    })
  }

  // Update cart item discount
  const handleUpdateDiscount = (productId: string, discount: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => (item.product.id === productId ? { ...item, discount } : item))
    })
  }

  // Remove item from cart
  const handleRemoveFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  // Clear cart
  const handleClearCart = () => {
    setCart([])
  }

  // Complete sale
  const handleCompleteSale = (paymentMethod: string, amountPaid: number, change: number) => {
    const sale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items: cart,
      paymentMethod,
      amountPaid,
      change,
      subtotal: calculateSubtotal(),
      tax: calculateTax(),
      total: calculateTotal(),
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    }

    // Add to recent sales
    const updatedSales = [sale, ...recentSales.slice(0, 9)]
    setRecentSales(updatedSales)
    localStorage.setItem("recent_sales", JSON.stringify(updatedSales))

    // Clear cart
    setCart([])
    setIsPaymentModalOpen(false)

    toast({
      title: "Sale Complete",
      description: `Total: $${calculateTotal().toFixed(2)}`,
    })
  }

  // Toggle favorite status
  const handleToggleFavorite = (product: Product) => {
    setFavoriteProducts((prevFavorites) => {
      let updatedFavorites
      const isFavorite = prevFavorites.some((fav) => fav.id === product.id)

      if (isFavorite) {
        updatedFavorites = prevFavorites.filter((fav) => fav.id !== product.id)
      } else {
        updatedFavorites = [...prevFavorites, product]
      }

      // Save to localStorage
      localStorage.setItem("favorite_products", JSON.stringify(updatedFavorites.map((product) => product.id)))

      return updatedFavorites
    })
  }

  // Calculate subtotal
  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemPrice = item.product.price * item.quantity
      const discountAmount = (itemPrice * item.discount) / 100
      return sum + (itemPrice - discountAmount)
    }, 0)
  }

  // Calculate tax (assuming 10% tax rate)
  const calculateTax = () => {
    return calculateSubtotal() * 0.1
  }

  // Calculate total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  // Get total item count
  const getTotalItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Add a useEffect to monitor online status
  useEffect(() => {
    const handleOnline = () => {
      console.log("POS interface detected online status")
      // You could add additional online handling here if needed
    }

    const handleOffline = () => {
      console.log("POS interface detected offline status")
      toast({
        title: "You're offline",
        description: "The app will continue to work and sync when you reconnect.",
      })
    }

    // Check initial status
    if (!navigator.onLine) {
      handleOffline()
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4">
        {/* Left side - Products */}
        <div className="w-full md:w-2/3 flex flex-col gap-4">
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <ProductSearch
                  // Remove the ref prop
                  // ref={searchInputRef}
                  value={searchQuery}
                  onChange={handleSearch}
                  onClear={() => setSearchQuery("")}
                />
              </div>
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
          </Card>

          <Card className="flex-1 overflow-hidden">
            <Tabs defaultValue="all" className="h-full flex flex-col">
              <div className="px-4 pt-2">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="all">All Products</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                  <TabsTrigger value="recent">Recent Sales</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="flex-1 overflow-auto p-4">
                <ProductGrid
                  products={filteredProducts}
                  loading={loading}
                  onAddToCart={handleAddToCart}
                  favoriteProducts={favoriteProducts}
                  onToggleFavorite={handleToggleFavorite}
                />
              </TabsContent>

              <TabsContent value="favorites" className="flex-1 overflow-auto p-4">
                <FavoriteProducts
                  products={favoriteProducts}
                  onAddToCart={handleAddToCart}
                  onToggleFavorite={handleToggleFavorite}
                />
              </TabsContent>

              <TabsContent value="recent" className="flex-1 overflow-auto p-4">
                <RecentSales sales={recentSales} onAddToCart={handleAddToCart} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right side - Cart */}
        <div className="w-full md:w-1/3">
          <Cart
            items={cart}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onCheckout={() => setIsPaymentModalOpen(true)}
            subtotal={calculateSubtotal()}
            tax={calculateTax()}
            total={calculateTotal()}
            itemCount={getTotalItemCount()}
          />
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onCompleteSale={handleCompleteSale}
        cart={cart}
        subtotal={calculateSubtotal()}
        tax={calculateTax()}
        total={calculateTotal()}
        itemCount={getTotalItemCount()}
      />
    </div>
  )
}
