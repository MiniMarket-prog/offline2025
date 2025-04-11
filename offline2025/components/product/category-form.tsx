"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createCategory } from "@/lib/product-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isOnline } from "@/lib/supabase"

export default function CategoryForm() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [online, setOnline] = useState(false) // Changed to useState

  // Added useEffect for online status
  useEffect(() => {
    // Set initial online status
    setOnline(isOnline())
    
    // Add event listeners to update online status in real-time
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const { category, error } = await createCategory({
      name,
      description: description || null,
    })

    if (error) {
      setError(error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setName("")
    setDescription("")
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Category</CardTitle>
        <CardDescription>Create a new product category</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!online && (
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-800" />
              <AlertDescription>
                You are currently offline. Category will be created when you reconnect.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Category created successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Category"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}