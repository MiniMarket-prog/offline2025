"use client"
import { getSyncQueue, removeFromSyncQueue } from "./local-storage"
import { supabase } from "./supabase"

// Process the sync queue
export const processQueue = async () => {
  const queue = getSyncQueue()

  if (queue.length === 0) {
    return { success: true, message: "No items to sync" }
  }

  let successCount = 0
  let errorCount = 0

  for (const item of queue) {
    try {
      switch (item.action) {
        case "createUser":
          // In a real app, you would implement the actual sync logic here
          // For example, creating the user in Supabase
          console.log("Syncing user creation:", item.data)
          // After successful sync, remove from queue
          removeFromSyncQueue(item.id)
          successCount++
          break

        case "createProduct":
          console.log("Syncing product creation:", item.data)
          const { error: productError } = await supabase.from("products").insert(item.data)

          if (productError) throw productError

          removeFromSyncQueue(item.id)
          successCount++
          break

        case "updateProduct":
          console.log("Syncing product update:", item.data)
          const { error: updateProductError } = await supabase.from("products").update(item.data).eq("id", item.data.id)

          if (updateProductError) throw updateProductError

          removeFromSyncQueue(item.id)
          successCount++
          break

        case "deleteProduct":
          console.log("Syncing product deletion:", item.data)
          const { error: deleteProductError } = await supabase.from("products").delete().eq("id", item.data.id)

          if (deleteProductError) throw deleteProductError

          removeFromSyncQueue(item.id)
          successCount++
          break

        case "createCategory":
          console.log("Syncing category creation:", item.data)
          const { error: categoryError } = await supabase.from("categories").insert(item.data)

          if (categoryError) throw categoryError

          removeFromSyncQueue(item.id)
          successCount++
          break

        case "updateCategory":
          console.log("Syncing category update:", item.data)
          const { error: updateCategoryError } = await supabase
            .from("categories")
            .update(item.data)
            .eq("id", item.data.id)

          if (updateCategoryError) throw updateCategoryError

          removeFromSyncQueue(item.id)
          successCount++
          break

        case "deleteCategory":
          console.log("Syncing category deletion:", item.data)
          const { error: deleteCategoryError } = await supabase.from("categories").delete().eq("id", item.data.id)

          if (deleteCategoryError) throw deleteCategoryError

          removeFromSyncQueue(item.id)
          successCount++
          break

        default:
          console.warn("Unknown sync action:", item.action)
          // Remove unknown actions to prevent queue clogging
          removeFromSyncQueue(item.id)
      }
    } catch (error) {
      console.error("Error processing sync item:", error)
      errorCount++
    }
  }

  return {
    success: errorCount === 0,
    message: `Synced ${successCount} items, ${errorCount} errors`,
  }
}

// Set up real-time sync when online
export const setupSync = () => {
  // Check connection status periodically
  const interval = setInterval(async () => {
    const online = navigator.onLine

    if (online) {
      // Process queue when online
      await processQueue()
    }
  }, 30000) // Check every 30 seconds

  // Also sync when coming back online
  window.addEventListener("online", async () => {
    await processQueue()
  })

  // Clean up on unmount
  return () => {
    clearInterval(interval)
  }
}
