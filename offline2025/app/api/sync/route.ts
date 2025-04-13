import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const syncItem = await request.json()

    if (!syncItem || !syncItem.action || !syncItem.data) {
      return NextResponse.json({ error: "Invalid sync item" }, { status: 400 })
    }

    // Process the sync item based on its action
    switch (syncItem.action) {
      case "createProduct":
        await supabase.from("products").insert([syncItem.data])
        break

      case "updateProduct":
        const { id: productId, ...productData } = syncItem.data
        await supabase.from("products").update(productData).eq("id", productId)
        break

      case "deleteProduct":
        await supabase.from("products").delete().eq("id", syncItem.data.id)
        break

      case "createCategory":
        await supabase.from("categories").insert([syncItem.data])
        break

      case "updateCategory":
        const { id: categoryId, ...categoryData } = syncItem.data
        await supabase.from("categories").update(categoryData).eq("id", categoryId)
        break

      case "deleteCategory":
        await supabase.from("categories").delete().eq("id", syncItem.data.id)
        break

      case "createSale":
        await supabase.from("sales").insert([syncItem.data])
        break

      case "updateSale":
        const { id: saleId, ...saleData } = syncItem.data
        await supabase.from("sales").update(saleData).eq("id", saleId)
        break

      case "deleteSale":
        await supabase.from("sales").delete().eq("id", syncItem.data.id)
        break

      case "updateStock":
        await supabase.from("products").update({ stock: syncItem.data.stock }).eq("id", syncItem.data.id)
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${syncItem.action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error processing sync item:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
