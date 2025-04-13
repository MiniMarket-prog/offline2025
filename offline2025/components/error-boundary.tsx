"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetKeys?: any[]
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error("Error caught by boundary:", error, errorInfo)
    this.setState({ errorInfo })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // If any of the resetKeys changed, reset the error boundary
    if (this.state.hasError && this.props.resetKeys && prevProps.resetKeys) {
      const hasChanged = this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])

      if (hasChanged) {
        this.reset()
      }
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-6 border border-red-200 bg-red-50 rounded-md shadow-sm">
          <div className="flex items-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 mr-2" />
            <h2 className="text-lg font-semibold text-red-700">Something went wrong</h2>
          </div>

          <div className="mb-4">
            <p className="text-red-600 mb-2">{this.state.error?.message || "An unexpected error occurred"}</p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">{this.state.error.stack}</pre>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={this.reset} className="flex items-center">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional component wrapper for easier usage with hooks
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps: Omit<ErrorBoundaryProps, "children">,
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Custom hook to throw errors (useful for testing error boundaries)
export function useErrorHandler(error: Error | null | undefined): void {
  if (error) {
    throw error
  }
}
