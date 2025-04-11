"use client"

import { useState, useEffect } from "react"
import { fetchCategories, deleteCategory } from "@/lib/product-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, RefreshCw, Trash2, Edit, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isOnline } from "@/lib/supabase"
import type { Database } from "@/types/supabase"

type Category = Database["public"]["Tables"]["categories"]["Row"]

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [online, setOnline] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  // Handle online status with useEffect to avoid hydration errors
  useEffect(() => {
    setOnline(isOnline())

    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { categories, error } = await fetchCategories()

      if (error) {
        setError(error)
      } else {
        setCategories(categories)
        applyFilters(categories, searchQuery)
      }
    } catch (err: any) {
      setError(err.message || "Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = (categoryList: Category[], search: string) => {
    if (!search.trim()) {
      setFilteredCategories(categoryList)
      return
    }

    const lowerSearch = search.toLowerCase()
    const filtered = categoryList.filter((category) => category.name.toLowerCase().includes(lowerSearch))
    setFilteredCategories(filtered)
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        // Assuming you have a deleteCategory function in your product-service
        const { success, error } = await deleteCategory(id)

        if (error) {
          setError(error)
        } else if (success) {
          const updatedCategories = categories.filter((category) => category.id !== id)
          setCategories(updatedCategories)
          applyFilters(updatedCategories, searchQuery)
        }
      } catch (err: any) {
        setError(err.message || "Failed to delete category")
      }
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters(categories, searchQuery)
  }, [searchQuery, categories])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Categories</CardTitle>
      </CardHeader>
      <CardContent>
        {!online && (
          <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertDescription>You are currently offline. Category list may not be up to date.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No categories found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "—"}</TableCell>
                        <TableCell>0</TableCell> {/* This would be populated with actual product count */}
                        <TableCell>
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingCategory(category)}
                              title="Edit Category"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(category.id)}
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
