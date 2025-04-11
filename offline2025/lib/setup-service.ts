import { supabase, isOnline } from "./supabase"
import { v4 as uuidv4 } from "uuid"

// Define types for our data
type Product = {
  id: string
  name: string
  barcode: string
  price: number
  stock: number
  min_stock: number
  category_id: string
  purchase_price: number
  expiry_date: string
  is_pack: boolean
}

type Category = {
  id: string
  name: string
  description: string
}

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
  profiles: any[]
  sales: Sale[]
  favorites: { userId: string; productId: string }[]
  syncQueue: any[]
}

// Mock functions for file storage since we're missing the actual modules
const readDatabase = (): LocalDatabase | null => {
  try {
    const storedData = localStorage.getItem("local_database")
    return storedData ? JSON.parse(storedData) : null
  } catch (error) {
    console.error("Error reading database:", error)
    return null
  }
}

const writeDatabase = (data: LocalDatabase): boolean => {
  try {
    localStorage.setItem("local_database", JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error writing database:", error)
    return false
  }
}

const exportDatabase = (path: string): boolean => {
  try {
    const db = readDatabase()
    if (!db) return false

    // In a real implementation, this would write to a file
    console.log(`Exporting database to ${path}`)
    return true
  } catch (error) {
    console.error("Error exporting database:", error)
    return false
  }
}

const importDatabase = (path: string): boolean => {
  try {
    // In a real implementation, this would read from a file
    console.log(`Importing database from ${path}`)
    return true
  } catch (error) {
    console.error("Error importing database:", error)
    return false
  }
}

// Mock function for data bridge
const getProducts = (): Product[] => {
  const db = readDatabase()
  return db?.products || []
}

// Demo data generation
export const generateDemoData = async () => {
  try {
    // Generate categories
    const categories = [
      { id: uuidv4(), name: "Beverages", description: "Drinks and liquids" },
      { id: uuidv4(), name: "Snacks", description: "Quick bites and treats" },
      { id: uuidv4(), name: "Dairy", description: "Milk products and alternatives" },
      { id: uuidv4(), name: "Bakery", description: "Bread and baked goods" },
      { id: uuidv4(), name: "Produce", description: "Fruits and vegetables" },
    ]

    // Generate products
    const products: Product[] = []

    // Beverages
    products.push({
      id: uuidv4(),
      name: "Bottled Water 500ml",
      barcode: "100000001",
      price: 1.5,
      stock: 50,
      min_stock: 10,
      category_id: categories[0].id,
      purchase_price: 0.75,
      expiry_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    products.push({
      id: uuidv4(),
      name: "Cola 330ml",
      barcode: "100000002",
      price: 2.0,
      stock: 40,
      min_stock: 15,
      category_id: categories[0].id,
      purchase_price: 1.2,
      expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    products.push({
      id: uuidv4(),
      name: "Orange Juice 1L",
      barcode: "100000003",
      price: 3.5,
      stock: 20,
      min_stock: 8,
      category_id: categories[0].id,
      purchase_price: 2.0,
      expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    // Snacks
    products.push({
      id: uuidv4(),
      name: "Potato Chips 150g",
      barcode: "200000001",
      price: 2.5,
      stock: 35,
      min_stock: 10,
      category_id: categories[1].id,
      purchase_price: 1.5,
      expiry_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    products.push({
      id: uuidv4(),
      name: "Chocolate Bar 100g",
      barcode: "200000002",
      price: 1.8,
      stock: 45,
      min_stock: 12,
      category_id: categories[1].id,
      purchase_price: 1.0,
      expiry_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    // Dairy
    products.push({
      id: uuidv4(),
      name: "Milk 1L",
      barcode: "300000001",
      price: 2.2,
      stock: 25,
      min_stock: 15,
      category_id: categories[2].id,
      purchase_price: 1.4,
      expiry_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    products.push({
      id: uuidv4(),
      name: "Yogurt 500g",
      barcode: "300000002",
      price: 2.8,
      stock: 30,
      min_stock: 10,
      category_id: categories[2].id,
      purchase_price: 1.6,
      expiry_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    // Bakery
    products.push({
      id: uuidv4(),
      name: "White Bread 500g",
      barcode: "400000001",
      price: 1.9,
      stock: 15,
      min_stock: 8,
      category_id: categories[3].id,
      purchase_price: 1.1,
      expiry_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    // Produce
    products.push({
      id: uuidv4(),
      name: "Bananas 1kg",
      barcode: "500000001",
      price: 2.4,
      stock: 20,
      min_stock: 8,
      category_id: categories[4].id,
      purchase_price: 1.5,
      expiry_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    products.push({
      id: uuidv4(),
      name: "Apples 1kg",
      barcode: "500000002",
      price: 3.2,
      stock: 18,
      min_stock: 7,
      category_id: categories[4].id,
      purchase_price: 2.0,
      expiry_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      is_pack: false,
    })

    // Generate some sales
    const sales: Sale[] = []
    const today = new Date()

    // Create 10 sample sales over the past week
    for (let i = 0; i < 10; i++) {
      const saleDate = new Date(today)
      saleDate.setDate(today.getDate() - Math.floor(Math.random() * 7)) // Random day in the past week

      const randomProducts = []
      const numProducts = Math.floor(Math.random() * 4) + 1 // 1-4 products per sale

      let subtotal = 0

      // Add random products to the sale
      for (let j = 0; j < numProducts; j++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)]
        const quantity = Math.floor(Math.random() * 3) + 1 // 1-3 quantity

        const lineTotal = randomProduct.price * quantity
        subtotal += lineTotal

        randomProducts.push({
          product_id: randomProduct.id,
          product_name: randomProduct.name,
          price: randomProduct.price,
          quantity: quantity,
          total: lineTotal,
        })
      }

      const tax = subtotal * 0.1 // 10% tax
      const total = subtotal + tax

      sales.push({
        id: uuidv4(),
        items: randomProducts,
        subtotal: subtotal,
        tax: tax,
        total: total,
        payment_method: Math.random() > 0.5 ? "cash" : "card",
        created_at: saleDate.toISOString(),
        cashier_id: "demo-user",
      })
    }

    // Save to local storage and file storage
    const db = readDatabase()
    if (db) {
      db.categories = categories
      db.products = products
      db.sales = sales
      writeDatabase(db)
    }

    // If online, also save to Supabase
    if (isOnline()) {
      try {
        // Clear existing data
        await supabase.from("products").delete().neq("id", "0")
        await supabase.from("categories").delete().neq("id", "0")

        // Insert new data
        await supabase.from("categories").insert(categories)
        await supabase.from("products").insert(products)
      } catch (error) {
        console.error("Error saving demo data to Supabase:", error)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error generating demo data:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Database backup
export const createBackup = async (path: string) => {
  try {
    const success = exportDatabase(path)
    return { success }
  } catch (error) {
    console.error("Error creating backup:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Database restore
export const restoreBackup = async (path: string) => {
  try {
    const success = importDatabase(path)
    return { success }
  } catch (error) {
    console.error("Error restoring backup:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Clear all data
export const clearAllData = async () => {
  try {
    const db = readDatabase()
    if (db) {
      db.products = []
      db.categories = []
      db.sales = []
      db.favorites = []
      writeDatabase(db)
    }

    // If online, also clear Supabase
    if (isOnline()) {
      try {
        await supabase.from("products").delete().neq("id", "0")
        await supabase.from("categories").delete().neq("id", "0")
        await supabase.from("sales").delete().neq("id", "0")
      } catch (error) {
        console.error("Error clearing data from Supabase:", error)
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Error clearing data:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Run system diagnostics
export const runDiagnostics = async () => {
  const results = {
    fileStorage: false,
    localStorageAccess: false,
    supabaseConnection: false,
    dataIntegrity: false,
  }

  // Check file storage
  try {
    const db = readDatabase()
    results.fileStorage = db !== null
  } catch (error) {
    console.error("File storage diagnostic failed:", error)
  }

  // Check local storage
  try {
    localStorage.setItem("diagnostic_test", "test")
    const test = localStorage.getItem("diagnostic_test")
    localStorage.removeItem("diagnostic_test")
    results.localStorageAccess = test === "test"
  } catch (error) {
    console.error("Local storage diagnostic failed:", error)
  }

  // Check Supabase connection
  try {
    if (isOnline()) {
      const { data, error } = await supabase.from("products").select("id").limit(1)
      results.supabaseConnection = !error
    } else {
      results.supabaseConnection = false
    }
  } catch (error) {
    console.error("Supabase connection diagnostic failed:", error)
  }

  // Check data integrity
  try {
    const products = getProducts()
    const hasInvalidProducts = products.some(
      (p: Product) => !p.id || !p.name || typeof p.price !== "number" || typeof p.stock !== "number",
    )
    results.dataIntegrity = !hasInvalidProducts
  } catch (error) {
    console.error("Data integrity diagnostic failed:", error)
  }

  return results
}

// Optimize database
export const optimizeDatabase = async () => {
  try {
    // For file storage, we can't do much optimization
    // But we can clean up any potential inconsistencies

    const db = readDatabase()
    if (db) {
      // Remove any duplicate products (by ID)
      const uniqueProducts: Product[] = []
      const productIds = new Set()

      for (const product of db.products) {
        if (!productIds.has(product.id)) {
          productIds.add(product.id)
          uniqueProducts.push(product)
        }
      }

      db.products = uniqueProducts

      // Remove any favorites that reference non-existent products
      db.favorites = db.favorites.filter((fav: { userId: string; productId: string }) =>
        db.products.some((p: Product) => p.id === fav.productId),
      )

      writeDatabase(db)
    }

    return { success: true }
  } catch (error) {
    console.error("Error optimizing database:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Clear application cache
export const clearCache = async () => {
  try {
    // Clear localStorage cache
    localStorage.removeItem("products_cache")
    localStorage.removeItem("categories_cache")
    localStorage.removeItem("sales_cache")

    // We don't actually delete the data, just the cache

    return { success: true }
  } catch (error) {
    console.error("Error clearing cache:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Verify data integrity and fix issues
export const verifyDataIntegrity = async () => {
  try {
    const db = readDatabase()
    if (!db) return { success: false, error: "Could not read database" }

    let fixedIssues = 0

    // Check products for required fields
    for (let i = 0; i < db.products.length; i++) {
      const product = db.products[i]

      // Fix missing or invalid fields
      if (!product.id) {
        product.id = uuidv4()
        fixedIssues++
      }

      if (!product.name) {
        product.name = `Unknown Product ${i}`
        fixedIssues++
      }

      if (typeof product.price !== "number" || isNaN(product.price)) {
        product.price = 0
        fixedIssues++
      }

      if (typeof product.stock !== "number" || isNaN(product.stock)) {
        product.stock = 0
        fixedIssues++
      }

      if (typeof product.min_stock !== "number" || isNaN(product.min_stock)) {
        product.min_stock = 0
        fixedIssues++
      }
    }

    // Check categories for required fields
    for (let i = 0; i < db.categories.length; i++) {
      const category = db.categories[i]

      if (!category.id) {
        category.id = uuidv4()
        fixedIssues++
      }

      if (!category.name) {
        category.name = `Unknown Category ${i}`
        fixedIssues++
      }
    }

    // Check sales for required fields
    for (let i = 0; i < db.sales.length; i++) {
      const sale = db.sales[i]

      if (!sale.id) {
        sale.id = uuidv4()
        fixedIssues++
      }

      if (!Array.isArray(sale.items)) {
        sale.items = []
        fixedIssues++
      }

      if (typeof sale.total !== "number" || isNaN(sale.total)) {
        // Recalculate total from items
        let total = 0
        for (const item of sale.items) {
          if (typeof item.total === "number") {
            total += item.total
          }
        }
        sale.total = total
        fixedIssues++
      }

      if (!sale.created_at) {
        sale.created_at = new Date().toISOString()
        fixedIssues++
      }
    }

    // Save fixed data
    writeDatabase(db)

    return {
      success: true,
      fixedIssues,
      message: fixedIssues > 0 ? `Fixed ${fixedIssues} data integrity issues` : "No issues found",
    }
  } catch (error) {
    console.error("Error verifying data integrity:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Schedule automatic backup
export const scheduleAutoBackup = (path: string, intervalDays: number) => {
  try {
    // Store the schedule in localStorage
    const schedule = {
      path,
      intervalDays,
      lastBackup: new Date().toISOString(),
      nextBackup: new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000).toISOString(),
    }

    localStorage.setItem("autoBackupSchedule", JSON.stringify(schedule))

    return { success: true }
  } catch (error) {
    console.error("Error scheduling auto backup:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Get auto backup schedule
export const getAutoBackupSchedule = () => {
  try {
    const scheduleJson = localStorage.getItem("autoBackupSchedule")
    if (!scheduleJson) return null

    return JSON.parse(scheduleJson)
  } catch (error) {
    console.error("Error getting auto backup schedule:", error)
    return null
  }
}

// Cancel auto backup
export const cancelAutoBackup = () => {
  try {
    localStorage.removeItem("autoBackupSchedule")
    return { success: true }
  } catch (error) {
    console.error("Error canceling auto backup:", error)
    return { success: false, error: (error as Error).message }
  }
}
