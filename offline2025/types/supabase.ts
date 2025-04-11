export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          price: number
          barcode: string
          stock: number
          min_stock: number
          image: string | null
          description: string | null
          category_id: string | null
          created_at: string | null
          purchase_price: number | null
          expiry_date: string | null
          is_pack: boolean
          pack_quantity: number | null
          pack_discount_percentage: number | null
          expiry_notification_days: number | null
          parent_product_id: string | null
        }
        Insert: {
          id?: string
          name: string
          price: number
          barcode: string
          stock: number
          min_stock: number
          image?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string | null
          purchase_price?: number | null
          expiry_date?: string | null
          is_pack: boolean
          pack_quantity?: number | null
          pack_discount_percentage?: number | null
          expiry_notification_days?: number | null
          parent_product_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          price?: number
          barcode?: string
          stock?: number
          min_stock?: number
          image?: string | null
          description?: string | null
          category_id?: string | null
          created_at?: string | null
          purchase_price?: number | null
          expiry_date?: string | null
          is_pack?: boolean
          pack_quantity?: number | null
          pack_discount_percentage?: number | null
          expiry_notification_days?: number | null
          parent_product_id?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          active: boolean
          store_id: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          full_name: string
          role: string
          active?: boolean
          store_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string
          role?: string
          active?: boolean
          store_id?: string | null
          created_at?: string | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      public_profiles: {
        Row: {
          id: string
          full_name: string
          role: string
          active: boolean
          store_id: string | null
          created_at: string | null
        }
      }
      // Add other views as needed
    }
    Functions: {
      // Add functions if needed
    }
    Enums: {
      // Add enums if needed
    }
  }
}
