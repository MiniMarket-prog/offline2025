import { initializeStorage } from "./db-detection"
import { supabase, isOnline } from "./supabase"
import { v4 as uuidv4 } from "uuid"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

// Define the sync queue item type
interface SyncQueueItem {
  id: string
  action: string
  data: any
  timestamp: string
  attempts?: number
  status?: "pending" | "processing" | "failed" | "completed"
}

// Add a timeout utility function at the top of the file
/**
 * Wraps a promise with a timeout
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs),
    ),
  ])
}

// Local storage keys
const PRODUCTS_KEY = "mini_market_products"
const CATEGORIES_KEY = "mini_market_categories"
const SALES_KEY = "mini_market_sales"
const FAVORITES_KEY = "mini_market_favorites"
const SYNC_QUEUE_KEY = "mini_market_sync_queue"

// Storage type and functions
let storageType: "indexeddb" | "localstorage" | "memory" = "localstorage"
let storageInitialized = false

// Add a function to check for private browsing mode
export async function isPrivateBrowsingMode(): Promise<boolean> {
  // Helper function to check if IndexedDB is available
  async function isIndexedDBAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = window.indexedDB.open("test")
      req.onsuccess = () => {
        req.result.close()
        window.indexedDB.deleteDatabase("test")
        resolve(true)
      }
      req.onerror = () => resolve(false)
    })
  }

  try {
    // Try to use localStorage as a quick test
    const testKey = "private_test"
    localStorage.setItem(testKey, "1")
    localStorage.removeItem(testKey)

    // If localStorage works, try IndexedDB as the main test
    try {
      const db = window.indexedDB.open("test_private")

      await new Promise<void>((resolve, reject) => {
        db.onerror = () => {
          // If there's an error opening IndexedDB, it might be private browsing
          resolve()
        }

        db.onsuccess = () => {
          // If successful, delete the test database
          db.result.close()
          window.indexedDB.deleteDatabase("test_private")
          resolve()
        }

        // Set a timeout in case the request hangs
        setTimeout(resolve, 1000)
      })

      // If we can't use IndexedDB but localStorage works, it's likely private browsing
      return !(await isIndexedDBAvailable())
    } catch (e) {
      // If both fail, it's very likely private browsing
      return true
    }
  } catch (e) {
    // If localStorage fails too, it's almost certainly private browsing
    return true
  }
}

// Add this to the initializeDataBridge function
export const initializeDataBridge = async (): Promise<{
  storageType: "indexeddb" | "localstorage" | "memory"
  error?: string
  isPrivateBrowsing?: boolean
}> => {
  if (storageInitialized) {
    return { storageType }
  }

  const isPrivate = await isPrivateBrowsingMode()
  const result = await initializeStorage()
  storageType = result.storageType
  storageInitialized = true

  return {
    ...result,
    isPrivateBrowsing: isPrivate,
  }
}

// Initialize the storage system
// export const initializeDataBridge = async (): Promise<{
//   storageType: "indexeddb" | "localstorage" | "memory"
//   error?: string
// }> => {
//   if (storageInitialized) {
//     return { storageType }
//   }

//   const result = await initializeStorage()
//   storageType = result.storageType
//   storageInitialized = true
//   return result
// }

// Get products with appropriate storage
export const getProducts = (): Product[] => {
  try {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(PRODUCTS_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting products:", error)
    return []
  }
}

// Store products in local storage
export const saveProducts = (products: Product[]): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
    return true
  } catch (error) {
    console.error("Error saving products:", error)
    return false
  }
}

// Get categories from local storage
export const getCategories = (): Category[] => {
  try {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(CATEGORIES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting categories:", error)
    return []
  }
}

// Store categories in local storage
export const saveCategories = (categories: Category[]): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    return true
  } catch (error) {
    console.error("Error saving categories:", error)
    return false
  }
}

// Get sales from local storage
export const getSales = (): any[] => {
  try {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(SALES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting sales:", error)
    return []
  }
}

// Store sales in local storage
export const saveSales = (sales: any[]): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(SALES_KEY, JSON.stringify(sales))
    return true
  } catch (error) {
    console.error("Error saving sales:", error)
    return false
  }
}

// Get favorites from local storage
export const getFavorites = (): Product[] => {
  try {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(FAVORITES_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting favorites:", error)
    return []
  }
}

// Store favorites in local storage
export const saveFavorites = (favorites: Product[]): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
    return true
  } catch (error) {
    console.error("Error saving favorites:", error)
    return false
  }
}

// Get sync queue items from local storage
export const getSyncQueueItems = (): SyncQueueItem[] => {
  try {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(SYNC_QUEUE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting sync queue items:", error)
    return []
  }
}

// Store sync queue items in local storage
export const saveSyncQueueItems = (items: SyncQueueItem[]): boolean => {
  try {
    if (typeof window === "undefined") return false
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(items))
    return true
  } catch (error) {
    console.error("Error saving sync queue items:", error)
    return false
  }
}

// Add an item to the sync queue
export const addToSyncQueue = async (action: string, data: any): Promise<string> => {
  try {
    const items = getSyncQueueItems()
    const id = uuidv4()

    const item: SyncQueueItem = {
      id,
      action,
      data,
      timestamp: new Date().toISOString(),
      attempts: 0,
      status: "pending",
    }

    items.push(item)
    saveSyncQueueItems(items)
    return id
  } catch (error) {
    console.error("Error adding to sync queue:", error)
    throw error
  }
}

// Remove an item from the sync queue
export const removeFromSyncQueue = async (id: string): Promise<boolean> => {
  try {
    const items = getSyncQueueItems()
    const updatedItems = items.filter((item) => item.id !== id)
    return saveSyncQueueItems(updatedItems)
  } catch (error) {
    console.error("Error removing from sync queue:", error)
    return false
  }
}

// Ensure we have offline data
export const ensureOfflineData = async (): Promise<void> => {
  try {
    // Check if we have products in local storage
    const products = getProducts()
    const categories = getCategories()

    // If we don't have any data cached, and we're online, fetch and cache it
    if ((products.length === 0 || categories.length === 0) && isOnline()) {
      console.log("Fetching initial data for offline use...")

      // Fetch and store products
      const { data: productsData } = await supabase.from("products").select("*")
      if (productsData && productsData.length > 0) {
        saveProducts(productsData)
      }

      // Fetch and store categories
      const { data: categoriesData } = await supabase.from("categories").select("*")
      if (categoriesData && categoriesData.length > 0) {
        saveCategories(categoriesData)
      }

      console.log("Initial data cached for offline use")
    }
  } catch (error) {
    console.error("Error ensuring offline data:", error)
  }
}

// Get current storage type
export const getStorageType = (): "indexeddb" | "localstorage" | "memory" => {
  return storageType
}

// Add this function to the existing file
export function getOnlineStatus(): boolean {
  // Check if we're in a browser environment
  if (typeof window !== "undefined") {
    return window.navigator.onLine
  }
  return true // Default to true in non-browser environments
}

// Initialize the file storage
export const initializeFileStorage = () => {
  return true // Simplified for compatibility
}

// More robust check that doesn't hang
export function checkOnlineStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    // If we're not in a browser environment, assume online
    if (typeof window === "undefined") {
      resolve(true)
      return
    }

    // Use navigator.onLine as a quick first check
    if (navigator.onLine === false) {
      resolve(false)
      return
    }

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      resolve(false)
    }, 3000)

    // Try to fetch a small resource
    fetch("/api/ping", {
      method: "HEAD",
      cache: "no-store",
      // Add a cache-busting parameter
      headers: { Pragma: "no-cache" },
    })
      .then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve(false)
      })
  })
}
