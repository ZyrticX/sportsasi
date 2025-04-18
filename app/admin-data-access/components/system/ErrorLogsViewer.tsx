"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { Permission } from "@/lib/permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertCircle, Info, AlertTriangle } from "lucide-react"
import { ErrorSeverity } from "@/lib/error-handling"

interface ErrorLog {
  id: string
  code: string
  message: string
  severity: ErrorSeverity
  context: any
  created_at: string
}

export default function ErrorLogsViewer() {
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error: fetchError } = await supabase
        .from("error_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (fetchError) {
        throw new Error(`Error fetching error logs: ${fetchError.message}`)
      }

      setLogs(data || [])
    } catch (err) {
      console.error("Error fetching error logs:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה בטעינת לוגים")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  // פונקציה להצגת אייקון לפי חומרת השגיאה
  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return <Info className="w-5 h-5 text-blue-500" />
      case ErrorSeverity.WARNING:
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case ErrorSeverity.ERROR:
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case ErrorSeverity.CRITICAL:
        return <AlertCircle className="w-5 h-5 text-red-700" />
      default:
        return <Info className="w-5 h-5 text-gray-500" />
    }
  }

  // פונקציה להצגת צבע רקע לפי חומרת השגיאה
  const getSeverityClass = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.INFO:
        return "bg-blue-50 border-blue-200"
      case ErrorSeverity.WARNING:
        return "bg-yellow-50 border-yellow-200"
      case ErrorSeverity.ERROR:
        return "bg-red-50 border-red-200"
      case ErrorSeverity.CRITICAL:
        return "bg-red-100 border-red-300"
      default:
        return "bg-gray-50 border-gray-200"
    }
  }

  return (
    <PermissionGuard
      permission={Permission.MANAGE_SYSTEM}
      fallback={
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>אין לך הרשאה לצפות בלוגים של שגיאות מערכת</span>
          </div>
        </div>
      }
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>לוג שגיאות מערכת</CardTitle>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span className="mr-2">רענן</span>
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-gray-100 p-4 rounded text-center">
              <p>אין שגיאות מערכת מתועדות</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className={`p-4 rounded-lg border ${getSeverityClass(log.severity)} overflow-hidden`}>
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">{getSeverityIcon(log.severity)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-gray-800">{log.code}</h4>
                        <span className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-gray-700 mt-1">{log.message}</p>
                      {log.context && (
                        <details className="mt-2">
                          <summary className="text-sm text-gray-600 cursor-pointer">פרטים נוספים</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.context, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
