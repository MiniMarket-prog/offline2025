import type { User } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

type Profile = Database["public"]["Tables"]["profiles"]["Row"]
type UserWithProfile = User & { profile: Profile }

// Local storage keys
const USERS_KEY = "mini_market_users"
const CURRENT_USER_KEY = "mini_market_current_user"
const SYNC_QUEUE_KEY = "mini_market_sync_queue"

// Store users in local storage
export const storeUsers = (users: UserWithProfile[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }
}

// Get users from local storage
export const getLocalUsers = (): UserWithProfile[] => {
  if (typeof window !== "undefined") {
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : []
  }
  return []
}

// Store current user in local storage
export const storeCurrentUser = (user: UserWithProfile | null) => {
  if (typeof window !== "undefined") {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(CURRENT_USER_KEY)
    }
  }
}

// Get current user from local storage
export const getCurrentUser = (): UserWithProfile | null => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem(CURRENT_USER_KEY)
    return user ? JSON.parse(user) : null
  }
  return null
}

// Add item to sync queue
export const addToSyncQueue = (action: string, data: any) => {
  if (typeof window !== "undefined") {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY)
    const queueData = queue ? JSON.parse(queue) : []
    queueData.push({
      id: Date.now().toString(),
      action,
      data,
      timestamp: new Date().toISOString(),
    })
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queueData))
  }
}

// Get sync queue
export const getSyncQueue = () => {
  if (typeof window !== "undefined") {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY)
    return queue ? JSON.parse(queue) : []
  }
  return []
}

// Clear sync queue
export const clearSyncQueue = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SYNC_QUEUE_KEY)
  }
}

// Remove item from sync queue
export const removeFromSyncQueue = (id: string) => {
  if (typeof window !== "undefined") {
    const queue = localStorage.getItem(SYNC_QUEUE_KEY)
    if (queue) {
      const queueData = JSON.parse(queue)
      const newQueue = queueData.filter((item: any) => item.id !== id)
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(newQueue))
    }
  }
}

// Product related functions
export const getLocalProducts = (): Product[] => {
  if (typeof window !== "undefined") {
    const products = localStorage.getItem("mini_market_products")
    return products ? JSON.parse(products) : []
  }
  return []
}

export const storeProducts = (products: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mini_market_products", JSON.stringify(products))
  }
}

// Category related functions
export const getLocalCategories = (): Category[] => {
  if (typeof window !== "undefined") {
    const categories = localStorage.getItem("mini_market_categories")
    return categories ? JSON.parse(categories) : []
  }
  return []
}

export const storeCategories = (categories: Category[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mini_market_categories", JSON.stringify(categories))
  }
}

// Sales related functions
export const getLocalSales = (): any[] => {
  if (typeof window !== "undefined") {
    const sales = localStorage.getItem("mini_market_sales")
    return sales ? JSON.parse(sales) : []
  }
  return []
}

export const storeLocalSales = (sales: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mini_market_sales", JSON.stringify(sales))
  }
}

// Favorites related functions
export const getFavorites = (): Product[] => {
  if (typeof window !== "undefined") {
    const favorites = localStorage.getItem("mini_market_favorites")
    return favorites ? JSON.parse(favorites) : []
  }
  return []
}

export const storeFavorites = (favorites: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mini_market_favorites", JSON.stringify(favorites))
  }
}

// Sync queue related functions
export const storeLocalSyncQueue = (queue: any[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
  }
}
