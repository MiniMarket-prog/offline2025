import { supabase, isOnline } from "./supabase"
import { getSyncQueueItems, removeFromSyncQueue } from "./data-bridge"

// Define the sync queue item type
interface SyncQueueItem {
  id: string
  action: string
  data: any
  timestamp: string
  attempts?: number
  status?: "pending" | "processing" | "failed" | "completed"
}

// Process the sync queue when the app comes online
export const processSyncQueue = async (): Promise<{ success: boolean; processed: number; failed: number }> => {
  if (!isOnline()) {
    console.log("Cannot process sync queue while offline")
    return { success: false, processed: 0, failed: 0 }
  }

  try {
    console.log("Processing sync queue...")
    const items = await getSyncQueueItems()

    if (items.length === 0) {
      console.log("No items in sync queue")
      return { success: true, processed: 0, failed: 0 }
    }

    console.log(`Found ${items.length} items in sync queue`)
    let processed = 0
    let failed = 0

    // Sort items by timestamp to process them in order
    items.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    for (const item of items) {
      try {
        console.log(`Processing sync item: ${item.action} (${item.id})`)
        await processQueueItem(item)

        // Delete the item after successful processing
        await removeFromSyncQueue(item.id)
        processed++
        console.log(`Successfully processed sync item: ${item.id}`)
      } catch (error) {
        console.error(`Error processing sync item ${item.id}:`, error)
        failed++
      }
    }

    console.log(`Sync queue processing complete: ${processed} processed, ${failed} failed`)
    return { success: true, processed, failed }
  } catch (error) {
    console.error("Error processing sync queue:", error)
    return { success: false, processed: 0, failed: 0 }
  }
}

// Process a single queue item
const processQueueItem = async (item: SyncQueueItem): Promise<void> => {
  if (!isOnline()) {
    throw new Error("Cannot process sync item while offline")
  }

  switch (item.action) {
    case "createProduct":
      console.log("Creating product:", item.data.name)
      await supabase.from("products").insert([item.data])
      break

    case "updateProduct":
      console.log("Updating product:", item.data.id)
      const { id: productId, ...productData } = item.data
      await supabase.from("products").update(productData).eq("id", productId)
      break

    case "deleteProduct":
      console.log("Deleting product:", item.data.id)
      await supabase.from("products").delete().eq("id", item.data.id)
      break

    case "createCategory":
      console.log("Creating category:", item.data.name)
      await supabase.from("categories").insert([item.data])
      break

    case "updateCategory":
      console.log("Updating category:", item.data.id)
      const { id: categoryId, ...categoryData } = item.data
      await supabase.from("categories").update(categoryData).eq("id", categoryId)
      break

    case "deleteCategory":
      console.log("Deleting category:", item.data.id)
      await supabase.from("categories").delete().eq("id", item.data.id)
      break

    case "createSale":
      console.log("Creating sale:", item.data.id)
      await supabase.from("sales").insert([item.data])
      break

    case "updateSale":
      console.log("Updating sale:", item.data.id)
      const { id: saleId, ...saleData } = item.data
      await supabase.from("sales").update(saleData).eq("id", saleId)
      break

    case "deleteSale":
      console.log("Deleting sale:", item.data.id)
      await supabase.from("sales").delete().eq("id", item.data.id)
      break

    case "updateStock":
      console.log("Updating stock for product:", item.data.id)
      await supabase.from("products").update({ stock: item.data.stock }).eq("id", item.data.id)
      break

    default:
      throw new Error(`Unknown action: ${item.action}`)
  }
}

// Add an item to the sync queue
// This function needs to be exported so it can be used in data-access.ts
export const addToSyncQueue = async (action: string, data: any): Promise<string> => {
  console.log(`Adding to sync queue: ${action}`)

  const item: SyncQueueItem = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    action,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0,
    status: "pending",
  }

  // Use the imported addToSyncQueue from data-bridge
  // This is a circular dependency, so we need to import it dynamically
  const { addToSyncQueue: addToQueue } = await import("./data-bridge")
  return await addToQueue(action, data)
}

// Set up listeners for online/offline events
export const setupSyncListeners = (): void => {
  if (typeof window !== "undefined") {
    window.addEventListener("online", async () => {
      console.log("App is online, processing sync queue...")
      await processSyncQueue()
    })

    // Register for background sync if available
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        // Use type assertion to handle the sync property
        ;(registration as any).sync
          .register("sync-pending-operations")
          .then(() => console.log("Background sync registered"))
          .catch((err: Error) => console.error("Background sync registration failed:", err))
      })
    }
  }
}

// Initialize the sync manager
export const initSyncManager = (): void => {
  console.log("Initializing sync manager...")
  setupSyncListeners()

  // If we're online when the app starts, process any pending sync items
  if (isOnline()) {
    setTimeout(() => {
      processSyncQueue().catch((error) => {
        console.error("Error during initial sync queue processing:", error)
      })
    }, 3000) // Delay to ensure storage is ready
  }
}

// Get sync queue status
export const getSyncQueueStatus = async (): Promise<{
  total: number
  pending: number
  processing: number
  failed: number
}> => {
  try {
    const items = await getSyncQueueItems()

    return {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      processing: items.filter((item) => item.status === "processing").length,
      failed: items.filter((item) => item.status === "failed").length,
    }
  } catch (error) {
    console.error("Error getting sync queue status:", error)
    return { total: 0, pending: 0, processing: 0, failed: 0 }
  }
}

// Retry failed sync items
export const retryFailedSyncItems = async (): Promise<boolean> => {
  try {
    const items = await getSyncQueueItems()
    const failedItems = items.filter((item) => item.status === "failed")

    for (const item of failedItems) {
      item.status = "pending"
      item.attempts = 0
      // Use the exported addToSyncQueue function
      await addToSyncQueue(item.action, item.data)
      await removeFromSyncQueue(item.id)
    }

    if (failedItems.length > 0 && isOnline()) {
      await processSyncQueue()
    }

    return true
  } catch (error) {
    console.error("Error retrying failed sync items:", error)
    return false
  }
}
