/**
 * Image Downloader Utility
 *
 * This utility provides functions for downloading and managing product images locally.
 * It uses localStorage to store images as data URLs for offline access.
 */

// Prefix for all image keys in localStorage
const IMAGE_STORAGE_PREFIX = "pos_app_image_"
const IMAGE_STORAGE_INDEX = "pos_app_image_index"

/**
 * Download an image from a URL and store it locally
 * @param url The URL of the image to download
 * @param productId The ID of the product the image belongs to
 * @returns The local path to the image
 */
export async function downloadImage(url: string, productId: string): Promise<string> {
  try {
    // Skip if URL is already a data URL or a local path
    if (url.startsWith("data:") || url.startsWith("pos_app_image_")) {
      return url
    }

    // Skip if we're not in a browser environment
    if (typeof window === "undefined") {
      return url
    }

    // Check if we already have this image
    const storageKey = `${IMAGE_STORAGE_PREFIX}${productId}`
    const existingImage = localStorage.getItem(storageKey)
    if (existingImage) {
      return storageKey
    }

    // Fetch the image
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }

    // Convert to blob and then to data URL
    const blob = await response.blob()
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        try {
          // Store the data URL in localStorage
          localStorage.setItem(storageKey, reader.result as string)

          // Update the image index
          updateImageIndex(storageKey)

          resolve(storageKey)
        } catch (error) {
          console.error("Error storing image:", error)
          reject(error)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (error) {
    console.error("Error downloading image:", error)
    return url // Fall back to the original URL
  }
}

/**
 * Get an image from local storage or fall back to the original URL
 * @param key The storage key or local path
 * @param fallbackUrl The original URL to fall back to
 * @returns The image data URL or the original URL
 */
export function getImage(key: string, fallbackUrl = ""): string {
  if (typeof window === "undefined") {
    return fallbackUrl
  }

  const storedImage = localStorage.getItem(key)
  return storedImage || fallbackUrl
}

/**
 * Check if an image exists locally
 * @param key The storage key or local path
 * @returns True if the image exists locally
 */
export function imageExistsLocally(key: string): boolean {
  if (typeof window === "undefined") {
    return false
  }
  return !!localStorage.getItem(key)
}

/**
 * Update the image index with a new key
 * @param key The storage key to add to the index
 */
function updateImageIndex(key: string): void {
  try {
    const indexStr = localStorage.getItem(IMAGE_STORAGE_INDEX)
    const index = indexStr ? JSON.parse(indexStr) : []

    if (!index.includes(key)) {
      index.push(key)
      localStorage.setItem(IMAGE_STORAGE_INDEX, JSON.stringify(index))
    }
  } catch (error) {
    console.error("Error updating image index:", error)
  }
}

/**
 * Get the number of locally stored images
 * @returns The number of images
 */
export function getLocalImagesCount(): number {
  try {
    const indexStr = localStorage.getItem(IMAGE_STORAGE_INDEX)
    const index = indexStr ? JSON.parse(indexStr) : []
    return index.length
  } catch (error) {
    console.error("Error getting image count:", error)
    return 0
  }
}

/**
 * Get the total size of locally stored images in KB
 * @returns The size in KB
 */
export function getLocalImagesSize(): number {
  try {
    const indexStr = localStorage.getItem(IMAGE_STORAGE_INDEX)
    const index = indexStr ? JSON.parse(indexStr) : []

    let totalSize = 0
    for (const key of index) {
      const image = localStorage.getItem(key)
      if (image) {
        totalSize += image.length
      }
    }

    // Convert from bytes to KB
    return Math.round(totalSize / 1024)
  } catch (error) {
    console.error("Error calculating image size:", error)
    return 0
  }
}

/**
 * Clear all locally stored images
 * @returns The number of images cleared
 */
export function clearLocalImages(): number {
  try {
    const indexStr = localStorage.getItem(IMAGE_STORAGE_INDEX)
    const index = indexStr ? JSON.parse(indexStr) : []

    for (const key of index) {
      localStorage.removeItem(key)
    }

    localStorage.removeItem(IMAGE_STORAGE_INDEX)
    return index.length
  } catch (error) {
    console.error("Error clearing images:", error)
    return 0
  }
}

/**
 * Download all product images
 * @returns Result object with counts
 */
export async function downloadAllProductImages(): Promise<{ total: number; success: number; failed: number }> {
  try {
    // This would normally fetch products from your service
    // For now, we'll simulate by getting products from localStorage
    const productsStr = localStorage.getItem("products")
    const products = productsStr ? JSON.parse(productsStr) : []

    let total = 0
    let success = 0
    let failed = 0

    for (const product of products) {
      if (product.image) {
        total++
        try {
          await downloadImage(product.image, product.id)
          success++
        } catch (error) {
          failed++
          console.error(`Failed to download image for product ${product.id}:`, error)
        }
      }
    }

    return { total, success, failed }
  } catch (error) {
    console.error("Error downloading all images:", error)
    throw error
  }
}
