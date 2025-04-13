import { supabase, isOnline } from "./supabase"
import { getAllProducts, getProductById, saveProduct, deleteProduct, isIndexedDBSupported } from "./indexed-db"
import { addToSyncQueue } from "./data-bridge" // Import from data-bridge instead of sync-manager
import { v4 as uuidv4 } from "uuid"
import type { Database } from "@/types/supabase"

type Product = Database["public"]["Tables"]["products"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]

// Check if we can use IndexedDB
const canUseIndexedDB = isIndexedDBSupported()

// Fallback to localStorage if IndexedDB is not supported
const getLocalStorageProducts = (): Product[] => {
  try {
    const data = localStorage.getItem("mini_market_products")
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Error getting products from localStorage:", error)
    return []
  }
}

const saveLocalStorageProducts = (products: Product[]): void => {
  try {
    localStorage.setItem("mini_market_products", JSON.stringify(products))
  } catch (error) {
    console.error("Error saving products to localStorage:", error)
  }
}

// Products

// Fetch products with offline support
export const fetchProducts = async (
  page = 0,
  pageSize = 100,
): Promise<{
  products: Product[]
  error: string | null
  totalCount: number
  hasMore: boolean
}> => {
  try {
    // First try to get products from local storage (IndexedDB or localStorage)
    let localProducts: Product[] = []

    if (canUseIndexedDB) {
      localProducts = await getAllProducts()
    } else {
      localProducts = getLocalStorageProducts()
    }

    // If we're online, try to fetch from Supabase and update local storage
    if (isOnline()) {
      try {
        const { data, error, count } = await supabase
          .from("products")
          .select("*", { count: "exact" })
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order("name")

        if (!error && data) {
          // Update local storage with the new data
          if (canUseIndexedDB) {
            // Save each product to IndexedDB
            for (const product of data) {
              await saveProduct(product)
            }
          } else {
            // For localStorage, we need to merge with existing data
            const existingProducts = getLocalStorageProducts()

            // Create a map of existing products by ID
            const productMap = new Map(existingProducts.map((p) => [p.id, p]))

            // Update or add new products
            for (const product of data) {
              productMap.set(product.id, product)
            }

            // Convert map back to array
            saveLocalStorageProducts(Array.from(productMap.values()))
          }

          return {
            products: data,
            error: null,
            totalCount: count || data.length,
            hasMore: data && count ? (page + 1) * pageSize < count : false,
          }
        }
      } catch (onlineError) {
        console.error("Error fetching products from Supabase:", onlineError)
        // Continue with local data if online fetch fails
      }
    }

    // If we're offline or online fetch failed, use local data
    // Apply pagination to local data
    const paginatedProducts = localProducts.slice(page * pageSize, (page + 1) * pageSize)

    return {
      products: paginatedProducts,
      error: null,
      totalCount: localProducts.length,
      hasMore: (page + 1) * pageSize < localProducts.length,
    }
  } catch (error: any) {
    console.error("Error in fetchProducts:", error)
    return {
      products: [],
      error: error.message,
      totalCount: 0,
      hasMore: false,
    }
  }
}

// Create a new product with offline support
export const createProduct = async (
  product: Omit<Product, "id" | "created_at">,
): Promise<{
  product: Product | null
  error: string | null
}> => {
  try {
    // Generate a new ID and created_at timestamp
    const newProduct: Product = {
      ...product,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    } as Product

    // Save to local storage first (offline-first approach)
    if (canUseIndexedDB) {
      await saveProduct(newProduct)
    } else {
      const products = getLocalStorageProducts()
      products.push(newProduct)
      saveLocalStorageProducts(products)
    }

    // If online, sync to Supabase
    if (isOnline()) {
      try {
        const { data, error } = await supabase.from("products").insert([newProduct]).select()

        if (error) throw error

        // If the server returned a different ID, update local storage
        if (data && data[0] && data[0].id !== newProduct.id) {
          if (canUseIndexedDB) {
            await deleteProduct(newProduct.id)
            await saveProduct(data[0])
          } else {
            const products = getLocalStorageProducts()
            const updatedProducts = products.filter((p) => p.id !== newProduct.id)
            updatedProducts.push(data[0])
            saveLocalStorageProducts(updatedProducts)
          }

          return { product: data[0], error: null }
        }
      } catch (onlineError) {
        console.error("Error creating product in Supabase:", onlineError)
        // Add to sync queue for later
        await addToSyncQueue("createProduct", newProduct)
      }
    } else {
      // If offline, add to sync queue
      await addToSyncQueue("createProduct", newProduct)
    }

    return { product: newProduct, error: null }
  } catch (error: any) {
    console.error("Error in createProduct:", error)
    return { product: null, error: error.message }
  }
}

