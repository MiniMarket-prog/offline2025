"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Bell, Home, Package, Settings, ShoppingCart, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { ClientIcon } from "@/components/ui/client-icon"

export default function AppHeader() {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Products", href: "/products", icon: Package },
    { name: "Categories", href: "/categories", icon: Package },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Sales", href: "/sales", icon: BarChart3 },
    { name: "Users", href: "/users", icon: Users },
    { name: "Alerts", href: "/alerts", icon: Bell },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <header className="bg-white shadow">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold">Mini Market</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex space-x-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    isActive ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <ClientIcon>
                    <Icon className="h-5 w-5 mr-1.5" aria-hidden="true" />
                  </ClientIcon>
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </header>
  )
}
