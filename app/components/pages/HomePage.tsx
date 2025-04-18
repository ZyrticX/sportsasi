"use client"

import UserStats from "../user/UserStats"
import GameList from "../game/GameList"
import DaySelector from "../game/DaySelector"

interface HomePageProps {
  userName: string
  currentDateTime: string
  currentWeek: number
  isAdmin: boolean
  systemDay: string
  availableDays: Record<string, boolean>
  weeklyGames: Record<string, WeeklyGame[]>
  loadingGames: boolean
  onRefreshGames: () => void
  onPredictionChange: (gameId: string, prediction: string) => void
  onSubmitPrediction: (gameId: string) => void
}

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

export default function HomePage({
  userName,
  currentDateTime,
  currentWeek,
  isAdmin,
  systemDay,
  availableDays,
  weeklyGames,
  loadingGames,
  onRefreshGames,
  onPredictionChange,
  onSubmitPrediction,
}: HomePageProps) {
  const [activeDay, setActiveDay] = useState(systemDay)
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [submittedPredictions, setSubmittedPredictions] = useState<Record<string, boolean>>({})
  const [showPredictions, setShowPredictions] = useState<Record<string, boolean>>({})
  const [manuallyLockedGames, setManuallyLockedGames] = useState<Record<string, boolean>>({})

  // Handle day change
  const handleDayChange = (day: string) => {
    setActiveDay(day)
  }

  // Handle prediction change
  const handlePredictionChange = (gameId: string, prediction: string) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: prediction,
    }))
  }

  // Handle submit prediction
  const handleSubmitPrediction = (gameId: string) => {
    setSubmittedPredictions((prev) => ({
      ...prev,
      [gameId]: true,
    }))
  }

  // Handle toggle show predictions
  const handleToggleShowPredictions = (gameId: string) => {
    setShowPredictions((prev) => ({
      ...prev,
      [gameId]: !prev[gameId],
    }))
  }

  return (
    <div>
      <UserStats currentDateTime={currentDateTime} currentWeek={currentWeek} userName={userName} />

      <DaySelector
        activeDay={activeDay}
        onDayChange={handleDayChange}
        currentWeek={currentWeek}
        systemDay={systemDay}
        availableDays={availableDays}
        isAdmin={isAdmin}
        onRefreshGames={onRefreshGames}
      />

      <GameList
        activeDay={activeDay}
        weeklyGames={weeklyGames}
        predictions={predictions}
        submittedPredictions={submittedPredictions}
        showPredictions={showPredictions}
        manuallyLockedGames={manuallyLockedGames}
        loadingGames={loadingGames}
        onPredictionChange={handlePredictionChange}
        onSubmitPrediction={handleSubmitPrediction}
        onToggleShowPredictions={handleToggleShowPredictions}
      />
    </div>
  )
}

import { useState } from "react"
