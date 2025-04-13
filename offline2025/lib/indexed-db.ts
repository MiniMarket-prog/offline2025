import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Database } from "@/types/supabase"
import { v4 as uuidv4 } from "uuid"

// Define the database schema
interface MiniMarketDB extends DBSchema {
  products: {
    key: string
    value: Database["public"]["Tables"]["products"]["Row"]
    indexes: {
      "by-barcode": string
      "by-category": string
      "by-name": string
    }
  }
  categories: {
    key: string
    value: Database["public"]["Tables"]["categories"]["Row"]
    indexes: { "by-name": string }
  }
  sales: {
    key: string
    value: {
      id: string
      items: any[]
      subtotal: number
      tax: number
      total: number
      payment_method: string
      created_at: string
      cashier_id: string
    }
    indexes: { "by-date": string }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      action: string
      data: any
      timestamp: string
      attempts?: number
      status?: string
    }
    indexes: { "by-timestamp": string; "by-status": string }
  }
  favorites: {
    key: string
    value: {
      id: string
      userId: string
      productId: string
    }
    indexes: { "by-user": string }
  }
  settings: {
    key: string
    value: {
      id: string
      key: string
      value: any
    }
    indexes: { "by-key": string }
  }
}

// Database connection
let dbPromise: Promise<IDBPDatabase<MiniMarketDB>> | null = null
let dbInitialized = false
let dbInitError: Error | null = null

