import AppLayout from "@/components/layout/app-layout"
import CategoryList from "@/components/product/category-list"
import CategoryForm from "@/components/product/category-form"

export default function CategoriesPage() {
  return (
    <AppLayout>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <CategoryForm />
        </div>
        <div>
          <CategoryList />
        </div>
      </div>
    </AppLayout>
  )
}
