import type React from "react"
import type { Metadata } from "next"
import { ErrorBoundary } from "@/components/error-boundary"
import RegisterServiceWorker from "./register-sw"
import "./globals.css"

export const metadata: Metadata = {
  title: "Mini Market POS",
  description: "Point of Sale system with offline capabilities",
  manifest: "/manifest.json",
  themeColor: "#3b82f6",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mini Market POS",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <ErrorBoundary>
          {children}
          <RegisterServiceWorker />
        </ErrorBoundary>
      </body>
    </html>
  )
}
