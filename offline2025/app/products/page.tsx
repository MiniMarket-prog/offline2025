import AppLayout from "@/components/layout/app-layout"
import ProductList from "@/components/product/product-list"
import ProductForm from "@/components/product/product-form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductsPage() {
  return (
    <AppLayout>
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Product List</TabsTrigger>
          <TabsTrigger value="add">Add Product</TabsTrigger>
        </TabsList>
        <TabsContent value="list" className="space-y-4">
          <ProductList />
        </TabsContent>
        <TabsContent value="add" className="space-y-4">
          <ProductForm />
        </TabsContent>
      </Tabs>
    </AppLayout>
  )
}
