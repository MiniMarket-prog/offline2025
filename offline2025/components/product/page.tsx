import AppLayout from "@/components/layout/app-layout"
import ProductList from "@/components/product/product-list"

export default function ProductsPage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <ProductList />
      </div>
    </AppLayout>
  )
}
