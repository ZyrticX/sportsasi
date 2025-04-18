"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentWeek } from "@/lib/weeks"

type UserStats = {
  name: string
  totalPoints: number
  correctPredictions: number
  totalPredictions: number
}

export default function WeeklyStats() {
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [selectedWeek, setSelectedWeek] = useState<string>("1")
  const [stats, setStats] = useState<UserStats[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchCurrentWeek = async () => {
      const week = await getCurrentWeek()
      setCurrentWeek(week)
      setSelectedWeek(week.toString())
    }

    fetchCurrentWeek()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      if (selectedWeek) {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/weekly-stats?week=${selectedWeek}`)
          const { data } = await response.json()
          setStats(data || [])
        } catch (error) {
          console.error("Error fetching stats:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchStats()
  }, [selectedWeek])

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value)
  }

  // יצירת רשימת שבועות לבחירה (1-38 עבור עונת כדורגל)
  const weeks = Array.from({ length: 38 }, (_, i) => (i + 1).toString())

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>סטטיסטיקות שבועיות</CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={selectedWeek} onValueChange={handleWeekChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="בחר שבוע" />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((week) => (
                <SelectItem key={week} value={week}>
                  שבוע {week}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">טוען סטטיסטיקות...</div>
        ) : stats.length === 0 ? (
          <div className="text-center py-4">אין נתונים לשבוע זה</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-2">שם</th>
                  <th className="text-center py-2">נקודות</th>
                  <th className="text-center py-2">ניחושים נכונים</th>
                  <th className="text-center py-2">סה"כ ניחושים</th>
                  <th className="text-center py-2">אחוז הצלחה</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((user, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{user.name}</td>
                    <td className="text-center py-2">{user.totalPoints}</td>
                    <td className="text-center py-2">{user.correctPredictions}</td>
                    <td className="text-center py-2">{user.totalPredictions}</td>
                    <td className="text-center py-2">
                      {user.totalPredictions > 0
                        ? `${Math.round((user.correctPredictions / user.totalPredictions) * 100)}%`
                        : "0%"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
