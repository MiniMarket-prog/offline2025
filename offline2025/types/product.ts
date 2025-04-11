export interface Product {
    id: string
    name: string
    price: number
    barcode: string
    stock: number
    min_stock: number
    image: string | null
    category_id: string | null
    created_at: string | null
    purchase_price: number | null
    expiry_date: string | null
    is_pack: boolean
    pack_quantity: number | null
    pack_discount_percentage: number | null
    description: string | null
    expiry_notification_days: number | null
    parent_product_id: string | null
  }
  