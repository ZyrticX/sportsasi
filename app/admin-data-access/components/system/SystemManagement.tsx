"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ErrorLogsViewer from "./ErrorLogsViewer"
import SystemDayManager from "./SystemDayManager"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { Permission } from "@/lib/permissions"
import { AlertCircle } from "lucide-react"

export default function SystemManagement() {
  const [activeTab, setActiveTab] = useState("error-logs")

  return (
    <PermissionGuard
      permission={Permission.MANAGE_SYSTEM}
      fallback={
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>אין לך הרשאה לניהול מערכת</span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <h2 className="text-xl font-bold">ניהול מערכת</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="error-logs">לוג שגיאות</TabsTrigger>
            <TabsTrigger value="system-day">יום מערכת</TabsTrigger>
            <TabsTrigger value="action-logs">לוג פעולות</TabsTrigger>
            <TabsTrigger value="system-settings">הגדרות מערכת</TabsTrigger>
            <TabsTrigger value="database">מסד נתונים</TabsTrigger>
          </TabsList>

          <TabsContent value="error-logs">
            <ErrorLogsViewer />
          </TabsContent>

          <TabsContent value="system-day">
            <SystemDayManager />
          </TabsContent>

          <TabsContent value="action-logs">
            <div className="bg-gray-100 p-4 rounded text-center">
              <p>לוג פעולות - בפיתוח</p>
            </div>
          </TabsContent>

          <TabsContent value="system-settings">
            <div className="bg-gray-100 p-4 rounded text-center">
              <p>הגדרות מערכת - בפיתוח</p>
            </div>
          </TabsContent>

          <TabsContent value="database">
            <div className="bg-gray-100 p-4 rounded text-center">
              <p>ניהול מסד נתונים - בפיתוח</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PermissionGuard>
  )
}
