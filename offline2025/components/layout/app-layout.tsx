import type React from "react"
import AppHeader from "./app-header"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
