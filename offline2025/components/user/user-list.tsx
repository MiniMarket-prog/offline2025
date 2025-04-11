"use client"

import { useState, useEffect } from "react"
import { supabase, isOnline } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, UserX, UserCheck } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Database } from "@/types/supabase"

type Profile = Database["public"]["Tables"]["profiles"]["Row"]

export default function UserList() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const online = isOnline()

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)

    try {
      if (online) {
        // Query from public_profiles view instead of profiles table
        const { data, error } = await supabase
          .from("public_profiles") // Changed from "profiles" to "public_profiles"
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setUsers(data || [])
      } else {
        // In a real app, you would get users from local storage
        setError("Cannot fetch users while offline")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      if (online) {
        // Still use profiles table for writes
        const { error } = await supabase.from("profiles").update({ active: !currentStatus }).eq("id", userId)

        if (error) throw error

        // Update local state
        setUsers(users.map((user) => (user.id === userId ? { ...user, active: !currentStatus } : user)))
      } else {
        setError("Cannot update user status while offline")
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Users</CardTitle>
          <CardDescription>Manage system users</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading || !online}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!online && (
          <Alert className="mb-4 bg-yellow-50 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-800" />
            <AlertDescription>You are currently offline. User list may not be up to date.</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex justify-center p-4">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : user.role === "manager" ? "secondary" : "outline"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? "success" : "destructive"}>
                        {user.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.active)}
                        disabled={!online}
                      >
                        {user.active ? <UserX className="h-4 w-4 mr-1" /> : <UserCheck className="h-4 w-4 mr-1" />}
                        {user.active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
