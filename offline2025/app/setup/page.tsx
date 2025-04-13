"use client"

import { useState } from "react"
import AppLayout from "@/components/layout/app-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DatabaseManagement from "@/components/setup/database-management"
import SystemOperations from "@/components/setup/system-operations"
import MaintenanceTools from "@/components/setup/maintenance-tools"
import ImageDownloader from "@/components/product/image-downloader"

export default function SetupPage() {
  const [activeTab, setActiveTab] = useState("database")

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">System Setup</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="database">Database Management</TabsTrigger>
            <TabsTrigger value="system">System Operations</TabsTrigger>
            <TabsTrigger value="maintenance">Maintenance Tools</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="database" className="space-y-4">
            <DatabaseManagement />
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <SystemOperations />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-4">
            <MaintenanceTools />
          </TabsContent>

          <TabsContent value="images" className="space-y-4">
            <ImageDownloader />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