// Initialize the database with better error handling
export const initDB = async (): Promise<IDBPDatabase<MiniMarketDB>> => {
  if (dbPromise) {
    return dbPromise
  }

  if (typeof window === "undefined" || !window.indexedDB) {
    const error = new Error("IndexedDB not supported in this environment")
    dbInitError = error
    throw error
  }

  console.log("Initializing IndexedDB...")

  dbPromise = new Promise((resolve, reject) => {
    try {
      const openRequest = openDB<MiniMarketDB>("mini-market-pos", 1, {
        upgrade(db: IDBPDatabase<MiniMarketDB>, oldVersion, newVersion, transaction) {
          console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`)

          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains("products")) {
            console.log("Creating products store")
            const productStore = db.createObjectStore("products", { keyPath: "id" })
            productStore.createIndex("by-barcode", "barcode", { unique: false })
            productStore.createIndex("by-category", "category_id", { unique: false })
            productStore.createIndex("by-name", "name", { unique: false })
          }

          if (!db.objectStoreNames.contains("categories")) {
            console.log("Creating categories store")
            const categoryStore = db.createObjectStore("categories", { keyPath: "id" })
            categoryStore.createIndex("by-name", "name", { unique: false })
          }

          if (!db.objectStoreNames.contains("sales")) {
            console.log("Creating sales store")
            const salesStore = db.createObjectStore("sales", { keyPath: "id" })
            salesStore.createIndex("by-date", "created_at", { unique: false })
          }

          if (!db.objectStoreNames.contains("syncQueue")) {
            console.log("Creating syncQueue store")
            const syncQueueStore = db.createObjectStore("syncQueue", { keyPath: "id" })
            syncQueueStore.createIndex("by-timestamp", "timestamp", { unique: false })
            syncQueueStore.createIndex("by-status", "status", { unique: false })
          }

          if (!db.objectStoreNames.contains("favorites")) {
            console.log("Creating favorites store")
            const favoritesStore = db.createObjectStore("favorites", { keyPath: "id" })
            favoritesStore.createIndex("by-user", "userId", { unique: false })
          }

          if (!db.objectStoreNames.contains("settings")) {
            console.log("Creating settings store")
            const settingsStore = db.createObjectStore("settings", { keyPath: "id" })
            settingsStore.createIndex("by-key", "key", { unique: true })
          }
        },
        blocked() {
          console.log("IndexedDB blocked")
        },
        blocking() {
          console.log("IndexedDB blocking")
        },
        terminated() {
          console.log("IndexedDB terminated")
          dbPromise = null
          dbInitialized = false
        },
      })

      // Set a timeout in case the request hangs
      const timeout = setTimeout(() => {
        reject(new Error("IndexedDB initialization timed out"))
      }, 5000)

      openRequest
        .then((db) => {
          clearTimeout(timeout)
          console.log("IndexedDB initialized successfully")
          dbInitialized = true
          resolve(db)
        })
        .catch((error) => {
          clearTimeout(timeout)
          console.error("Error initializing IndexedDB:", error)
          dbInitError = error
          dbInitialized = false
          reject(error)
        })
    } catch (error) {
      console.error("Exception during IndexedDB initialization:", error)
      dbInitError = error instanceof Error ? error : new Error(String(error))
      reject(dbInitError)
    }
  })

  return dbPromise
}

// Check if IndexedDB is initialized
export const isDBInitialized = (): boolean => {
  return dbInitialized
}

// Get initialization error if any
export const getDBInitError = (): Error | null => {
  return dbInitError
}

// Check if IndexedDB is supported
export const isIndexedDBSupported = (): boolean => {
  return typeof window !== "undefined" && !!window.indexedDB
}

// Products
export const getAllProducts = async (): Promise<Database["public"]["Tables"]["products"]["Row"][]> => {
  try {
    const db = await initDB()
    return db.getAll("products")
  } catch (error) {
    console.error("Error getting all products:", error)
    return []
  }
}

export const getProductById = async (
  id: string,
): Promise<Database["public"]["Tables"]["products"]["Row"] | undefined> => {
  try {
    const db = await initDB()
    return db.get("products", id)
  } catch (error) {
    console.error(`Error getting product by ID ${id}:`, error)
    return undefined
  }
}

export const getProductByBarcode = async (
  barcode: string,
): Promise<Database["public"]["Tables"]["products"]["Row"] | undefined> => {
  try {
    const db = await initDB()
    const index = db.transaction("products").store.index("by-barcode")
    return index.get(barcode)
  } catch (error) {
    console.error(`Error getting product by barcode ${barcode}:`, error)
    return undefined
  }
}

export const getProductsByCategory = async (
  categoryId: string,
): Promise<Database["public"]["Tables"]["products"]["Row"][]> => {
  try {
    const db = await initDB()
    const index = db.transaction("products").store.index("by-category")
    return index.getAll(categoryId)
  } catch (error) {
    console.error(`Error getting products by category ${categoryId}:`, error)
    return []
  }
}

export const saveProduct = async (product: Database["public"]["Tables"]["products"]["Row"]): Promise<string> => {
  try {
    const db = await initDB()
    await db.put("products", product)
    return product.id
  } catch (error) {
    console.error("Error saving product:", error)
    throw error
  }
}

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const db = await initDB()
    await db.delete("products", id)
  } catch (error) {
    console.error(`Error deleting product ${id}:`, error)
    throw error
  }
}

// Categories
export const getAllCategories = async (): Promise<Database["public"]["Tables"]["categories"]["Row"][]> => {
  try {
    const db = await initDB()
    return db.getAll("categories")
  } catch (error) {
    console.error("Error getting all categories:", error)
    return []
  }
}

export const getCategoryById = async (
  id: string,
): Promise<Database["public"]["Tables"]["categories"]["Row"] | undefined> => {
  try {
    const db = await initDB()
    return db.get("categories", id)
  } catch (error) {
    console.error(`Error getting category by ID ${id}:`, error)
    return undefined
  }
}

export const saveCategory = async (category: Database["public"]["Tables"]["categories"]["Row"]): Promise<string> => {
  try {
    const db = await initDB()
    await db.put("categories", category)
    return category.id
  } catch (error) {
    console.error("Error saving category:", error)
    throw error
  }
}

export const deleteCategory = async (id: string): Promise<void> => {
  try {
    const db = await initDB()
    await db.delete("categories", id)
  } catch (error) {
    console.error(`Error deleting category ${id}:`, error)
    throw error
  }
}

// Sales
export const getAllSales = async (): Promise<any[]> => {
  try {
    const db = await initDB()
    return db.getAll("sales")
  } catch (error) {
    console.error("Error getting all sales:", error)
    return []
  }
}

export const getSaleById = async (id: string): Promise<any | undefined> => {
  try {
    const db = await initDB()
    return db.get("sales", id)
  } catch (error) {
    console.error(`Error getting sale by ID ${id}:`, error)
    return undefined
  }
}

export const saveSale = async (sale: any): Promise<string> => {
  try {
    const db = await initDB()
    await db.put("sales", sale)
    return sale.id
  } catch (error) {
    console.error("Error saving sale:", error)
    throw error
  }
}

export const deleteSale = async (id: string): Promise<void> => {
  try {
    const db = await initDB()
    await db.delete("sales", id)
  } catch (error) {
    console.error(`Error deleting sale ${id}:`, error)
    throw error
  }
}

// Sync Queue
export const getAllSyncQueueItems = async (): Promise<any[]> => {
  try {
    const db = await initDB()
    return db.getAll("syncQueue")
  } catch (error) {
    console.error("Error getting all sync queue items:", error)
    return []
  }
}

export const saveSyncQueueItem = async (item: any): Promise<string> => {
  try {
    if (!item.id) {
      item.id = uuidv4()
    }

    const db = await initDB()
    await db.put("syncQueue", item)
    return item.id
  } catch (error) {
    console.error("Error saving sync queue item:", error)
    throw error
  }
}

export const deleteSyncQueueItem = async (id: string): Promise<void> => {
  try {
    const db = await initDB()
    await db.delete("syncQueue", id)
  } catch (error) {
    console.error(`Error deleting sync queue item ${id}:`, error)
    throw error
  }
}

// Favorites
export const getFavoritesByUser = async (userId: string): Promise<any[]> => {
  try {
    const db = await initDB()
    const index = db.transaction("favorites").store.index("by-user")
    return index.getAll(userId)
  } catch (error) {
    console.error(`Error getting favorites for user ${userId}:`, error)
    return []
  }
}

export const saveFavorite = async (userId: string, productId: string): Promise<string> => {
  try {
    const db = await initDB()
    const favorite = {
      id: uuidv4(),
      userId,
      productId,
    }
    await db.put("favorites", favorite)
    return favorite.id
  } catch (error) {
    console.error("Error saving favorite:", error)
    throw error
  }
}

export const deleteFavorite = async (userId: string, productId: string): Promise<void> => {
  try {
    const db = await initDB()
    const tx = db.transaction("favorites", "readwrite")
    const index = tx.store.index("by-user")
    const cursor = await index.openCursor(userId)

    while (cursor) {
      if (cursor.value.productId === productId) {
        await cursor.delete()
      }
      await cursor.continue()
    }
  } catch (error) {
    console.error(`Error deleting favorite for user ${userId} and product ${productId}:`, error)
    throw error
  }
}

// Settings
export const getSetting = async (key: string): Promise<any> => {
  try {
    const db = await initDB()
    const index = db.transaction("settings").store.index("by-key")
    const setting = await index.get(key)
    return setting ? setting.value : null
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error)
    return null
  }
}

export const saveSetting = async (key: string, value: any): Promise<void> => {
  try {
    const db = await initDB()
    const index = db.transaction("settings", "readwrite").store.index("by-key")
    const existingSetting = await index.get(key)

    if (existingSetting) {
      existingSetting.value = value
      await db.put("settings", existingSetting)
    } else {
      await db.put("settings", {
        id: uuidv4(),
        key,
        value,
      })
    }
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error)
    throw error
  }
}

export const deleteSetting = async (key: string): Promise<void> => {
  try {
    const db = await initDB()
    const index = db.transaction("settings", "readwrite").store.index("by-key")
    const existingSetting = await index.get(key)

    if (existingSetting) {
      await db.delete("settings", existingSetting.id)
    }
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error)
    throw error
  }
}

// Clear all data
export const clearAllData = async (): Promise<void> => {
  try {
    const db = await initDB()
    await db.clear("products")
    await db.clear("categories")
    await db.clear("sales")
    await db.clear("syncQueue")
    await db.clear("favorites")
    await db.clear("settings")
  } catch (error) {
    console.error("Error clearing all data:", error)
    throw error
  }
}
