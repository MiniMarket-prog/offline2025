"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface ProductSearchProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

const ProductSearch = React.forwardRef<HTMLInputElement, ProductSearchProps>(({ value, onChange, onClear }, ref) => {
  const [inputValue, setInputValue] = useState(value)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    onChange(e.target.value)
  }

  const handleClear = () => {
    setInputValue("")
    onClear()
  }

  // Handle barcode scanner input
  useEffect(() => {
    let barcodeBuffer = ""
    let lastKeyTime = 0
    const BARCODE_SCAN_TIMEOUT = 50 // milliseconds between keystrokes

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentTime = new Date().getTime()

      // If it's a rapid succession of keys (like from a scanner)
      if (currentTime - lastKeyTime < BARCODE_SCAN_TIMEOUT && e.key !== "Enter") {
        barcodeBuffer += e.key
      } else if (e.key !== "Enter") {
        // Start a new barcode scan
        barcodeBuffer = e.key
      }

      lastKeyTime = currentTime

      // When Enter is pressed, process the barcode
      if (e.key === "Enter" && barcodeBuffer) {
        onChange(barcodeBuffer)
        barcodeBuffer = ""
        e.preventDefault()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [onChange])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        ref={ref}
        type="text"
        placeholder="Search products or scan barcode..."
        value={inputValue}
        onChange={handleChange}
        className="pl-10 pr-10"
      />
      {inputValue && (
        <Button variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={handleClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
})

ProductSearch.displayName = "ProductSearch"

export default ProductSearch
