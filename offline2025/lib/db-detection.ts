/**
 * Utility functions for detecting and initializing IndexedDB
 */

// Check if IndexedDB is available and working
export async function isIndexedDBAvailable(): Promise<boolean> {
    if (typeof window === "undefined") return false
  
    if (!window.indexedDB) {
      console.log("IndexedDB not supported by this browser")
      return false
    }
  
    // Test if we can actually use IndexedDB
    try {
      // Try to open a test database
      const request = window.indexedDB.open("_test_db_", 1)
  
      return new Promise((resolve) => {
        request.onerror = (event) => {
          console.error("IndexedDB test open failed:", request.error)
          // Check for specific error messages related to private browsing
          const errorMsg = request.error ? request.error.message.toLowerCase() : ""
          if (errorMsg.includes("private") || errorMsg.includes("incognito")) {
            console.warn("IndexedDB not available - likely in private browsing mode")
          }
          resolve(false)
        }
  
        request.onblocked = () => {
          console.error("IndexedDB test blocked")
          resolve(false)
        }
  
        request.onsuccess = () => {
          const db = request.result
          db.close()
          // Try to delete the test database
          const deleteRequest = window.indexedDB.deleteDatabase("_test_db_")
          deleteRequest.onsuccess = () => resolve(true)
          deleteRequest.onerror = () => {
            console.warn("Could not delete test database, but IndexedDB is available")
            resolve(true)
          }
        }
  
        // Set a timeout in case the request hangs
        setTimeout(() => {
          console.warn("IndexedDB test timed out")
          resolve(false)
        }, 2000)
      })
    } catch (error) {
      console.error("Error testing IndexedDB:", error)
      return false
    }
  }
  
  // Initialize storage system with appropriate fallback
  export async function initializeStorage(): Promise<{
    storageType: "indexeddb" | "localstorage" | "memory"
    error?: string
  }> {
    try {
      // First check if IndexedDB is available
      const indexedDBAvailable = await isIndexedDBAvailable()
  
      if (indexedDBAvailable) {
        try {
          // Try to initialize IndexedDB
          const { initDB } = await import("./indexed-db")
          await initDB()
          console.log("Successfully initialized IndexedDB")
          return { storageType: "indexeddb" }
        } catch (error) {
          console.error("Failed to initialize IndexedDB:", error)
          // Fall back to localStorage
        }
      }
  
      // Check if localStorage is available
      if (typeof window !== "undefined" && window.localStorage) {
        try {
          // Test localStorage
          localStorage.setItem("_test_", "test")
          localStorage.removeItem("_test_")
          console.log("Using localStorage as fallback storage")
          return { storageType: "localstorage" }
        } catch (error) {
          console.error("localStorage not available:", error)
        }
      }
  
      // If all else fails, use in-memory storage
      console.warn("Using in-memory storage (data will be lost on page refresh)")
      return {
        storageType: "memory",
        error: "Neither IndexedDB nor localStorage is available. Using in-memory storage.",
      }
    } catch (error) {
      console.error("Error initializing storage:", error)
      return {
        storageType: "memory",
        error: `Storage initialization error: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }
  