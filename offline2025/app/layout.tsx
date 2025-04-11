import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Providers } from "@/components/providers"

export const metadata: Metadata = {
  title: "Mini Market POS",
  description: "Point of Sale and Inventory Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
