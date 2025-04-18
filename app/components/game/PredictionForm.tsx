"use client"

import { useState } from "react"
import { Clock, Eye, Lock } from "lucide-react"
import GameCountdown from "./GameCountdown"
import { validatePrediction, validatePredictionBusinessRules } from "@/lib/validation-schemas"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

interface PredictionFormProps {
  game: WeeklyGame
  prediction: string
  isSubmitted: boolean
  isLocked: boolean
  isManuallyLocked: boolean
  onPredictionChange: (gameId: string, prediction: string) => void
  onSubmitPrediction: (gameId: string) => void
  onToggleShowPredictions: (gameId: string) => void
  showPredictions: boolean
}

export default function PredictionForm({
  game,
  prediction,
  isSubmitted,
  isLocked,
  isManuallyLocked,
  onPredictionChange,
  onSubmitPrediction,
  onToggleShowPredictions,
  showPredictions,
}: PredictionFormProps) {
  const [error, setError] = useState<string | null>(null)

  // פונקציה לטיפול בהגשת ניחוש עם תיקוף
  const handleSubmitPrediction = () => {
    setError(null)

    // בדיקה שיש ניחוש
    if (!prediction) {
      setError("יש לבחור ניחוש לפני ההגשה")
      return
    }

    // תיקוף הניחוש עם Zod
    const validationResult = validatePrediction({
      userid: "current-user", // יוחלף בהמשך עם המזהה האמיתי
      gameid: game.id,
      prediction,
    })

    if (!validationResult.success) {
      const errorMessage = Object.values(validationResult.errors || {})[0] || "ניחוש לא תקין"
      setError(errorMessage)
      return
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validatePredictionBusinessRules({ gameid: game.id, prediction }, game)

    if (!businessRulesResult.success) {
      const errorMessage = Object.values(businessRulesResult.errors || {})[0] || "לא ניתן להגיש ניחוש למשחק זה"
      setError(errorMessage)
      return
    }

    // אם הכל תקין, נגיש את הניחוש
    onSubmitPrediction(game.id)
  }

  // Mock data for other players' predictions
  const mockOtherPredictions: Array<{ playerName: string; prediction: string; submissionTime: string }> = []

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 transition duration-300 ${
        isLocked ? "opacity-70" : ""
      } ${game.day === "saturday" ? "border-l-4 border-l-yellow-500" : ""}`}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm font-medium text-gray-600">{game.league}</span>
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-600">{game.time}</span>
          {game.day === "saturday" && (
            <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded">שבת X2</span>
          )}
        </div>
      </div>
      <div className="w-full text-center mt-2">
        {!isLocked && (
          <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            <Clock className="inline-block w-4 h-4 mr-1" />
            <span>נסגר להימורים: </span>
            <GameCountdown closingTime={game.closingtime} />
          </div>
        )}
      </div>
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold text-gray-800">{game.hometeam}</div>
        <div className="text-xl font-bold text-gray-400">vs</div>
        <div className="text-lg font-bold text-gray-800">{game.awayteam}</div>
      </div>

      {error && (
        <Alert className="mb-4 bg-red-50 border-red-200 text-red-700">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col items-center justify-center w-full mb-4">
        {isLocked ? (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
            <Lock className="w-5 h-5 mr-2" />
            <span className="font-bold">
              {game.isfinished
                ? "המשחק נגמר: " + (game.result || "אין תוצאה")
                : new Date() > new Date(game.closingtime)
                  ? "זמן ההימור הסתיים"
                  : isManuallyLocked
                    ? "המשחק נעול על ידי מנהל"
                    : isSubmitted
                      ? "הניחוש נשלח בהצלחה"
                      : "ההימורים נעולים"}
            </span>
          </div>
        ) : (
          <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md flex items-center w-full justify-center">
            <span className="font-bold">ניתן להמר על משחק זה</span>
          </div>
        )}
      </div>
      <div className="flex justify-center space-x-4 mb-4">
        {["1", "X", "2"].map((option) => (
          <button
            key={option}
            className={`px-6 py-2 rounded-full text-lg font-bold transition duration-300 ${
              prediction === option ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => onPredictionChange(game.id, option)}
            disabled={isLocked}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="flex justify-between items-center mb-2">
        <button
          className="bg-blue-500 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md hover:bg-blue-600 transition duration-300 flex items-center justify-center"
          onClick={() => onToggleShowPredictions(game.id)}
        >
          <Eye className="w-3 h-3 mr-1" />
          {showPredictions ? "הסתר ניחושים" : "הצג ניחושים"}
        </button>
        <button
          className={`bg-olive-600 text-white py-1.5 px-3 rounded-lg font-medium text-sm shadow-md ${
            isLocked || !prediction ? "opacity-50 cursor-not-allowed" : "hover:bg-olive-700"
          }`}
          onClick={handleSubmitPrediction}
          disabled={isLocked || !prediction}
        >
          {isSubmitted ? "נשלח" : "שלח ניחוש"}
        </button>
      </div>
      {showPredictions && (
        <div className="mt-3 bg-gray-100 p-3 rounded-lg">
          <h4 className="font-bold mb-2 text-sm">ניחושי שחקנים אחרים:</h4>
          <ul className="text-xs">
            {mockOtherPredictions?.map((pred, index) => (
              <li key={index} className="flex justify-between items-center py-1">
                <span>{pred.playerName}</span>
                <span className="font-bold">{pred.prediction}</span>
                <span className="text-gray-500">{pred.submissionTime}</span>
              </li>
            )) || <li className="text-center py-2 text-gray-500">אין ניחושים עדיין</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
