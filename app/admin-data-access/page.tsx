"use client"

import { useState, useEffect, useCallback } from "react"
import { getSupabaseClient } from "../lib/supabase"
import DashboardPanel from "./components/DashboardPanel"
import PlayersList from "./components/players/PlayersList"
import PlayerForm from "./components/players/PlayerForm"
import WeeklyGamesEditor from "./components/weekly-games/WeeklyGamesEditor"
import GameResultsEditor from "./components/game-results/GameResultsEditor"
import PredictionsTracker from "./components/predictions/PredictionsTracker"
import LeaderboardTable from "./components/leaderboard/LeaderboardTable"
import SystemManagement from "./components/system/SystemManagement"
import type { User, Game, Prediction } from "./types"
import AdminDataPanel from "./components/AdminDataPanel"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { ErrorDisplay } from "@/components/ui/error-display"

export default function AdminDataAccessPage() {
  const [adminUser, setAdminUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "players" | "weekly-games" | "game-results" | "predictions" | "leaderboard" | "system"
  >("dashboard")
  const [error, setError] = useState<any>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  // פונקציה לרענון הנתונים - מוגדרת עם useCallback כדי למנוע יצירה מחדש בכל רינדור
  const refreshData = useCallback(async () => {
    console.log("Refreshing data...")
    setLoading(true)
    setError(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // חיפוש המשתמש הראשי
      const { data: adminData, error: adminError } = await supabase
        .from("users")
        .select("*")
        .eq("playercode", "323317966")
        .limit(1)

      if (adminError) {
        console.error("Error finding admin user:", adminError)
      } else if (adminData && adminData.length > 0) {
        setAdminUser(adminData[0])
        console.log("Found admin user:", adminData[0])
      } else {
        console.log("Admin user not found in database")
        setAdminUser(null)
      }

      // שימוש בפונקציית ה-RPC המעודכנת לקבלת כל המשתמשים
      const { data: usersData, error: usersError } = await supabase.rpc("get_all_users_for_admin")

      if (usersError) {
        console.error("Error using RPC function:", usersError)

        // נסיון לקבל משתמשים ישירות מהטבלה
        const { data: fallbackData, error: fallbackError } = await supabase.from("users").select("*").order("name")

        if (fallbackError) {
          throw new Error(`Error fetching users: ${fallbackError.message}`)
        }

        setUsers(fallbackData || [])
      } else {
        console.log("Fetched users:", usersData?.length || 0)
        setUsers(usersData || [])
      }

      // קבלת כל הניחושים
      const { data: predictionsData, error: predictionsError } = await supabase
        .from("predictions")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100)

      if (predictionsError) {
        console.error("Error fetching predictions:", predictionsError)
      } else {
        setPredictions(predictionsData || [])
      }

      // קבלת כל המשחקים
      const { data: gamesData, error: gamesError } = await supabase.from("games").select("*").order("date")

      if (gamesError) {
        console.error("Error fetching games:", gamesError)
      } else {
        setGames(gamesData || [])
      }
    } catch (err) {
      console.error("Error in data fetching:", err)

      // שימוש בשירות הטיפול בשגיאות
      const appError = {
        code: "ADMIN_DATA_FETCH_ERROR",
        message: err instanceof Error ? err.message : "שגיאה לא ידועה בטעינת נתוני מנהל",
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        context: { refreshCounter },
        retry: refreshData,
      }

      await errorService.handleError(appError)
      setError(appError)
    } finally {
      setLoading(false)
    }
  }, [refreshCounter])

  // פונקציה לאתחול רענון הנתונים
  const triggerRefresh = useCallback(() => {
    console.log("Triggering refresh...")
    setRefreshCounter((prev) => prev + 1)
  }, [])

  // טעינת נתונים בעת טעינת הדף או כאשר מונה הרענון משתנה
  useEffect(() => {
    refreshData()
  }, [refreshData, refreshCounter])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">מערכת ניהול נתונים</h1>

      {error && <ErrorDisplay error={error} onRetry={refreshData} onDismiss={() => setError(null)} />}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-navy-600"></div>
        </div>
      ) : (
        <>
          <AdminDataPanel
            adminUser={adminUser}
            userCount={users.length}
            predictionCount={predictions.length}
            gameCount={games.length}
          />

          <div className="mb-6 border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "dashboard"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("dashboard")}
              >
                לוח בקרה
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "players"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("players")}
              >
                שחקנים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "weekly-games"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("weekly-games")}
              >
                משחקים שבועיים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "game-results"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("game-results")}
              >
                תוצאות משחקים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "predictions"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("predictions")}
              >
                ניחושים
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "leaderboard"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("leaderboard")}
              >
                טבלת דירוג
              </button>
              <button
                className={`mr-1 py-2 px-4 text-center border-b-2 font-medium text-sm ${
                  activeTab === "system"
                    ? "border-navy-600 text-navy-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => setActiveTab("system")}
              >
                ניהול מערכת
              </button>
            </nav>
          </div>

          {activeTab === "dashboard" && (
            <DashboardPanel
              adminUser={adminUser}
              userCount={users.length}
              predictionCount={predictions.length}
              gameCount={games.length}
            />
          )}
          {activeTab === "players" && (
            <>
              <PlayerForm onPlayerAdded={triggerRefresh} />
              <PlayersList users={users} games={games} onUserUpdated={triggerRefresh} />
            </>
          )}
          {activeTab === "weekly-games" && <WeeklyGamesEditor currentWeek={1} />}
          {activeTab === "game-results" && <GameResultsEditor />}
          {activeTab === "predictions" && <PredictionsTracker />}
          {activeTab === "leaderboard" && <LeaderboardTable />}
          {activeTab === "system" && <SystemManagement />}
        </>
      )}
    </div>
  )
}
