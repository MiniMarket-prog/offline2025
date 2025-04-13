"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Download, Upload, Calendar, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  createBackup,
  restoreBackup,
  clearAllData,
  scheduleAutoBackup,
  getAutoBackupSchedule,
  cancelAutoBackup,
} from "@/lib/setup-service"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function DatabaseManagement() {
  const [backupPath, setBackupPath] = useState("")
  const [restorePath, setRestorePath] = useState("")
  const [autoBackupPath, setAutoBackupPath] = useState("")
  const [autoBackupInterval, setAutoBackupInterval] = useState("7")
  const [backupSuccess, setBackupSuccess] = useState(false)
  const [restoreSuccess, setRestoreSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoBackupSchedule, setAutoBackupSchedule] = useState<any>(null)

  // Load auto backup schedule on component mount
  useState(() => {
    const schedule = getAutoBackupSchedule()
    if (schedule) {
      setAutoBackupSchedule(schedule)
      setAutoBackupPath(schedule.path)
      setAutoBackupInterval(schedule.intervalDays.toString())
    }
  })

  const handleBackup = async () => {
    setError(null)
    setBackupSuccess(false)
    setLoading(true)

    if (!backupPath) {
      setError("Please enter a backup file path")
      setLoading(false)
      return
    }

    const { success, error } = await createBackup(backupPath)

    if (success) {
      setBackupSuccess(true)
    } else {
      setError(`Failed to create backup: ${error}`)
    }

    setLoading(false)
  }

  const handleRestore = async () => {
    setConfirmRestoreOpen(false)
    setError(null)
    setRestoreSuccess(false)
    setLoading(true)

    if (!restorePath) {
      setError("Please enter a restore file path")
      setLoading(false)
      return
    }

    const { success, error } = await restoreBackup(restorePath)

    if (success) {
      setRestoreSuccess(true)
    } else {
      setError(`Failed to restore backup: ${error}`)
    }

    setLoading(false)
  }

  const handleClearData = async () => {
    setConfirmClearOpen(false)
    setError(null)
    setLoading(true)

    const { success, error } = await clearAllData()

    if (success) {
      setBackupSuccess(true) // Reuse the success alert
    } else {
      setError(`Failed to clear data: ${error}`)
    }

    setLoading(false)
  }

  const handleScheduleAutoBackup = async () => {
    setError(null)
    setLoading(true)

    if (!autoBackupPath) {
      setError("Please enter a backup file path")
      setLoading(false)
      return
    }

    const intervalDays = Number.parseInt(autoBackupInterval)
    if (isNaN(intervalDays) || intervalDays < 1) {
      setError("Please enter a valid interval (minimum 1 day)")
      setLoading(false)
      return
    }

    const { success, error } = scheduleAutoBackup(autoBackupPath, intervalDays)

    if (success) {
      const schedule = getAutoBackupSchedule()
      setAutoBackupSchedule(schedule)
      setBackupSuccess(true)
    } else {
      setError(`Failed to schedule auto backup: ${error}`)
    }

    setLoading(false)
  }

  const handleCancelAutoBackup = async () => {
    setError(null)
    setLoading(true)

    const { success, error } = cancelAutoBackup()

    if (success) {
      setAutoBackupSchedule(null)
      setBackupSuccess(true)
    } else {
      setError(`Failed to cancel auto backup: ${error}`)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Backup & Restore</CardTitle>
          <CardDescription>Create and restore database backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {backupSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Operation completed successfully!</AlertDescription>
            </Alert>
          )}

          {restoreSuccess && (
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-800" />
              <AlertDescription>Database restored successfully!</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="backupPath">Backup Path</Label>
            <div className="flex space-x-2">
              <Input
                id="backupPath"
                value={backupPath}
                onChange={(e) => setBackupPath(e.target.value)}
                placeholder="C:\path\to\backup.json"
                className="flex-1"
              />
              <Button onClick={handleBackup} disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </div>
            <p className="text-sm text-gray-500">Create a backup of your database that you can restore later.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restorePath">Restore Path</Label>
            <div className="flex space-x-2">
              <Input
                id="restorePath"
                value={restorePath}
                onChange={(e) => setRestorePath(e.target.value)}
                placeholder="C:\path\to\backup.json"
                className="flex-1"
              />
              <Button onClick={() => setConfirmRestoreOpen(true)} variant="outline" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                Restore
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Restore your database from a backup file. This will overwrite your current data.
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={() => setConfirmClearOpen(true)} variant="destructive" disabled={loading}>
              Clear All Data
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              Warning: This will permanently delete all your data. Make sure to create a backup first.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automatic Backups</CardTitle>
          <CardDescription>Schedule regular automatic backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {autoBackupSchedule ? (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-800">Auto Backup Scheduled</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Next backup: {new Date(autoBackupSchedule.nextBackup).toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-700">Path: {autoBackupSchedule.path}</p>
                  <p className="text-sm text-blue-700">Interval: Every {autoBackupSchedule.intervalDays} day(s)</p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleCancelAutoBackup} disabled={loading}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="autoBackupPath">Backup Path</Label>
                <Input
                  id="autoBackupPath"
                  value={autoBackupPath}
                  onChange={(e) => setAutoBackupPath(e.target.value)}
                  placeholder="C:\path\to\auto_backup.json"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="autoBackupInterval">Backup Interval (days)</Label>
                <Select value={autoBackupInterval} onValueChange={setAutoBackupInterval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Daily</SelectItem>
                    <SelectItem value="7">Weekly</SelectItem>
                    <SelectItem value="30">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleScheduleAutoBackup} disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Auto Backup
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Clear Data Dialog */}
      <Dialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear All Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all your data.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-600 font-medium">Are you absolutely sure you want to delete all your data?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmClearOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleClearData}>
              Yes, Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Restore Dialog */}
      <Dialog open={confirmRestoreOpen} onOpenChange={setConfirmRestoreOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Database</DialogTitle>
            <DialogDescription>This will overwrite your current data with the backup data.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-amber-600 font-medium">
              Are you sure you want to restore from backup? Current data will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRestoreOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRestore}>Yes, Restore Data</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
