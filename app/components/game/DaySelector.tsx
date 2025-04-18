"use client"

import { Calendar, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/supabase"

interface DaySelectorProps {
  activeDay: string
  onDayChange: (day: string) => void
  currentWeek: number
  systemDay: string
  availableDays: Record<string, boolean>
  isAdmin: boolean
  onRefreshGames: () => void
}

export default function DaySelector({
  activeDay,
  onDayChange,
  currentWeek,
  systemDay: initialSystemDay,
  availableDays,
  isAdmin,
  onRefreshGames,
}: DaySelectorProps) {
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  const [systemDay, setSystemDay] = useState(initialSystemDay)
  const [isLoadingDay, setIsLoadingDay] = useState(false)

  // בדיקת היום הנוכחי במערכת בעת טעינת הקומפוננטה
  useEffect(() => {
    const fetchCurrentSystemDay = async () => {
      setIsLoadingDay(true)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          setSystemDay(initialSystemDay)
          setIsLoadingDay(false)
          return
        }

        // ניסיון לקבל את היום הנוכחי מהגדרות המערכת
        const { data, error } = await supabase.from("settings").select("currentday").eq("id", "global").single()

        if (!error && data && data.currentday) {
          setSystemDay(data.currentday)
        } else {
          setSystemDay(initialSystemDay)
        }
      } catch (err) {
        console.error("Error fetching current system day:", err)
        setSystemDay(initialSystemDay)
      } finally {
        setIsLoadingDay(false)
      }
    }

    fetchCurrentSystemDay()
  }, [initialSystemDay])

  // פונקציית עזר להמרת יום לתאריך
  const getDateForDay = (day: string) => {
    const today = new Date()
    const currentDayNumber = today.getDay() // 0 = יום ראשון,  => {
    const targetDayNumber = getDayNumber(day)

    // חישוב מספר הימים להוסיף כדי להגיע ליום המבוקש
    const daysToAdd = (targetDayNumber - currentDayNumber + 7) % 7

    // יצירת תאריך חדש
    const date = new Date(today)
    date.setDate(today.getDate() + daysToAdd)

    // החזרת התאריך בפורמט יום/חודש/שנה
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
  }

  // פונקציה להמרת שם יום למספר
  const getDayNumber = (day: string): number => {
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    return daysMap[day] || 0
  }

  // בדיקה אם היום הוא היום הנוכחי
  const isCurrentDay = (day: string): boolean => {
    return day === systemDay
  }

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">בחר יום</h3>
          <div className="text-sm font-medium bg-navy-600 text-white px-3 py-1 rounded-full flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            שבוע {currentWeek}
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {daysOfWeek.map((day) => {
            const isToday = isCurrentDay(day)
            const isSaturday = day === "saturday"
            const isAvailable = isAdmin || availableDays[day] || false

            return (
              <button
                key={day}
                className={`p-3 rounded-lg text-sm font-bold transition duration-300 flex flex-col items-center justify-center ${
                  activeDay === day
                    ? "bg-navy-600 text-white"
                    : isToday
                      ? "bg-green-600 text-white"
                      : isSaturday
                        ? "bg-yellow-100 text-yellow-800"
                        : !isAvailable
                          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onClick={() => {
                  if (isAvailable) {
                    onDayChange(day)
                    onRefreshGames()
                  }
                }}
                disabled={!isAvailable}
              >
                <span className="text-xs mb-1">{getDateForDay(day)}</span>
                <span>{getDayName(day)}</span>
                {isSaturday && <span className="text-xs mt-1 font-bold">X2</span>}
                {isToday && (
                  <span className="text-xs mt-1">
                    {isLoadingDay ? <RefreshCw className="w-3 h-3 animate-spin" /> : "• היום •"}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )

  // פונקציית עזר להמרת מזהה יום לשם בעברית
  function getDayName(day: string) {
    const days = {
      sunday: "יום א'",
      monday: "יום ב'",
      tuesday: "יום ג'",
      wednesday: "יום ד'",
      thursday: "יום ה'",
      friday: "יום ו'",
      saturday: "שבת",
    }
    return days[day as keyof typeof days]
  }
}
