"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { isOnline } from "@/lib/supabase"
import { Wifi, WifiOff, LogOut, Menu, X, ShoppingCart, Settings, BarChart, AlertTriangle, Cog } from 'lucide-react'

export default function AppHeader() {
  const pathname = usePathname()
  const [online, setOnline] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

  const handleSignOut = async () => {
    await signOut()
    window.location.href = "/"
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "POS", href: "/pos", icon: ShoppingCart },
    { name: "Sales", href: "/sales", icon: BarChart },
    { name: "Products", href: "/products" },
    { name: "Categories", href: "/categories" },
    { name: "Alerts", href: "/alerts", icon: AlertTriangle },
    { name: "Users", href: "/users" },
    { name: "Settings", href: "/settings", icon: Settings },
    { name: "Setup", href: "/setup", icon: Cog }, // Added Setup link here
  ]

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Mini Market POS</span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    pathname === item.href
                      ? "border-blue-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  {item.icon && <item.icon className="h-4 w-4 mr-1" />}
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
            <div className="flex items-center">
              {online ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              <span className="ml-2 text-sm text-gray-500">{online ? "Online" : "Offline"}</span>
            </div>
            <Button variant="ghost" onClick={handleSignOut}>
              <LogOut className="h-5 w-5 mr-1" />
              Sign out
            </Button>
          </div>
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  pathname === item.href
                    ? "bg-blue-50 border-blue-500 text-blue-700"
                    : "border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center">
                  {item.icon && <item.icon className="h-4 w-4 mr-2" />}
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              {online ? <Wifi className="h-5 w-5 text-green-500" /> : <WifiOff className="h-5 w-5 text-red-500" />}
              <span className="ml-2 text-sm text-gray-500">{online ? "Online" : "Offline"}</span>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}