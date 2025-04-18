"use client"

import React from "react"

import { Calendar, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"

interface DaySelectorProps {
  activeDay: string
  onDayChange: (day: string) => void
  currentWeek: number
}

export default function DaySelector({ activeDay, onDayChange, currentWeek }: DaySelectorProps) {
  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

  // State for tracking the selected week offset (0 = current week, 1 = next week, etc.)
  const [weekOffset, setWeekOffset] = React.useState(0)
  const [currentSystemDay, setCurrentSystemDay] = React.useState<string>("sunday")
  const [isLoadingDay, setIsLoadingDay] = React.useState(true)

  // בדיקת היום הנוכחי במערכת בעת טעינת הקומפוננטה
  React.useEffect(() => {
    const fetchCurrentSystemDay = async () => {
      setIsLoadingDay(true)
      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          // אם אין חיבור לסופאבייס, השתמש בתאריך המערכת
          const today = new Date()
          const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.
          setCurrentSystemDay(daysOfWeek[dayIndex])
          setIsLoadingDay(false)
          return
        }

        // ניסיון לקבל את היום הנוכחי מהגדרות המערכת
        const { data, error } = await supabase.from("settings").select("currentday").eq("id", "global").single()

        if (!error && data && data.currentday) {
          setCurrentSystemDay(data.currentday)
        } else {
          // אם אין נתונים בבסיס הנתונים, השתמש בתאריך המערכת
          const today = new Date()
          const dayIndex = today.getDay() // 0 = Sunday, 1 = Monday, etc.
          setCurrentSystemDay(daysOfWeek[dayIndex])
        }
      } catch (err) {
        console.error("Error fetching current system day:", err)
        // במקרה של שגיאה, השתמש בתאריך המערכת
        const today = new Date()
        const dayIndex = today.getDay()
        setCurrentSystemDay(daysOfWeek[dayIndex])
      } finally {
        setIsLoadingDay(false)
      }
    }

    fetchCurrentSystemDay()
  }, [])

  // Helper function to get the last Sunday (start of the week) with week offset
  const getLastSunday = (offset = 0) => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - dayOfWeek + offset * 7
    return new Date(today.setDate(diff))
  }

  // Helper function to convert day to date based on the last Sunday with week offset
  const getDateForDay = (day: string) => {
    const lastSunday = getLastSunday(weekOffset)
    const targetDayNumber = getDayNumber(day)

    // Create new date by adding days to last Sunday
    const date = new Date(lastSunday)
    date.setDate(lastSunday.getDate() + targetDayNumber)

    // Return date in DD/MM/YYYY format
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  // Function to convert day name to number
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

  // Helper function to get day name in Hebrew
  const getDayName = (day: string) => {
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

  // Helper function to get day bonus
  const getDayBonus = (day: string) => {
    if (day === "saturday") return "X2"
    return null
  }

  // Function to navigate to previous week
  const goToPreviousWeek = () => {
    if (weekOffset > 0) {
      setWeekOffset(weekOffset - 1)
    }
  }

  // Function to navigate to next week
  const goToNextWeek = () => {
    setWeekOffset(weekOffset + 1)
  }

  // Function to get the week display text
  const getWeekDisplayText = () => {
    if (weekOffset === 0) {
      return `שבוע ${currentWeek} (נוכחי)`
    } else {
      return `שבוע ${currentWeek + weekOffset} (${weekOffset} שבועות קדימה)`
    }
  }

  // Function to get the date range for the current week offset
  const getWeekDateRange = () => {
    const startDate = getLastSunday(weekOffset)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)

    // Format dates as DD/MM
    const formatDate = (date: Date) => {
      return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`
  }

  // פונקציה לבדיקה אם היום הוא היום הנוכחי
  const isCurrentDay = (day: string): boolean => {
    return day === currentSystemDay && weekOffset === 0
  }

  return (
    <div className="mb-8">
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">בחר יום</h3>

          <div className="flex items-center">
            <button
              onClick={goToPreviousWeek}
              disabled={weekOffset === 0}
              className={`p-1 rounded-full ${weekOffset === 0 ? "text-gray-400" : "text-navy-600 hover:bg-gray-100"}`}
              aria-label="שבוע קודם"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="text-sm font-medium bg-navy-600 text-white px-3 py-1 rounded-full flex items-center mx-2">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{getWeekDisplayText()}</span>
            </div>

            <button
              onClick={goToNextWeek}
              className="p-1 rounded-full text-navy-600 hover:bg-gray-100"
              aria-label="שבוע הבא"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="text-xs text-center text-gray-500 mb-3">{getWeekDateRange()}</div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {daysOfWeek.map((day) => {
            const bonus = getDayBonus(day)
            const isToday = isCurrentDay(day)
            const isPastDay = getDayNumber(day) < getDayNumber(currentSystemDay) && weekOffset === 0

            return (
              <button
                key={day}
                className={`p-3 rounded-lg text-sm font-bold transition duration-300 flex flex-col items-center justify-center ${
                  activeDay === day && weekOffset === 0
                    ? "bg-navy-600 text-white"
                    : isToday
                      ? "bg-green-600 text-white"
                      : isPastDay
                        ? "bg-gray-200 text-gray-600"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
                onClick={() => onDayChange(day)}
              >
                <span className="text-xs mb-1">{getDateForDay(day)}</span>
                <span>{getDayName(day)}</span>
                {bonus && <span className="text-xs mt-1 text-yellow-400 font-bold">{bonus}</span>}
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
}
