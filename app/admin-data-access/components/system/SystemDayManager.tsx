"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle, RefreshCw, Calendar } from "lucide-react"
import { getCurrentSystemDayAction, updateCurrentSystemDayAction } from "@/app/actions/system-actions"
import { PermissionGuard } from "@/components/ui/permission-guard"
import { Permission } from "@/lib/permissions"

export default function SystemDayManager() {
  const [currentDay, setCurrentDay] = useState<string>("sunday")
  const [selectedDay, setSelectedDay] = useState<string>("sunday")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // טעינת היום הנוכחי בעת טעינת הקומפוננטה
  useEffect(() => {
    const fetchCurrentDay = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getCurrentSystemDayAction()
        if (result.success) {
          setCurrentDay(result.currentDay)
          setSelectedDay(result.currentDay)
        } else {
          setError(result.message)
        }
      } catch (err) {
        console.error("Error fetching current day:", err)
        setError(err instanceof Error ? err.message : "שגיאה בטעינת היום הנוכחי")
      } finally {
        setLoading(false)
      }
    }

    fetchCurrentDay()
  }, [])

  // עדכון היום הנוכחי
  const updateCurrentDay = async () => {
    if (selectedDay === currentDay) {
      setError("היום הנוכחי כבר מוגדר ליום זה")
      return
    }

    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await updateCurrentSystemDayAction(selectedDay)
      if (result.success) {
        setCurrentDay(selectedDay)
        setSuccess(`היום הנוכחי עודכן בהצלחה ל${getDayName(selectedDay)}`)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Error updating current day:", err)
      setError(err instanceof Error ? err.message : "שגיאה בעדכון היום הנוכחי")
    } finally {
      setUpdating(false)
    }
  }

  // עדכון אוטומטי של היום הנוכחי לפי תאריך המערכת
  const updateToSystemDate = async () => {
    setUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      // קבלת היום הנוכחי לפי תאריך המערכת
      const today = new Date()
      const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
      const systemDay = daysOfWeek[dayIndex]

      if (systemDay === currentDay) {
        setError("היום הנוכחי כבר מוגדר ליום הנכון")
        setUpdating(false)
        return
      }

      const result = await updateCurrentSystemDayAction(systemDay)
      if (result.success) {
        setCurrentDay(systemDay)
        setSelectedDay(systemDay)
        setSuccess(`היום הנוכחי עודכן אוטומטית ל${getDayName(systemDay)}`)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Error updating to system date:", err)
      setError(err instanceof Error ? err.message : "שגיאה בעדכון אוטומטי של היום הנוכחי")
    } finally {
      setUpdating(false)
    }
  }

  // פונקציית עזר להמרת מזהה יום לשם בעברית
  const getDayName = (day: string): string => {
    const days: Record<string, string> = {
      sunday: "יום א'",
      monday: "יום ב'",
      tuesday: "יום ג'",
      wednesday: "יום ד'",
      thursday: "יום ה'",
      friday: "יום ו'",
      saturday: "שבת",
    }
    return days[day] || day
  }

  return (
    <PermissionGuard
      permission={Permission.MANAGE_SYSTEM}
      fallback={
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>אין לך הרשאה לניהול הגדרות מערכת</span>
          </div>
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>ניהול יום מערכת</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>{success}</span>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-navy-600" />
                <span className="font-medium">היום הנוכחי במערכת:</span>
              </div>
              <span className="font-bold text-lg">
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : getDayName(currentDay)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="day-select" className="block text-sm font-medium text-gray-700 mb-1">
                  בחר יום חדש:
                </label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger id="day-select">
                    <SelectValue placeholder="בחר יום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sunday">יום א'</SelectItem>
                    <SelectItem value="monday">יום ב'</SelectItem>
                    <SelectItem value="tuesday">יום ג'</SelectItem>
                    <SelectItem value="wednesday">יום ד'</SelectItem>
                    <SelectItem value="thursday">יום ה'</SelectItem>
                    <SelectItem value="friday">יום ו'</SelectItem>
                    <SelectItem value="saturday">שבת</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end space-x-2 rtl:space-x-reverse">
                <Button onClick={updateCurrentDay} disabled={updating || selectedDay === currentDay} className="flex-1">
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  עדכן יום
                </Button>
                <Button onClick={updateToSystemDate} disabled={updating} variant="outline" className="flex-1">
                  {updating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  עדכן אוטומטית
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-bold text-blue-800 mb-2">מידע חשוב</h3>
              <p className="text-blue-700 text-sm">
                היום הנוכחי במערכת משפיע על הצגת המשחקים בדף הבית ועל סימון היום הנוכחי בבורר הימים. מומלץ לעדכן את היום
                הנוכחי בתחילת כל יום או להשתמש בעדכון האוטומטי.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGuard>
  )
}