// Update an existing product with offline support
export const updateProduct = async (
  id: string,
  updates: Partial<Product>,
): Promise<{
  product: Product | null
  error: string | null
}> => {
  try {
    // Get the current product from local storage
    let currentProduct: Product | undefined

    if (canUseIndexedDB) {
      currentProduct = await getProductById(id)
    } else {
      const products = getLocalStorageProducts()
      currentProduct = products.find((p) => p.id === id)
    }

    if (!currentProduct) {
      return { product: null, error: "Product not found" }
    }

    // Update the product
    const updatedProduct = { ...currentProduct, ...updates }

    // Save to local storage first
    if (canUseIndexedDB) {
      await saveProduct(updatedProduct)
    } else {
      const products = getLocalStorageProducts()
      const updatedProducts = products.map((p) => (p.id === id ? updatedProduct : p))
      saveLocalStorageProducts(updatedProducts)
    }

    // If online, sync to Supabase
    if (isOnline()) {
      try {
        const { data, error } = await supabase.from("products").update(updates).eq("id", id).select()

        if (error) throw error

        if (data && data[0]) {
          // Update local storage with the server response
          if (canUseIndexedDB) {
            await saveProduct(data[0])
          } else {
            const products = getLocalStorageProducts()
            const updatedProducts = products.map((p) => (p.id === id ? data[0] : p))
            saveLocalStorageProducts(updatedProducts)
          }

          return { product: data[0], error: null }
        }
      } catch (onlineError) {
        console.error("Error updating product in Supabase:", onlineError)
        // Add to sync queue for later
        await addToSyncQueue("updateProduct", { id, ...updates })
      }
    } else {
      // If offline, add to sync queue
      await addToSyncQueue("updateProduct", { id, ...updates })
    }

    return { product: updatedProduct, error: null }
  } catch (error: any) {
    console.error("Error in updateProduct:", error)
    return { product: null, error: error.message }
  }
}

// Delete a product with offline support
export const deleteProductWithOfflineSupport = async (
  id: string,
): Promise<{
  success: boolean
  error: string | null
}> => {
  try {
    // Delete from local storage first
    if (canUseIndexedDB) {
      await deleteProduct(id)
    } else {
      const products = getLocalStorageProducts()
      const updatedProducts = products.filter((p) => p.id !== id)
      saveLocalStorageProducts(updatedProducts)
    }

    // If online, sync to Supabase
    if (isOnline()) {
      try {
        const { error } = await supabase.from("products").delete().eq("id", id)

        if (error) throw error
      } catch (onlineError) {
        console.error("Error deleting product from Supabase:", onlineError)
        // Add to sync queue for later
        await addToSyncQueue("deleteProduct", { id })
      }
    } else {
      // If offline, add to sync queue
      await addToSyncQueue("deleteProduct", { id })
    }

    return { success: true, error: null }
  } catch (error: any) {
    console.error("Error in deleteProduct:", error)
    return { success: false, error: error.message }
  }
}

// Similar implementations for categories, sales, etc.
// ...

// Update stock with offline support
export const updateStock = async (
  id: string,
  quantity: number,
  reason = "",
): Promise<{
  product: Product | null
  error: string | null
}> => {
  try {
    // Get the current product from local storage
    let currentProduct: Product | undefined

    if (canUseIndexedDB) {
      currentProduct = await getProductById(id)
    } else {
      const products = getLocalStorageProducts()
      currentProduct = products.find((p) => p.id === id)
    }

    if (!currentProduct) {
      return { product: null, error: "Product not found" }
    }

    // Calculate new stock
    const newStock = Math.max(0, currentProduct.stock + quantity)

    // Update the product
    const updatedProduct = { ...currentProduct, stock: newStock }

    // Save to local storage first
    if (canUseIndexedDB) {
      await saveProduct(updatedProduct)
    } else {
      const products = getLocalStorageProducts()
      const updatedProducts = products.map((p) => (p.id === id ? updatedProduct : p))
      saveLocalStorageProducts(updatedProducts)
    }

    // If online, sync to Supabase
    if (isOnline()) {
      try {
        const { data, error } = await supabase.from("products").update({ stock: newStock }).eq("id", id).select()

        if (error) throw error

        if (data && data[0]) {
          return { product: data[0], error: null }
        }
      } catch (onlineError) {
        console.error("Error updating stock in Supabase:", onlineError)
        // Add to sync queue for later
        await addToSyncQueue("updateStock", { id, stock: newStock })
      }
    } else {
      // If offline, add to sync queue
      await addToSyncQueue("updateStock", { id, stock: newStock })
    }

    return { product: updatedProduct, error: null }
  } catch (error: any) {
    console.error("Error in updateStock:", error)
    return { product: null, error: error.message }
  }
}
