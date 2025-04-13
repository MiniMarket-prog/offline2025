import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Sale = {
  id: string
  items: any[]
  subtotal: number
  tax: number
  total: number
  payment_method: string
  created_at: string
  cashier_id: string
}

// Local storage keys
const PRODUCTS_KEY = "mini_market_products"
const CATEGORIES_KEY = "mini_market_categories"
const SALES_KEY = "mini_market_sales"
const FAVORITES_KEY = "mini_market_favorites"
const SYNC_QUEUE_KEY = "mini_market_sync_queue"
const CURRENT_USER_KEY = "mini_market_current_user"

// Products
export const getLocalProducts = (): Product[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(PRODUCTS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting products from local storage:", error)
    return []
  }
}

export const storeProducts = (products: Product[]): boolean => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
    return true
  } catch (error) {
    console.error("Error storing products in local storage:", error)
    return false
  }
}

// Categories
export const getLocalCategories = (): Category[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(CATEGORIES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting categories from local storage:", error)
    return []
  }
}

export const storeCategories = (categories: Category[]): boolean => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    return true
  } catch (error) {
    console.error("Error storing categories in local storage:", error)
    return false
  }
}

// Sales
export const getLocalSales = (): Sale[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(SALES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting sales from local storage:", error)
    return []
  }
}

export const storeLocalSales = (sales: Sale[]): boolean => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(SALES_KEY, JSON.stringify(sales))
    return true
  } catch (error) {
    console.error("Error storing sales in local storage:", error)
    return false
  }
}

// Favorites
export const getFavorites = (): Product[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting favorites from local storage:", error)
    return []
  }
}

export const storeFavorites = (favorites: Product[]): boolean => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return true
  } catch (error) {
    console.error("Error storing favorites in local storage:", error)
    return false
  }
}

// Sync Queue
export const getSyncQueue = (): any[] => {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(SYNC_QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting sync queue from local storage:", error)
    return []
  }
}

export const storeLocalSyncQueue = (queue: any[]): boolean => {
  if (typeof window === "undefined") return false
  try {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
    return true
  } catch (error) {
    console.error("Error storing sync queue in local storage:", error)
    return false
  }
}

export const removeFromSyncQueue = (id: string): boolean => {
  if (typeof window === "undefined") return false
  try {
    const queue = getSyncQueue()
    const updatedQueue = queue.filter((item) => item.id !== id)
    return storeLocalSyncQueue(updatedQueue)
  } catch (error) {
    console.error("Error removing item from sync queue:", error)
    return false
  }
}

// Add to sync queue
export const addToSyncQueue = (action: string, data: any): boolean => {
  if (typeof window === "undefined") return false
  try {
    const queue = getSyncQueue()
    queue.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: new Date().toISOString(),
    })
    return storeLocalSyncQueue(queue)
  } catch (error) {
    console.error("Error adding to sync queue:", error)
    return false
  }
}

// User management
export const storeCurrentUser = (user: any): boolean => {
  if (typeof window === "undefined") return false
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
    return true
  } catch (error) {
    console.error("Error storing current user in local storage:", error)
    return false
  }
}

export const getCurrentUser = (): any => {
  if (typeof window === "undefined") return null
  try {
    const data = localStorage.getItem(CURRENT_USER_KEY)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error("Error getting current user from local storage:", error)
    return null
  }
}

// Add a function to ensure we always have some data to show when offline
export const ensureOfflineData = async () => {
  try {
    // Check if we have products in local storage
    const products = getLocalProducts()
    const categories = getLocalCategories()

    // If we don't have any data cached, and we're online, fetch and cache it
    if (products.length === 0 || categories.length === 0) {
      const { isOnline } = await import("./supabase")
      if (isOnline()) {
        const { supabase } = await import("./supabase")

        // Fetch and store products
        const { data: productsData } = await supabase.from("products").select("*")
        if (productsData && productsData.length > 0) {
          storeProducts(productsData)
        }

        // Fetch and store categories
        const { data: categoriesData } = await supabase.from("categories").select("*")
        if (categoriesData && categoriesData.length > 0) {
          storeCategories(categoriesData)
        }
      }
    }
  } catch (error) {
    console.error("Error ensuring offline data:", error)
  }
}
