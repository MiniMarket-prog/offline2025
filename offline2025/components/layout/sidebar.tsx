"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FileText,
  BarChart2,
  AlertCircle,
  Users,
  Settings,
  LogOut,
  Store,
} from "lucide-react"
import { useState, useEffect } from "react"

export default function AppSidebar() {
  const pathname = usePathname()
  const [online, setOnline] = useState(false)

  useEffect(() => {
    // Update online status after component mounts on client
    const updateOnlineStatus = () => {
      setOnline(navigator.onLine)
    }

    // Set initial status
    updateOnlineStatus()

    // Set up event listeners to update status when it changes
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOffline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/dashboard") return true
    return pathname?.startsWith(path)
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center">
          <Store className="h-6 w-6 text-primary mr-2" />
          <span className="font-bold text-xl">Mini Market</span>
        </div>
        <div className="flex items-center mt-2">
          <span className={`w-2 h-2 rounded-full mr-2 ${online ? "bg-green-500" : "bg-red-500"}`}></span>
          <span className="text-xs text-muted-foreground">{online ? "Online" : "Offline"}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/pos")}>
                  <Link href="/pos">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span>Point of Sale</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/products")}>
                  <Link href="/products">
                    <Package className="h-4 w-4 mr-2" />
                    <span>Products</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/categories")}>
                  <Link href="/categories">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>Categories</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/sales")}>
                  <Link href="/sales">
                    <BarChart2 className="h-4 w-4 mr-2" />
                    <span>Sales</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/alerts")}>
                  <Link href="/alerts">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>Alerts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/users")}>
                  <Link href="/users">
                    <Users className="h-4 w-4 mr-2" />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/settings")}>
                  <Link href="/settings">
                    <Settings className="h-4 w-4 mr-2" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src="/placeholder.svg" alt="Admin" />
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Admin</span>
              <span className="text-xs text-muted-foreground">admin@example.com</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              try {
                const { signOut } = await import("@/lib/auth")
                await signOut()
                window.location.href = "/" // Redirect to login page
              } catch (error) {
                console.error("Error signing out:", error)
              }
            }}
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
