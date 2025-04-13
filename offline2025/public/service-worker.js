// Version your cache
const CACHE_VERSION = "v7" // Incremented version
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`
const DB_CACHE = `db-${CACHE_VERSION}`

// App routes that should work offline - make sure ALL your app routes are listed here
const APP_ROUTES = [
  "/",
  "/dashboard",
  "/products",
  "/pos",
  "/categories",
  "/sales",
  "/users",
  "/settings",
  "/alerts",
  "/setup-admin",
]

// Resources to cache immediately - add critical assets here
const STATIC_RESOURCES = [
  ...APP_ROUTES,
  "/offline.html",
  "/placeholder.svg",
  "/globals.css",
  "/manifest.json", // Ensure manifest is explicitly listed
  "/icons/icon-192.png",
  "/icons/icon-512.png",
]

// Install event - cache static resources
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing Service Worker...")
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log("[Service Worker] Caching static resources")
      return cache.addAll(STATIC_RESOURCES)
    }),
  )
  // Activate immediately
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating Service Worker...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              (cacheName.startsWith("static-") && cacheName !== STATIC_CACHE) ||
              (cacheName.startsWith("dynamic-") && cacheName !== DYNAMIC_CACHE) ||
              (cacheName.startsWith("api-") && cacheName !== API_CACHE) ||
              (cacheName.startsWith("db-") && cacheName !== DB_CACHE)
            )
          })
          .map((cacheName) => {
            console.log("[Service Worker] Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }),
      )
    }),
  )

  // Claim clients so the service worker is in control immediately
  return self.clients.claim()
})

// Helper function to determine if a request is for an API
const isApiRequest = (url) => {
  return url.includes("/api/") || url.includes("supabase.co")
}

// Helper function to determine if a request is for an HTML page
const isHtmlRequest = (request) => {
  return request.headers.get("accept")?.includes("text/html")
}

// Helper function to determine if a request is for a static asset
const isStaticAsset = (url) => {
  const staticExtensions = [
    ".js",
    ".css",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".json", // Added .json to ensure manifest.json is cached
  ]
  return staticExtensions.some((ext) => url.pathname.endsWith(ext))
}

// Helper function to determine if a request is for a navigation
const isNavigationRequest = (request) => {
  return request.mode === "navigate" || (request.method === "GET" && isHtmlRequest(request))
}

// Helper function to determine if a URL is an app route
const isAppRoute = (url) => {
  const pathname = new URL(url).pathname
  return APP_ROUTES.includes(pathname) || APP_ROUTES.some((route) => pathname.startsWith(route + "/"))
}

// Helper function to determine if a request is for the manifest
const isManifestRequest = (url) => {
  return url.pathname.endsWith("manifest.json") || url.pathname.endsWith("manifest.webmanifest")
}

// Improved fetch event handler with better offline navigation support
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  // Special handling for manifest.json - use cache-first strategy
  if (isManifestRequest(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(event.request)
          .then((response) => {
            // Clone the response before using it
            const responseToCache = response.clone()

            // Cache the manifest
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // If fetch fails and no cache, return a basic manifest
            return new Response(
              JSON.stringify({
                name: "Mini Market POS",
                short_name: "MiniPOS",
                start_url: "/",
                display: "standalone",
                background_color: "#ffffff",
                theme_color: "#3b82f6",
                icons: [
                  {
                    src: "/icons/icon-192.png",
                    sizes: "192x192",
                    type: "image/png",
                  },
                  {
                    src: "/icons/icon-512.png",
                    sizes: "512x512",
                    type: "image/png",
                  },
                ],
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            )
          })
      }),
    )
    return
  }

  // Skip cross-origin requests except for Supabase
  if (url.origin !== self.location.origin && !url.hostname.includes("supabase.co")) {
    return
  }

  // For navigation requests to app routes, use a network-first strategy with fallback to cache
  if (isNavigationRequest(event.request) && isAppRoute(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const responseToCache = response.clone()

          // Cache the response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // If not in cache, try to match the path without query params
            const urlWithoutQuery = url.origin + url.pathname
            return caches.match(new Request(urlWithoutQuery)).then((pathMatchResponse) => {
              if (pathMatchResponse) {
                return pathMatchResponse
              }

              // If still not found, try to match the root page
              return caches.match("/").then((rootResponse) => {
                if (rootResponse) {
                  return rootResponse
                }
                // As a last resort, return the offline page
                return caches.match("/offline.html")
              })
            })
          })
        }),
    )
    return
  }

  // For API requests - Network first, then cache
  if (isApiRequest(url.toString())) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const responseToCache = response.clone()

          // Only cache successful responses
          if (response.ok) {
            caches.open(API_CACHE).then((cache) => {
              cache.put(event.request, responseToCache)
            })
          }

          return response
        })
        .catch(() => {
          // If network fails, try to get from cache
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }

            // For API requests with no cache, return an empty response
            return new Response(JSON.stringify({ error: "You are offline", offline: true }), {
              status: 503,
              headers: { "Content-Type": "application/json" },
            })
          })
        }),
    )
    return
  }

  // For static assets, use cache-first strategy
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(event.request)
          .then((response) => {
            // Clone the response before using it
            const responseToCache = response.clone()

            // Cache the response
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache)
            })

            return response
          })
          .catch(() => {
            // For failed static assets, return a simple error
            if (url.pathname.endsWith(".js") || url.pathname.endsWith(".css")) {
              return new Response("/* Failed to load resource */", {
                status: 503,
                headers: { "Content-Type": url.pathname.endsWith(".js") ? "application/javascript" : "text/css" },
              })
            }
            return new Response("Failed to load resource", { status: 503 })
          })
      }),
    )
    return
  }

  // For all other requests, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response
        return cachedResponse
      }

      // If not in cache, fetch from network
      return fetch(event.request)
        .then((response) => {
          // Clone the response before using it
          const responseToCache = response.clone()

          // Cache the fetched response
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // For other requests, return a simple error
          return new Response("Offline content not available", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          })
        })
    }),
  )
})

// Background sync for offline operations
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Syncing...", event.tag)

  if (event.tag === "sync-pending-operations") {
    event.waitUntil(syncPendingOperations())
  }
})

// Function to sync pending operations
async function syncPendingOperations() {
  console.log("[Service Worker] Syncing pending operations...")

  try {
    // Try to open IndexedDB
    const request = indexedDB.open("mini-market-pos", 1)

    request.onerror = (event) => {
      console.error("[Service Worker] IndexedDB error:", event)
    }

    request.onsuccess = (event) => {
      const db = event.target.result

      try {
        // Get sync queue items
        const transaction = db.transaction("syncQueue", "readonly")
        const store = transaction.objectStore("syncQueue")
        const getAllRequest = store.getAll()

        getAllRequest.onsuccess = () => {
          const items = getAllRequest.result
          console.log("[Service Worker] Found", items.length, "items to sync")

          // Process each item
          items.forEach(async (item) => {
            try {
              // Attempt to sync with server
              const response = await fetch("/api/sync", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(item),
              })

              if (response.ok) {
                // If successful, remove from queue
                const deleteTx = db.transaction("syncQueue", "readwrite")
                const deleteStore = deleteTx.objectStore("syncQueue")
                deleteStore.delete(item.id)
                console.log("[Service Worker] Successfully synced item:", item.id)
              }
            } catch (error) {
              console.error("[Service Worker] Failed to sync item:", item, error)
            }
          })
        }

        getAllRequest.onerror = (event) => {
          console.error("[Service Worker] Error getting sync items:", event)
        }
      } catch (error) {
        console.error("[Service Worker] Transaction error:", error)
      }
    }
  } catch (error) {
    console.error("[Service Worker] Sync failed:", error)
  }
}

// Listen for messages from the client
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
