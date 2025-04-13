"use client"

import type React from "react"

import { useState } from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { Button } from "@/components/ui/button"

// A component that will throw an error when the button is clicked
function BuggyCounter() {
  const [counter, setCounter] = useState(0)

  const handleClick = () => {
    setCounter((prevCounter) => {
      // When counter reaches 5, we'll throw an error
      if (prevCounter === 4) {
        throw new Error("Counter reached 5! This is a simulated error.")
      }
      return prevCounter + 1
    })
  }

  return (
    <div className="p-4 border rounded-md">
      <p className="mb-4">Counter: {counter}</p>
      <Button onClick={handleClick}>Increment Counter {counter === 4 ? "(will error)" : ""}</Button>
    </div>
  )
}

// Example usage of the ErrorBoundary
export default function ErrorBoundaryExample() {
  const [key, setKey] = useState(0)

  const handleReset = () => {
    // Changing the key will remount the ErrorBoundary and its children
    setKey((prevKey) => prevKey + 1)
  }

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // You could send this to an error reporting service
    console.log("Logged error:", error)
    console.log("Component stack:", errorInfo.componentStack)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Error Boundary Example</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-4">With Error Boundary</h3>
          <ErrorBoundary key={key} onError={handleError} resetKeys={[key]}>
            <BuggyCounter />
          </ErrorBoundary>
          <div className="mt-4">
            <Button variant="outline" onClick={handleReset}>
              Reset Entire Component
            </Button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-4">Without Error Boundary</h3>
          <p className="text-sm text-gray-500 mb-4">Clicking this counter to 5 will crash the entire app</p>
          <BuggyCounter />
        </div>
      </div>
    </div>
  )
}
