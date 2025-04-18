"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../lib/supabase"
import { Users, CheckSquare, Calendar, TrendingUp, Award, BarChart2 } from "lucide-react"
import type { User, Game, Prediction } from "../types"

interface DashboardPanelProps {
  adminUser: User | null
  userCount: number
  predictionCount: number
  gameCount: number
}

export default function DashboardPanel({ adminUser, userCount, predictionCount, gameCount }: DashboardPanelProps) {
  const [topUsers, setTopUsers] = useState<User[]>([])
  const [upcomingGames, setUpcomingGames] = useState<Game[]>([])
  const [recentPredictions, setRecentPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalPoints: 0,
    correctPredictions: 0,
    predictionAccuracy: 0,
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // Fetch top 5 users by points
        const { data: topUsersData, error: topUsersError } = await supabase
          .from("users")
          .select("*")
          .order("points", { ascending: false })
          .limit(5)

        if (topUsersError) {
          console.error("Error fetching top users:", topUsersError)
        } else {
          setTopUsers(topUsersData || [])
        }

        // Fetch upcoming games
        const { data: upcomingGamesData, error: upcomingGamesError } = await supabase
          .from("games")
          .select("*")
          .eq("isfinished", false)
          .order("date", { ascending: true })
          .limit(5)

        if (upcomingGamesError) {
          console.error("Error fetching upcoming games:", upcomingGamesError)
        } else {
          setUpcomingGames(upcomingGamesData || [])
        }

        // Fetch recent predictions
        const { data: recentPredictionsData, error: recentPredictionsError } = await supabase
          .from("predictions")
          .select("*")
          .order("timestamp", { ascending: false })
          .limit(5)

        if (recentPredictionsError) {
          console.error("Error fetching recent predictions:", recentPredictionsError)
        } else {
          setRecentPredictions(recentPredictionsData || [])
        }

        // Calculate stats
        const { data: statsData, error: statsError } = await supabase
          .from("predictions")
          .select("points")
          .not("points", "is", null)

        if (statsError) {
          console.error("Error fetching prediction stats:", statsError)
        } else if (statsData) {
          const totalPoints = statsData.reduce((sum, pred) => sum + (pred.points || 0), 0)
          const correctPredictions = statsData.filter((pred) => (pred.points || 0) > 0).length
          const predictionAccuracy = statsData.length > 0 ? (correctPredictions / statsData.length) * 100 : 0

          setStats({
            totalPoints,
            correctPredictions,
            predictionAccuracy,
          })
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  // Helper function to get user name by ID
  const getUserName = (userId: string): string => {
    const user = topUsers.find((u) => u.id === userId)
    return user ? user.name : "משתמש לא ידוע"
  }

  // Helper function to get game name by ID
  const getGameName = (gameId: string): string => {
    const game = upcomingGames.find((g) => g.id === gameId)
    return game ? `${game.hometeam} נגד ${game.awayteam}` : "משחק לא ידוע"
  }

  return (
    <div className="space-y-6">
      {/* Admin Info Panel */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">פרטי מנהל</h2>

        {adminUser ? (
          <div className="mb-4">
            <p className="font-bold">
              שם: <span className="font-normal">{adminUser.name}</span>
            </p>
            <p className="font-bold">
              קוד שחקן: <span className="font-normal">{adminUser.playercode}</span>
            </p>
            <p className="font-bold">
              סטטוס: <span className="font-normal">{adminUser.status || "פעיל"}</span>
            </p>
            <p className="font-bold">
              מזהה: <span className="font-normal">{adminUser.id}</span>
            </p>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            <p>המשתמש עם קוד 323317966 לא נמצא במסד הנתונים.</p>
            <p>משתמש זה מוגדר בקוד כמנהל-על (Super Admin) בקובץ auth-context.tsx.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-blue-500">משתמשים</p>
              <p className="text-2xl font-bold">{userCount}</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg flex items-center">
            <CheckSquare className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-green-500">ניחושים</p>
              <p className="text-2xl font-bold">{predictionCount}</p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg flex items-center">
            <Calendar className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-purple-500">משחקים</p>
              <p className="text-2xl font-bold">{gameCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">סטטיסטיקות מערכת</h3>
            <BarChart2 className="w-6 h-6 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-navy-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">סה"כ נקודות:</span>
                <span className="font-bold text-lg">{stats.totalPoints}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ניחושים נכונים:</span>
                <span className="font-bold text-lg">{stats.correctPredictions}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">אחוז דיוק:</span>
                <span className="font-bold text-lg">{stats.predictionAccuracy.toFixed(1)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">מובילים בדירוג</h3>
            <Award className="w-6 h-6 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-navy-600"></div>
            </div>
          ) : topUsers.length > 0 ? (
            <ul className="space-y-3">
              {topUsers.map((user, index) => (
                <li key={user.id} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-navy-600 text-white rounded-full flex items-center justify-center text-xs mr-2">
                      {index + 1}
                    </span>
                    <span className="font-medium">{user.name}</span>
                  </div>
                  <span className="font-bold">{user.points || 0}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">אין נתונים זמינים</p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">משחקים קרובים</h3>
            <Calendar className="w-6 h-6 text-gray-400" />
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-navy-600"></div>
            </div>
          ) : upcomingGames.length > 0 ? (
            <ul className="space-y-3">
              {upcomingGames.map((game) => (
                <li key={game.id} className="border-b border-gray-100 pb-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {game.hometeam} - {game.awayteam}
                    </span>
                    <span className="text-sm text-gray-500">{game.time}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(game.date).toLocaleDateString("he-IL")} | {game.league}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">אין משחקים קרובים</p>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">פעילות אחרונה</h3>
          <TrendingUp className="w-6 h-6 text-gray-400" />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-navy-600"></div>
          </div>
        ) : recentPredictions.length > 0 ? (
          <ul className="space-y-4">
            {recentPredictions.map((prediction) => (
              <li key={prediction.id} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{getUserName(prediction.userid)}</span>
                    <span className="text-gray-500 mx-2">ניחש</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                      {prediction.prediction}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(prediction.timestamp).toLocaleString("he-IL")}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">{getGameName(prediction.gameid)}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">אין פעילות אחרונה</p>
        )}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">שגיאה!</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  )
}
