import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for interacting with your database
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create the client with offline support options
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  // Add global error handler to prevent unhandled promise rejections
  global: {
    fetch: (...args) => {
      // Wrap fetch with a timeout to prevent hanging
      const fetchPromise = fetch(...args)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 5000)
      })

      return Promise.race([fetchPromise, timeoutPromise]).catch((error) => {
        console.error("Supabase fetch error:", error)
        // Return a mock response when offline
        return new Response(JSON.stringify({ data: null, error: "Network error" }), {
          headers: { "content-type": "application/json" },
          status: 503,
        })
      }) as Promise<Response>
    },
  },
})

// Firefox-compatible offline detection
let _isOfflineOverride = false

// Function to manually set offline status (useful for Firefox)
export const setOfflineStatus = (isOffline: boolean) => {
  _isOfflineOverride = isOffline
  // Dispatch custom event to notify components
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("connectionstatuschange", {
        detail: { online: !isOffline },
      }),
    )
  }
}

// Enhanced isOnline function with Firefox support
export const isOnline = (): boolean => {
  // First check if we have a manual override
  if (_isOfflineOverride) {
    return false
  }

  // Then check navigator.onLine
  if (typeof navigator !== "undefined") {
    return navigator.onLine
  }

  return true // Default to online for SSR
}

// Modify the safeSupabaseCall function to better handle offline scenarios
export const safeSupabaseCall = async <T>(
  operation: () => Promise<T>,
  fallback: T
)
: Promise<T> =>
{
  // First check if we're offline before even attempting the operation
  if (!isOnline()) {
    console.log("Offline mode: Using fallback data")
    return fallback;
  }

  try {
    // Set a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Supabase operation timed out")), 5000)
    })

    // Race the operation against the timeout
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    console.error("Error in Supabase operation:", error)
    return fallback;
  }
}

// More robust check that doesn't hang
export function checkOnlineStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    // If we have a manual override, respect it
    if (_isOfflineOverride) {
      resolve(false)
      return
    }

    // Use navigator.onLine as a quick first check
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      resolve(false)
      return
    }

    // Set a timeout to prevent hanging
    const timeout = setTimeout(() => {
      resolve(false)
    }, 3000)

    // Try to fetch a small resource
    fetch("/api/ping", {
      method: "HEAD",
      cache: "no-store",
      // Add a cache-busting parameter
      headers: { Pragma: "no-cache" },
    })
      .then(() => {
        clearTimeout(timeout)
        resolve(true)
      })
      .catch(() => {
        clearTimeout(timeout)
        resolve(false)
      })
  })
}
