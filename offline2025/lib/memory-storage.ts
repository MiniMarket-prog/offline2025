/**
 * In-memory storage implementation for when IndexedDB and localStorage are unavailable
 * This is a last resort fallback that will lose data on page refresh
 */

import type { Database } from "@/types/supabase"
import { v4 as uuidv4 } from "uuid"

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

// In-memory storage
const memoryStore: {
  products: Product[]
  categories: Category[]
  sales: Sale[]
  favorites: { userId: string; productId: string }[]
  syncQueue: any[]
  settings: { key: string; value: any }[]
} = {
  products: [],
  categories: [],
  sales: [],
  favorites: [],
  syncQueue: [],
  settings: [],
}

// Products
export const getMemoryProducts = (): Product[] => {
  return [...memoryStore.products]
}

export const storeMemoryProducts = (products: Product[]): boolean => {
  memoryStore.products = [...products]
  return true
}

export const addMemoryProduct = (product: Omit<Product, "id" | "created_at">): Product => {
  const newProduct = {
    ...product,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  } as Product

  memoryStore.products.push(newProduct)
  return newProduct
}

export const updateMemoryProduct = (id: string, updates: Partial<Product>): Product | null => {
  const index = memoryStore.products.findIndex((p) => p.id === id)
  if (index === -1) return null

  const updatedProduct = { ...memoryStore.products[index], ...updates }
  memoryStore.products[index] = updatedProduct
  return updatedProduct
}

export const deleteMemoryProduct = (id: string): boolean => {
  const initialLength = memoryStore.products.length
  memoryStore.products = memoryStore.products.filter((p) => p.id !== id)
  return memoryStore.products.length < initialLength
}

// Categories
export const getMemoryCategories = (): Category[] => {
  return [...memoryStore.categories]
}

export const storeMemoryCategories = (categories: Category[]): boolean => {
  memoryStore.categories = [...categories]
  return true
}

export const addMemoryCategory = (category: Omit<Category, "id" | "created_at">): Category => {
  const newCategory = {
    ...category,
    id: uuidv4(),
    created_at: new Date().toISOString(),
  } as Category

  memoryStore.categories.push(newCategory)
  return newCategory
}

// Sales
export const getMemorySales = (): Sale[] => {
  return [...memoryStore.sales]
}

export const storeMemorySales = (sales: Sale[]): boolean => {
  memoryStore.sales = [...sales]
  return true
}

// Favorites
export const getMemoryFavorites = (userId: string): Product[] => {
  const favoriteIds = memoryStore.favorites.filter((f) => f.userId === userId).map((f) => f.productId)

  return memoryStore.products.filter((p) => favoriteIds.includes(p.id))
}

export const addMemoryFavorite = (userId: string, productId: string): boolean => {
  if (memoryStore.favorites.some((f) => f.userId === userId && f.productId === productId)) {
    return true // Already exists
  }

  memoryStore.favorites.push({ userId, productId })
  return true
}

export const removeMemoryFavorite = (userId: string, productId: string): boolean => {
  const initialLength = memoryStore.favorites.length
  memoryStore.favorites = memoryStore.favorites.filter((f) => !(f.userId === userId && f.productId === productId))
  return memoryStore.favorites.length < initialLength
}

// Sync Queue
export const getMemorySyncQueue = (): any[] => {
  return [...memoryStore.syncQueue]
}

export const storeMemorySyncQueue = (queue: any[]): boolean => {
  memoryStore.syncQueue = [...queue]
  return true
}

export const addMemoryToSyncQueue = (action: string, data: any): boolean => {
  memoryStore.syncQueue.push({
    id: uuidv4(),
    action,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0,
    status: "pending",
  })
  return true
}

export const removeMemoryFromSyncQueue = (id: string): boolean => {
  const initialLength = memoryStore.syncQueue.length
  memoryStore.syncQueue = memoryStore.syncQueue.filter((item) => item.id !== id)
  return memoryStore.syncQueue.length < initialLength
}

// Settings
export const getMemorySetting = (key: string): any => {
  const setting = memoryStore.settings.find((s) => s.key === key)
  return setting ? setting.value : null
}

export const setMemorySetting = (key: string, value: any): boolean => {
  const index = memoryStore.settings.findIndex((s) => s.key === key)

  if (index >= 0) {
    memoryStore.settings[index].value = value
  } else {
    memoryStore.settings.push({ key, value })
  }

  return true
}

// Clear all data
export const clearMemoryData = (): void => {
  memoryStore.products = []
  memoryStore.categories = []
  memoryStore.sales = []
  memoryStore.favorites = []
  memoryStore.syncQueue = []
  memoryStore.settings = []
}
