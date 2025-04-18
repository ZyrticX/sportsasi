"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCurrentWeek, updateCurrentWeek } from "@/lib/weeks"
import { getSupabaseClient } from "@/lib/supabase"

export default function WeekSelector() {
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [selectedWeek, setSelectedWeek] = useState<string>("1")
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    const checkAdminStatus = async () => {
      // בדיקה אם המשתמש הוא מנהל באמצעות Supabase Auth
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession()
      const user = session?.user

      if (user) {
        const { data } = await getSupabaseClient().from("users").select("role").eq("id", user.id).single()

        setIsAdmin(data?.role === "admin")
      }
    }

    const fetchCurrentWeek = async () => {
      const week = await getCurrentWeek()
      setCurrentWeek(week)
      setSelectedWeek(week.toString())
      setIsLoading(false)
    }

    checkAdminStatus()
    fetchCurrentWeek()
  }, [])

  const handleWeekChange = (value: string) => {
    setSelectedWeek(value)
  }

  const handleUpdateWeek = async () => {
    setIsLoading(true)
    const success = await updateCurrentWeek(Number.parseInt(selectedWeek))
    if (success) {
      setCurrentWeek(Number.parseInt(selectedWeek))
    }
    setIsLoading(false)
  }

  // יצירת רשימת שבועות לבחירה (1-38 עבור עונת כדורגל)
  const weeks = Array.from({ length: 38 }, (_, i) => (i + 1).toString())

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>בחירת שבוע</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>שבוע נוכחי:</span>
            <span className="font-bold">{currentWeek}</span>
          </div>

          <div className="flex flex-col space-y-2">
            <label htmlFor="week-select">בחר שבוע:</label>
            <Select value={selectedWeek} onValueChange={handleWeekChange}>
              <SelectTrigger id="week-select">
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

          {isAdmin && (
            <Button
              onClick={handleUpdateWeek}
              disabled={isLoading || selectedWeek === currentWeek.toString()}
              className="w-full"
            >
              {isLoading ? "מעדכן..." : "עדכן שבוע נוכחי"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
