import { supabase, isOnline } from "./supabase"
import { addToSyncQueue } from "./local-storage"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

// Fetch products
export const fetchProducts = async (page = 0, pageSize = 100) => {
  try {
    if (isOnline()) {
      const { data, error, count } = await supabase
        .from("products")
        .select("*", { count: "exact" })
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order("name")

      if (error) throw error

      // Store products in local storage for offline use
      if (data && data.length > 0 && page === 0) {
        const { getLocalProducts, storeProducts } = await import("./local-storage")
        const existingProducts = getLocalProducts()

        // Only update if we have new data
        if (data.length !== existingProducts.length) {
          storeProducts(data)
        }
      }

      return {
        products: data || [],
        error: null,
        totalCount: count || 0,
        hasMore: data && count ? (page + 1) * pageSize < count : false,
      }
    } else {
      // Return products from local storage when offline
      const { getLocalProducts } = await import("./local-storage")
      const products = getLocalProducts()

      // Apply pagination to local data
      const paginatedProducts = products.slice(page * pageSize, (page + 1) * pageSize)

      return {
        products: paginatedProducts,
        error: null,
        totalCount: products.length,
        hasMore: (page + 1) * pageSize < products.length,
      }
    }
  } catch (error: any) {
    console.error("Error fetching products:", error)

    // Fallback to local storage on error
    try {
      const { getLocalProducts } = await import("./local-storage")
      const products = getLocalProducts()

      // Apply pagination to local data
      const paginatedProducts = products.slice(page * pageSize, (page + 1) * pageSize)

      return {
        products: paginatedProducts,
        error: null,
        totalCount: products.length,
        hasMore: (page + 1) * pageSize < products.length,
      }
    } catch (fallbackError) {
      return { products: [], error: error.message, totalCount: 0, hasMore: false }
    }
  }
}

// Fetch low stock products
export const fetchLowStockProducts = async () => {
  try {
    const { products, error } = await fetchProducts()

    if (error) throw new Error(error)

    // Filter products with stock below or equal to min_stock_level
    const lowStockProducts = products
      .filter((product) => product.stock <= product.min_stock)
      .sort((a, b) => a.stock - b.stock)

    return lowStockProducts
  } catch (error: any) {
    console.error("Error fetching low stock products:", error)
    return []
  }
}

// Fetch expiring products
export const fetchExpiringProducts = async () => {
  try {
    const { products, error } = await fetchProducts()

    if (error) throw new Error(error)

    const today = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(today.getDate() + 30)

    // Filter products expiring within 30 days and with stock > 0
    const expiringProducts = products
      .filter(
        (product) => product.expiry_date && product.stock > 0 && new Date(product.expiry_date) <= thirtyDaysFromNow,
      )
      .sort((a, b) => new Date(a.expiry_date || "").getTime() - new Date(b.expiry_date || "").getTime())

    return expiringProducts
  } catch (error: any) {
    console.error("Error fetching expiring products:", error)
    return []
  }
}

// Fetch categories
export const fetchCategories = async () => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("categories").select("*").order("name")

      if (error) throw error

      // Store categories in local storage for offline use
      if (data && data.length > 0) {
        const { getLocalCategories, storeCategories } = await import("./local-storage")
        const existingCategories = getLocalCategories()

        // Only update if we have new data
        if (data.length !== existingCategories.length) {
          storeCategories(data)
        }
      }

      return { categories: data || [], error: null }
    } else {
      // Return categories from local storage when offline
      const { getLocalCategories } = await import("./local-storage")
      return { categories: getLocalCategories(), error: null }
    }
  } catch (error: any) {
    console.error("Error fetching categories:", error)

    // Fallback to local storage on error
    try {
      const { getLocalCategories } = await import("./local-storage")
      return { categories: getLocalCategories(), error: null }
    } catch (fallbackError) {
      return { categories: [], error: error.message }
    }
  }
}

// Create a new product
export const createProduct = async (product: Omit<Product, "id" | "created_at">) => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("products").insert([product]).select()

      if (error) throw error

      return { product: data[0], error: null }
    } else {
      // Queue product creation for when we're back online
      addToSyncQueue("createProduct", product)
      return { product: null, error: "Product will be created when back online" }
    }
  } catch (error: any) {
    return { product: null, error: error.message }
  }
}

// Update an existing product
export const updateProduct = async (id: string, updates: Partial<Product>) => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("products").update(updates).eq("id", id).select()

      if (error) throw error

      return { product: data[0], error: null }
    } else {
      // Queue product update for when we're back online
      addToSyncQueue("updateProduct", { id, ...updates })
      return { product: null, error: "Product will be updated when back online" }
    }
  } catch (error: any) {
    return { product: null, error: error.message }
  }
}

// Delete a product
export const deleteProduct = async (id: string) => {
  try {
    if (isOnline()) {
      const { error } = await supabase.from("products").delete().eq("id", id)

      if (error) throw error
    }

    // Queue product deletion for when we're back online
    if (!isOnline()) {
      addToSyncQueue("deleteProduct", { id })
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Create a new category
export const createCategory = async (category: Omit<Category, "id" | "created_at">) => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("categories").insert([category]).select()

      if (error) throw error

      return { category: data[0], error: null }
    } else {
      // Queue category creation for when we're back online
      addToSyncQueue("createCategory", category)
      return { category: null, error: "Category will be created when back online" }
    }
  } catch (error: any) {
    return { category: null, error: error.message }
  }
}

// Delete a category
export const deleteCategory = async (id: string) => {
  try {
    if (isOnline()) {
      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error
    }

    // Queue category deletion for when we're back online
    if (!isOnline()) {
      addToSyncQueue("deleteCategory", { id })
    }

    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// Update category
export const updateCategory = async (id: string, updates: Partial<Category>) => {
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select()

      if (error) throw error

      return { category: data[0], error: null }
    } else {
      // Queue category update for when we're back online
      addToSyncQueue("updateCategory", { id, ...updates })
      return { category: null, error: "Category will be updated when back online" }
    }
  } catch (error: any) {
    return { category: null, error: error.message }
  }
}

// Update stock quantity
export const updateStock = async (id: string, quantity: number, reason = "") => {
  try {
    // Get current product
    const { data: products, error: fetchError } = await supabase.from("products").select("*").eq("id", id).single()

    if (fetchError) throw fetchError

    const product = products as Product
    const newStock = Math.max(0, product.stock + quantity)

    // Update stock
    const { data, error } = await supabase.from("products").update({ stock: newStock }).eq("id", id).select()

    if (error) throw error

    // In a real app, you would also log the stock adjustment in a stock_movements table
    // with the reason, user, etc.

    return { product: data[0], error: null }
  } catch (error: any) {
    return { product: null, error: error.message }
  }
}
