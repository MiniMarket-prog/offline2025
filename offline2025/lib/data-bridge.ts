import {
    getLocalProducts,
    storeProducts,
    getLocalCategories,
    storeCategories,
    getLocalSales,
    storeLocalSales,
    getFavorites as getLocalFavorites,
    storeFavorites as storeLocalFavorites,
    getSyncQueue,
    storeLocalSyncQueue,
    removeFromSyncQueue as removeLocalFromSyncQueue,
  } from "./local-storage"
  
  import {
    getFileProducts,
    storeFileProducts,
    getFileCategories,
    storeFileCategories,
    getFileSales,
    storeFileSales,
    getFileFavorites,
    addFileFavorite,
    removeFileFavorite,
    getFileSyncQueue,
    storeFileSyncQueue,
    addFileToSyncQueue,
    removeFileFromSyncQueue,
    initDatabase,
  } from "./file-storage"
  
  import type { Database } from "@/types/supabase"
  
  type Product = Database["public"]["Tables"]["products"]["Row"]
  type Category = Database["public"]["Tables"]["categories"]["Row"]
  
  // Initialize the file database
  export const initializeFileStorage = () => {
    return initDatabase()
  }
  
  // Get products from both storage systems and merge them
  export const getProducts = (): Product[] => {
    try {
      // Try to get from file storage first
      const fileProducts = getFileProducts()
      if (fileProducts.length > 0) {
        // Sync with local storage
        storeProducts(fileProducts)
        return fileProducts
      }
  
      // Fall back to local storage
      const localProducts = getLocalProducts()
      if (localProducts.length > 0) {
        // Sync with file storage
        storeFileProducts(localProducts)
        return localProducts
      }
  
      return []
    } catch (error) {
      console.error("Error getting products:", error)
      return getLocalProducts()
    }
  }
  
  // Store products in both storage systems
  export const saveProducts = (products: Product[]): boolean => {
    try {
      // Store in local storage
      storeProducts(products)
  
      // Try to store in file storage
      const fileResult = storeFileProducts(products)
  
      return fileResult
    } catch (error) {
      console.error("Error saving products:", error)
      return false
    }
  }
  
  // Get categories from both storage systems
  export const getCategories = (): Category[] => {
    try {
      // Try to get from file storage first
      const fileCategories = getFileCategories()
      if (fileCategories.length > 0) {
        // Sync with local storage
        storeCategories(fileCategories)
        return fileCategories
      }
  
      // Fall back to local storage
      const localCategories = getLocalCategories()
      if (localCategories.length > 0) {
        // Sync with file storage
        storeFileCategories(localCategories)
        return localCategories
      }
  
      return []
    } catch (error) {
      console.error("Error getting categories:", error)
      return getLocalCategories()
    }
  }
  
  // Store categories in both storage systems
  export const saveCategories = (categories: Category[]): boolean => {
    try {
      // Store in local storage
      storeCategories(categories)
  
      // Try to store in file storage
      const fileResult = storeFileCategories(categories)
  
      return fileResult
    } catch (error) {
      console.error("Error saving categories:", error)
      return false
    }
  }
  
  // Get sales from both storage systems
  export const getSales = (): any[] => {
    try {
      // Try to get from file storage first
      const fileSales = getFileSales()
      if (fileSales.length > 0) {
        // Sync with local storage
        storeLocalSales(fileSales)
        return fileSales
      }
  
      // Fall back to local storage
      const localSales = getLocalSales()
      if (localSales.length > 0) {
        // Sync with file storage
        storeFileSales(localSales)
        return localSales
      }
  
      return []
    } catch (error) {
      console.error("Error getting sales:", error)
      return getLocalSales()
    }
  }
  
  // Store sales in both storage systems
  export const saveSales = (sales: any[]): boolean => {
    try {
      // Store in local storage
      storeLocalSales(sales)
  
      // Try to store in file storage
      const fileResult = storeFileSales(sales)
  
      return fileResult
    } catch (error) {
      console.error("Error saving sales:", error)
      return false
    }
  }
  
  // Get favorites from both storage systems
  export const getFavorites = (userId: string): Product[] => {
    try {
      // Try to get from file storage first
      const fileFavorites = getFileFavorites(userId)
      if (fileFavorites.length > 0) {
        // Sync with local storage
        storeLocalFavorites(fileFavorites)
        return fileFavorites
      }
  
      // Fall back to local storage
      const localFavorites = getLocalFavorites()
      if (localFavorites.length > 0) {
        // We don't have user ID in local storage implementation
        // so we can't sync properly here
        return localFavorites
      }
  
      return []
    } catch (error) {
      console.error("Error getting favorites:", error)
      return getLocalFavorites()
    }
  }
  
  // Add favorite in both storage systems
  export const addFavorite = (userId: string, product: Product): boolean => {
    try {
      // Add to local storage
      const localFavorites = getLocalFavorites()
      if (!localFavorites.some((fav: Product) => fav.id === product.id)) {
        localFavorites.push(product)
        storeLocalFavorites(localFavorites)
      }
  
      // Add to file storage
      return addFileFavorite(userId, product.id)
    } catch (error) {
      console.error("Error adding favorite:", error)
      return false
    }
  }
  
  // Remove favorite from both storage systems
  export const removeFavorite = (userId: string, productId: string): boolean => {
    try {
      // Remove from local storage
      const localFavorites = getLocalFavorites()
      storeLocalFavorites(localFavorites.filter((fav: Product) => fav.id !== productId))
  
      // Remove from file storage
      return removeFileFavorite(userId, productId)
    } catch (error) {
      console.error("Error removing favorite:", error)
      return false
    }
  }
  
  // Get sync queue from both storage systems
  export const getSyncQueueItems = (): any[] => {
    try {
      // Try to get from file storage first
      const fileQueue = getFileSyncQueue()
      if (fileQueue.length > 0) {
        // Sync with local storage
        storeLocalSyncQueue(fileQueue)
        return fileQueue
      }
  
      // Fall back to local storage
      const localQueue = getSyncQueue()
      if (localQueue.length > 0) {
        // Sync with file storage
        storeFileSyncQueue(localQueue)
        return localQueue
      }
  
      return []
    } catch (error) {
      console.error("Error getting sync queue:", error)
      return getSyncQueue()
    }
  }
  
  // Add to sync queue in both storage systems
  export const addToSyncQueue = (action: string, data: any): boolean => {
    try {
      const item = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
      }
  
      // Add to local storage
      const localQueue = getSyncQueue()
      localQueue.push(item)
      storeLocalSyncQueue(localQueue)
  
      // Add to file storage
      return addFileToSyncQueue(item)
    } catch (error) {
      console.error("Error adding to sync queue:", error)
      return false
    }
  }
  
  // Remove from sync queue in both storage systems
  export const removeFromSyncQueue = (id: string): boolean => {
    try {
      // Remove from local storage
      removeLocalFromSyncQueue(id)
  
      // Remove from file storage
      return removeFileFromSyncQueue(id)
    } catch (error) {
      console.error("Error removing from sync queue:", error)
      return false
    }
  }
  