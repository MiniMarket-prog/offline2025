"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ImageOff } from "lucide-react"

interface ProductImageProps {
  src: string | null
  alt: string
  size?: "sm" | "md" | "lg"
  productId: string
  className?: string
}

export default function ProductImage({ src, alt, size = "md", productId, className }: ProductImageProps) {
  const [error, setError] = useState(false)

  // Define sizes based on the size prop
  const sizes = {
    sm: { width: 40, height: 40 },
    md: { width: 100, height: 100 },
    lg: { width: 200, height: 200 },
  }

  const { width, height } = sizes[size]

  // If there's no image or there was an error loading it
  if (!src || error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 rounded-md",
          {
            "w-10 h-10": size === "sm",
            "w-[100px] h-[100px]": size === "md",
            "w-[200px] h-[200px]": size === "lg",
          },
          className,
        )}
      >
        <ImageOff className="h-1/2 w-1/2 text-gray-400" />
      </div>
    )
  }

  // For all images, use a regular img tag instead of Next.js Image component
  // This avoids domain configuration issues completely
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gray-100",
        {
          "w-10 h-10": size === "sm",
          "w-[100px] h-[100px]": size === "md",
          "w-[200px] h-[200px]": size === "lg",
        },
        className,
      )}
    >
      <img
        src={src || "/placeholder.svg"}
        alt={alt}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
      />
    </div>
  )
}
