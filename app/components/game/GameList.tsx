"use client"

import { AlertCircle } from "lucide-react"
import PredictionForm from "./PredictionForm"

interface WeeklyGame {
  id: string
  hometeam: string
  awayteam: string
  time: string
  league: string
  closingtime: string | Date
  result?: string
  isfinished?: boolean
  manuallylocked?: boolean
  day?: string
}

interface GameListProps {
  activeDay: string
  weeklyGames: Record<string, WeeklyGame[]>
  predictions: Record<string, string>
  submittedPredictions: Record<string, boolean>
  showPredictions: Record<string, boolean>
  manuallyLockedGames: Record<string, boolean>
  loadingGames: boolean
  onPredictionChange: (gameId: string, prediction: string) => void
  onSubmitPrediction: (gameId: string) => void
  onToggleShowPredictions: (gameId: string) => void
}

export default function GameList({
  activeDay,
  weeklyGames,
  predictions,
  submittedPredictions,
  showPredictions,
  manuallyLockedGames,
  loadingGames,
  onPredictionChange,
  onSubmitPrediction,
  onToggleShowPredictions,
}: GameListProps) {
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

  // Helper function to get date for day
  const getDateForDay = (day: string) => {
    const today = new Date()
    const currentDayNumber = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const targetDayNumber = dayToNumber(day)

    // Calculate days to add to reach the target day
    const daysToAdd = (targetDayNumber - currentDayNumber + 7) % 7

    // Create new date
    const date = new Date(today)
    date.setDate(today.getDate() + daysToAdd)

    // Return date in DD/MM/YYYY format
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  // Function to convert day name to number
  const dayToNumber = (day: string): number => {
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

  // Helper function to get day bonus
  const getDayBonus = (day: string) => {
    if (day === "saturday") return "X2"
    return null
  }

  if (loadingGames) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-navy-600 border-r-transparent"></div>
        <p className="mt-2 text-gray-600">טוען משחקים...</p>
      </div>
    )
  }

  if (!weeklyGames[activeDay]?.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-600">אין משחקים זמינים</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 bg-white p-4 rounded-lg shadow-md">
        {activeDay === "friday"
          ? `משחקי סוף שבוע: ${getDateForDay("friday")}-${getDateForDay("saturday")}`
          : `משחקי ${getDayName(activeDay)}: ${getDateForDay(activeDay)}`}
        {getDayBonus(activeDay) && <span className="ml-2 text-yellow-500 text-xl">({getDayBonus(activeDay)})</span>}
      </h2>

      {activeDay === "friday" && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">הודעות חשובות לסוף שבוע:</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong>יום שישי:</strong> יש לבצע את הניחושים עד השעה 18:00
                  </li>
                  <li>
                    <strong>חובה:</strong> לבצע את הניחושים גם ליום שישי וגם ליום שבת
                  </li>
                  <li>
                    <strong>יום שבת:</strong> מקבלים כפול ניקוד על ניחוש נכון!
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 mb-8">
        {weeklyGames[activeDay].map((game) => {
          // Check if game is manually locked
          const isManuallyLocked = manuallyLockedGames[game.id] || game.manuallylocked || false

          // Check if game is locked
          const isLocked = new Date() > new Date(game.closingtime) || submittedPredictions[game.id] || isManuallyLocked

          return (
            <PredictionForm
              key={game.id}
              game={game}
              prediction={predictions[game.id] || ""}
              isSubmitted={!!submittedPredictions[game.id]}
              isLocked={isLocked}
              isManuallyLocked={isManuallyLocked}
              onPredictionChange={onPredictionChange}
              onSubmitPrediction={onSubmitPrediction}
              onToggleShowPredictions={onToggleShowPredictions}
              showPredictions={!!showPredictions[game.id]}
            />
          )
        })}
      </div>
    </div>
  )
}
