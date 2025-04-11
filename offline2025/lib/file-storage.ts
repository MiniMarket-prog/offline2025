// Import types
import type { Database } from "@/types/supabase"

// Define types for our data
type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]
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

// Define the structure of our local database
interface LocalDatabase {
  products: Product[]
  categories: Category[]
  profiles: Profile[]
  sales: Sale[]
  favorites: { userId: string; productId: string }[]
  syncQueue: any[]
}

// Mock implementation for browser environment
const mockDb: LocalDatabase = {
  products: [],
  categories: [],
  profiles: [],
  sales: [],
  favorites: [],
  syncQueue: [],
}

// Initialize the database
export const initDatabase = (): boolean => {
  try {
    // In browser, use localStorage if available
    if (typeof window !== "undefined" && window.localStorage) {
      const storedDb = localStorage.getItem("mini_market_db")
      if (!storedDb) {
        localStorage.setItem("mini_market_db", JSON.stringify(mockDb))
      }
    }
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}

// Read data from storage
const readDatabase = (): LocalDatabase => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const data = localStorage.getItem("mini_market_db")
      if (data) {
        return JSON.parse(data) as LocalDatabase
      }
    }
    return mockDb
  } catch (error) {
    console.error("Error reading database:", error)
    return mockDb
  }
}

// Write data to storage
const writeDatabase = (data: LocalDatabase): boolean => {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem("mini_market_db", JSON.stringify(data))
    }
    return true
  } catch (error) {
    console.error("Error writing to database:", error)
    return false
  }
}

// Get products from the database
export const getFileProducts = (): Product[] => {
  const db = readDatabase()
  return db.products || []
}

// Store products in the database
export const storeFileProducts = (products: Product[]): boolean => {
  const db = readDatabase()
  db.products = products
  return writeDatabase(db)
}

// Get categories from the database
export const getFileCategories = (): Category[] => {
  const db = readDatabase()
  return db.categories || []
}

// Store categories in the database
export const storeFileCategories = (categories: Category[]): boolean => {
  const db = readDatabase()
  db.categories = categories
  return writeDatabase(db)
}

// Get sales from the database
export const getFileSales = (): Sale[] => {
  const db = readDatabase()
  return db.sales || []
}

// Store sales in the database
export const storeFileSales = (sales: Sale[]): boolean => {
  const db = readDatabase()
  db.sales = sales
  return writeDatabase(db)
}

// Get favorites from the database
export const getFileFavorites = (userId: string): Product[] => {
  const db = readDatabase()
  const favoriteIds = db.favorites.filter((fav) => fav.userId === userId).map((fav) => fav.productId)
  return db.products.filter((product) => favoriteIds.includes(product.id))
}

// Store a favorite in the database
export const addFileFavorite = (userId: string, productId: string): boolean => {
  const db = readDatabase()

  // Check if already exists
  const exists = db.favorites.some((fav) => fav.userId === userId && fav.productId === productId)

  if (!exists) {
    db.favorites.push({ userId, productId })
    return writeDatabase(db)
  }

  return true
}

// Remove a favorite from the database
export const removeFileFavorite = (userId: string, productId: string): boolean => {
  const db = readDatabase()
  db.favorites = db.favorites.filter((fav) => !(fav.userId === userId && fav.productId === productId))
  return writeDatabase(db)
}

// Get sync queue from the database
export const getFileSyncQueue = (): any[] => {
  const db = readDatabase()
  return db.syncQueue || []
}

// Store sync queue in the database
export const storeFileSyncQueue = (queue: any[]): boolean => {
  const db = readDatabase()
  db.syncQueue = queue
  return writeDatabase(db)
}

// Add item to sync queue
export const addFileToSyncQueue = (item: any): boolean => {
  const db = readDatabase()
  db.syncQueue.push(item)
  return writeDatabase(db)
}

// Remove item from sync queue
export const removeFileFromSyncQueue = (id: string): boolean => {
  const db = readDatabase()
  db.syncQueue = db.syncQueue.filter((item) => item.id !== id)
  return writeDatabase(db)
}

// Export database to a file - browser version just returns a JSON string
export const exportDatabase = (): string => {
  try {
    const db = readDatabase()
    return JSON.stringify(db, null, 2)
  } catch (error) {
    console.error("Error exporting database:", error)
    return ""
  }
}

// Import database from a string
export const importDatabase = (jsonData: string): boolean => {
  try {
    const importedDb = JSON.parse(jsonData) as LocalDatabase
    return writeDatabase(importedDb)
  } catch (error) {
    console.error("Error importing database:", error)
    return false
  }
}
