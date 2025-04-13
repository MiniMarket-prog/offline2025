import MigrateProducts from "@/scripts/migrate-products"

export default function MigratePage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Data Migration</h1>
      <MigrateProducts />
    </div>
  )
}
