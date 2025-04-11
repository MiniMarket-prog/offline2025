"use client"

import type React from "react"
import {
  AlertCircle,
  BarChart4,
  Box,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Edit,
  FileText,
  Home,
  Info,
  Layers,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Trash,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"
import { forwardRef } from "react"

// Define the ClientIcon component
const ClientIcon = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
  <span {...props}>{children}</span>
)

// Helper function to create client-side rendered icons
function createClientIcon(Icon: LucideIcon) {
  return forwardRef<SVGSVGElement, React.ComponentPropsWithoutRef<LucideIcon>>((props, ref) => (
    <ClientIcon>
      <Icon ref={ref} {...props} />
    </ClientIcon>
  ))
}

// Export client-side rendered icons
export const Icons = {
  // Dashboard icons
  Dashboard: createClientIcon(LayoutDashboard),
  Chart: createClientIcon(BarChart4),

  // Navigation icons
  Home: createClientIcon(Home),
  ChevronLeft: createClientIcon(ChevronLeft),
  ChevronRight: createClientIcon(ChevronRight),
  ChevronDown: createClientIcon(ChevronDown),
  Menu: createClientIcon(Menu),

  // Product icons
  Product: createClientIcon(Package),
  Category: createClientIcon(Tag),
  Inventory: createClientIcon(Box),

  // User icons
  User: createClientIcon(User),
  Users: createClientIcon(Users),

  // Action icons
  Add: createClientIcon(Plus),
  Edit: createClientIcon(Edit),
  Delete: createClientIcon(Trash),
  Search: createClientIcon(Search),
  Close: createClientIcon(X),

  // POS icons
  Cart: createClientIcon(ShoppingCart),
  Checkout: createClientIcon(CreditCard),
  Sale: createClientIcon(ShoppingBag),
  Payment: createClientIcon(DollarSign),

  // Utility icons
  Settings: createClientIcon(Settings),
  Info: createClientIcon(Info),
  Warning: createClientIcon(AlertCircle),
  Success: createClientIcon(CheckCircle),
  Document: createClientIcon(FileText),
  Logout: createClientIcon(LogOut),

  // Custom icons
  Logo: forwardRef<SVGSVGElement, React.ComponentPropsWithoutRef<LucideIcon>>((props, ref) => (
    <ClientIcon>
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </ClientIcon>
  )),

  // Layers icon for multi-level data
  Layers: createClientIcon(Layers),
}

// Export the icon type for use in other components
export type Icon = keyof typeof Icons
