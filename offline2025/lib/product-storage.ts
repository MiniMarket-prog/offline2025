import { v4 as uuidv4 } from "uuid"
import { addToSyncQueue } from "./local-storage"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

// Local storage keys
const PRODUCTS_KEY = "mini_market_products"
const CATEGORIES_KEY = "mini_market_categories"

// Store products in local storage
export const storeProducts = (products: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  }
}

// Get products from local storage
export const getLocalProducts = (): Product[] => {
  if (typeof window !== "undefined") {
    const products = localStorage.getItem(PRODUCTS_KEY)
    return products ? JSON.parse(products) : []
  }
  return []
}

// Store categories in local storage
export const storeCategories = (categories: Category[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }
}

// Get categories from local storage
export const getLocalCategories = (): Category[] => {
  if (typeof window !== "undefined") {
    const categories = localStorage.getItem(CATEGORIES_KEY)
    return categories ? JSON.parse(categories) : []
  }
  return []
}

// Add a product locally
export const addLocalProduct = (product: Omit<Product, "id" | "created_at">) => {
  const products = getLocalProducts()
  const now = new Date().toISOString()

  const newProduct: Product = {
    ...product,
    id: uuidv4(),
    created_at: now,
  }

  products.push(newProduct)
  storeProducts(products)

  // Add to sync queue for when we're back online
  addToSyncQueue("createProduct", newProduct)

  return newProduct
}

// Update a product locally
export const updateLocalProduct = (id: string, updates: Partial<Product>) => {
  const products = getLocalProducts()
  const index = products.findIndex((p) => p.id === id)

  if (index !== -1) {
    const updatedProduct = {
      ...products[index],
      ...updates,
    }

    products[index] = updatedProduct
    storeProducts(products)

    // Add to sync queue for when we're back online
    addToSyncQueue("updateProduct", updatedProduct)

    return updatedProduct
  }

  return null
}

// Delete a product locally
export const deleteLocalProduct = (id: string) => {
  const products = getLocalProducts()
  const filteredProducts = products.filter((p) => p.id !== id)

  if (filteredProducts.length !== products.length) {
    storeProducts(filteredProducts)

    // Add to sync queue for when we're back online
    addToSyncQueue("deleteProduct", { id })

    return true
  }

  return false
}

// Add a category locally
export const addLocalCategory = (category: Omit<Category, "id" | "created_at">) => {
  const categories = getLocalCategories()
  const now = new Date().toISOString()

  const newCategory: Category = {
    ...category,
    id: uuidv4(),
    created_at: now,
  }

  categories.push(newCategory)
  storeCategories(categories)

  // Add to sync queue for when we're back online
  addToSyncQueue("createCategory", newCategory)

  return newCategory
}

// Update a category locally
export const updateLocalCategory = (id: string, updates: Partial<Category>) => {
  const categories = getLocalCategories()
  const index = categories.findIndex((c) => c.id === id)

  if (index !== -1) {
    const updatedCategory = {
      ...categories[index],
      ...updates,
    }

    categories[index] = updatedCategory
    storeCategories(categories)

    // Add to sync queue for when we're back online
    addToSyncQueue("updateCategory", updatedCategory)

    return updatedCategory
  }

  return null
}

// Delete a category locally
export const deleteLocalCategory = (id: string) => {
  const categories = getLocalCategories()
  const filteredCategories = categories.filter((c) => c.id !== id)

  if (filteredCategories.length !== categories.length) {
    storeCategories(filteredCategories)

    // Add to sync queue for when we're back online
    addToSyncQueue("deleteCategory", { id })

    return true
  }

  return false
}
