"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

type Product = {
  id: string
  name: string
  barcode?: string | null
  price: number
  stock: number
  min_stock: number
  image?: string | null
  description?: string | null
  category_id?: string | null
  purchase_price?: number | null
  expiry_date?: string | null
  expiry_notification_days?: number | null
  is_pack?: boolean | null
  parent_product_id?: string | null
  pack_quantity?: number | null
  pack_discount_percentage?: number | null
  created_at?: string
  updated_at?: string
}

type Category = {
  id: string
  name: string
  description?: string | null
  created_at?: string
  updated_at?: string
}

type MigrationLog = {
  id: string
  message: string
  type: "info" | "success" | "error" | "warning"
  timestamp: Date
}

type DuplicateStrategy = "skip" | "update" | "generate"
type CategoryStrategy = "migrate" | "null" | "skip"

export default function MigrateProducts() {
  const [sourceUrl, setSourceUrl] = useState("")
  const [sourceKey, setSourceKey] = useState("")
  const [isMigrating, setIsMigrating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<MigrationLog[]>([])
  const [totalProducts, setTotalProducts] = useState(0)
  const [migratedProducts, setMigratedProducts] = useState(0)
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>("skip")
  const [categoryStrategy, setCategoryStrategy] = useState<CategoryStrategy>("migrate")
  const [sourceClient, setSourceClient] = useState<any>(null)

  // Add a log entry
  const addLog = (message: string, type: "info" | "success" | "error" | "warning" = "info") => {
    const log: MigrationLog = {
      id: Date.now().toString(),
      message,
      type,
      timestamp: new Date(),
    }
    setLogs((prev) => [log, ...prev])
  }

  // Initialize source client when URL and key are provided
  useEffect(() => {
    if (sourceUrl && sourceKey) {
      try {
        const client = createClient(sourceUrl, sourceKey)
        setSourceClient(client)
      } catch (error) {
        addLog(`Failed to initialize source client: ${error}`, "error")
      }
    }
  }, [sourceUrl, sourceKey])

  // Start migration process
  const startMigration = async () => {
    if (!sourceClient) {
      addLog("Source client not initialized. Please check URL and key.", "error")
      return
    }

    setIsMigrating(true)
    setProgress(0)
    setMigratedProducts(0)
    setLogs([])

    try {
      addLog("Starting migration process...", "info")

      // Step 1: Count total products
      const { count: productCount, error: countError } = await sourceClient
        .from("products")
        .select("*", { count: "exact", head: true })

      if (countError) {
        throw new Error(`Failed to count products: ${countError.message}`)
      }

      setTotalProducts(productCount || 0)
      addLog(`Found ${productCount} products to migrate.`, "info")

      // Step 2: Handle categories if needed
      let categoryMap: Record<string, string> = {}
      if (categoryStrategy === "migrate") {
        categoryMap = await migrateCategories()
      }

      // Step 3: Migrate products with pagination
      const pageSize = 1000 // Supabase limit
      const totalPages = Math.ceil(productCount / pageSize)

      for (let page = 0; page < totalPages; page++) {
        const from = page * pageSize
        const to = from + pageSize - 1

        addLog(`Fetching products page ${page + 1} of ${totalPages} (${from}-${to})...`, "info")

        const { data: products, error: fetchError } = await sourceClient
          .from("products")
          .select("*")
          .range(from, to)
          .order("created_at", { ascending: true })

        if (fetchError) {
          throw new Error(`Failed to fetch products: ${fetchError.message}`)
        }

        if (!products || products.length === 0) {
          addLog(`No products found on page ${page + 1}.`, "warning")
          continue
        }

        addLog(`Processing ${products.length} products from page ${page + 1}...`, "info")

        // Process products in smaller batches to avoid rate limiting
        const batchSize = 10
        const batches = Math.ceil(products.length / batchSize)

        for (let i = 0; i < batches; i++) {
          const start = i * batchSize
          const end = Math.min(start + batchSize, products.length)
          const batch = products.slice(start, end)

          await processBatch(batch, categoryMap)

          // Update progress
          const processedSoFar = migratedProducts + page * pageSize + end
          const newProgress = Math.min(Math.round((processedSoFar / totalProducts) * 100), 100)
          setProgress(newProgress)

          // Small delay to prevent overwhelming the API
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      addLog("Migration completed successfully!", "success")
    } catch (error: any) {
      addLog(`Migration failed: ${error.message}`, "error")
    } finally {
      setIsMigrating(false)
      setProgress(100)
    }
  }

  // Migrate categories and return a mapping from source to target IDs
  const migrateCategories = async (): Promise<Record<string, string>> => {
    addLog("Starting category migration...", "info")
    const categoryMap: Record<string, string> = {}

    try {
      // Fetch all categories from source
      const { data: sourceCategories, error: fetchError } = await sourceClient.from("categories").select("*")

      if (fetchError) {
        throw new Error(`Failed to fetch categories: ${fetchError.message}`)
      }

      if (!sourceCategories || sourceCategories.length === 0) {
        addLog("No categories found in source database.", "info")
        return categoryMap
      }

      addLog(`Found ${sourceCategories.length} categories in source database.`, "info")

      // Fetch existing categories from target
      const { data: targetCategories, error: targetFetchError } = await supabase.from("categories").select("*")

      if (targetFetchError) {
        throw new Error(`Failed to fetch target categories: ${targetFetchError.message}`)
      }

      const existingCategoryNames = new Set(targetCategories?.map((c) => c.name.toLowerCase()) || [])
      const existingCategoryMap: Record<string, string> = {}

      if (targetCategories) {
        targetCategories.forEach((c) => {
          existingCategoryMap[c.name.toLowerCase()] = c.id
        })
      }

      // Process each category
      for (const category of sourceCategories) {
        try {
          // Check if category already exists by name
          if (existingCategoryNames.has(category.name.toLowerCase())) {
            const targetId = existingCategoryMap[category.name.toLowerCase()]
            categoryMap[category.id] = targetId
            addLog(`Category "${category.name}" already exists, mapped ID ${category.id} to ${targetId}`, "info")
            continue
          }

          // Prepare category data
          const { id, created_at, updated_at, ...categoryData } = category

          // Insert category
          const { data: insertedCategory, error: insertError } = await supabase
            .from("categories")
            .insert([categoryData])
            .select()

          if (insertError) {
            throw new Error(`Failed to insert category "${category.name}": ${insertError.message}`)
          }

          if (insertedCategory && insertedCategory.length > 0) {
            categoryMap[category.id] = insertedCategory[0].id
            addLog(`Migrated category "${category.name}"`, "success")
          }
        } catch (error: any) {
          addLog(`Failed to migrate category "${category.name}": ${error.message}`, "error")
        }
      }

      addLog(`Category migration completed. Migrated ${Object.keys(categoryMap).length} categories.`, "success")
      return categoryMap
    } catch (error: any) {
      addLog(`Category migration failed: ${error.message}`, "error")
      return categoryMap
    }
  }

  // Process a batch of products
  const processBatch = async (products: Product[], categoryMap: Record<string, string>) => {
    for (const product of products) {
      try {
        await migrateProduct(product, categoryMap)
        setMigratedProducts((prev) => prev + 1)
      } catch (error: any) {
        addLog(`Failed to process product "${product.name}": ${error.message}`, "error")
      }
    }
  }

  // Migrate a single product
  const migrateProduct = async (product: Product, categoryMap: Record<string, string>) => {
    try {
      // Handle category mapping
      if (product.category_id) {
        // Fix the TypeScript error by using a switch statement instead of if-else
        switch (categoryStrategy) {
          case "migrate":
            // Map to new category ID
            if (categoryMap[product.category_id]) {
              product.category_id = categoryMap[product.category_id]
            } else {
              if (categoryStrategy === "migrate") {
                // If we're in migrate strategy but the category wasn't mapped,
                // handle according to the strategy
                product.category_id = null
                addLog(`Category not found for product "${product.name}", setting to null`, "warning")
              }
            }
            break
          case "null":
            product.category_id = null
            break
          case "skip":
            if (!categoryMap[product.category_id]) {
              addLog(`Skipping product "${product.name}" due to missing category`, "warning")
              return
            }
            break
        }
      }

      // Check for duplicate barcode
      if (product.barcode) {
        const { data: existingProduct, error: checkError } = await supabase
          .from("products")
          .select("id, name")
          .eq("barcode", product.barcode)
          .maybeSingle()

        if (checkError) {
          throw new Error(`Error checking for duplicate barcode: ${checkError.message}`)
        }

        if (existingProduct) {
          // Handle according to strategy
          if (duplicateStrategy === "skip") {
            addLog(`Skipping product "${product.name}" - barcode "${product.barcode}" already exists`, "warning")
            return
          } else if (duplicateStrategy === "update") {
            // Update existing product
            const { id, created_at, updated_at, ...updateData } = product
            const { error: updateError } = await supabase
              .from("products")
              .update(updateData)
              .eq("id", existingProduct.id)

            if (updateError) {
              throw new Error(`Failed to update product: ${updateError.message}`)
            }

            addLog(`Updated existing product "${product.name}" with barcode "${product.barcode}"`, "success")
            return
          } else if (duplicateStrategy === "generate") {
            // Generate new unique barcode
            const timestamp = Date.now().toString().slice(-6)
            const random = Math.floor(Math.random() * 1000)
              .toString()
              .padStart(3, "0")
            const originalBarcode = product.barcode
            product.barcode = `${product.barcode}_${timestamp}${random}`
            addLog(
              `Generated new barcode "${product.barcode}" for product "${product.name}" (was "${originalBarcode}")`,
              "warning",
            )
          }
        }
      }

      // Remove fields that shouldn't be inserted
      const { id, created_at, updated_at, ...insertData } = product

      // Insert the product
      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert([insertData])
        .select()

      if (insertError) {
        throw new Error(`Failed to insert product "${product.name}": ${insertError.message}`)
      }

      addLog(`Successfully migrated product "${product.name}"`, "success")
    } catch (error: any) {
      addLog(`Failed to insert: "${product.name}" - ${error.message}`, "error")
      throw error
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Migrate Products from Another Supabase Project</CardTitle>
          <CardDescription>
            Transfer products from another Supabase project to this one. This tool will handle pagination, duplicate
            barcodes, and category relationships.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="sourceUrl">Source Supabase URL</Label>
                <Input
                  id="sourceUrl"
                  placeholder="https://your-project.supabase.co"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  disabled={isMigrating}
                />
              </div>
              <div>
                <Label htmlFor="sourceKey">Source Supabase Anon Key</Label>
                <Input
                  id="sourceKey"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={sourceKey}
                  onChange={(e) => setSourceKey(e.target.value)}
                  disabled={isMigrating}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Duplicate Barcode Handling</Label>
              <RadioGroup value={duplicateStrategy} onValueChange={(v) => setDuplicateStrategy(v as DuplicateStrategy)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip" disabled={isMigrating} />
                  <Label htmlFor="skip">Skip duplicates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="update" id="update" disabled={isMigrating} />
                  <Label htmlFor="update">Update existing products</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="generate" id="generate" disabled={isMigrating} />
                  <Label htmlFor="generate">Generate new unique barcodes</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Category Handling</Label>
              <RadioGroup value={categoryStrategy} onValueChange={(v) => setCategoryStrategy(v as CategoryStrategy)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="migrate" id="migrate-categories" disabled={isMigrating} />
                  <Label htmlFor="migrate-categories">Migrate categories first</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="null" id="null-categories" disabled={isMigrating} />
                  <Label htmlFor="null-categories">Set category to null</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="skip" id="skip-categories" disabled={isMigrating} />
                  <Label htmlFor="skip-categories">Skip products with invalid categories</Label>
                </div>
              </RadioGroup>
            </div>

            <Button onClick={startMigration} disabled={isMigrating || !sourceUrl || !sourceKey} className="w-full">
              {isMigrating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Migrating...
                </>
              ) : (
                "Start Migration"
              )}
            </Button>

            {isMigrating && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>
                    Progress: {migratedProducts} of {totalProducts} products
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Log</CardTitle>
            <CardDescription>
              {logs.filter((log) => log.type === "success").length} succeeded,{" "}
              {logs.filter((log) => log.type === "error").length} failed,{" "}
              {logs.filter((log) => log.type === "warning").length} warnings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.map((log) => (
                <Alert
                  key={log.id}
                  variant={log.type === "error" ? "destructive" : log.type === "warning" ? "default" : "default"}
                  className={
                    log.type === "success"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : log.type === "warning"
                        ? "border-yellow-200 bg-yellow-50 text-yellow-800"
                        : log.type === "error"
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-blue-200 bg-blue-50 text-blue-800"
                  }
                >
                  <div className="flex items-start">
                    {log.type === "success" ? (
                      <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
                    ) : log.type === "error" ? (
                      <XCircle className="h-4 w-4 mr-2 mt-0.5" />
                    ) : log.type === "warning" ? (
                      <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
                    ) : (
                      <div className="h-4 w-4 mr-2" />
                    )}
                    <div>
                      <AlertTitle className="text-sm font-medium">{log.timestamp.toLocaleTimeString()}</AlertTitle>
                      <AlertDescription className="text-sm">{log.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
