"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../../lib/supabase"
import { Search, Filter, RefreshCw, AlertCircle } from "lucide-react"
import type { Prediction, User, Game } from "../../types"

export default function PredictionsTracker() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [userFilter, setUserFilter] = useState("")
  const [gameFilter, setGameFilter] = useState("")

  // טעינת נתונים
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        // טעינת ניחושים
        const { data: predictionsData, error: predictionsError } = await supabase
          .from("predictions")
          .select("*")
          .order("timestamp", { ascending: false })

        if (predictionsError) {
          throw new Error(`Error fetching predictions: ${predictionsError.message}`)
        }

        setPredictions(predictionsData || [])

        // טעינת משתמשים
        const { data: usersData, error: usersError } = await supabase.from("users").select("*")

        if (usersError) {
          throw new Error(`Error fetching users: ${usersError.message}`)
        }

        setUsers(usersData || [])

        // טעינת משחקים
        const { data: gamesData, error: gamesError } = await supabase.from("games").select("*")

        if (gamesError) {
          throw new Error(`Error fetching games: ${gamesError.message}`)
        }

        setGames(gamesData || [])
      } catch (err) {
        console.error("Error fetching data:", err)
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Get user name by ID
  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.name : "משתמש לא ידוע"
  }

  // Get user playercode by ID
  const getUserPlayerCode = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    return user ? user.playercode : "-"
  }

  // Get game name by ID
  const getGameName = (gameId: string) => {
    const game = games.find((g) => g.id === gameId)
    return game ? `${game.hometeam} נגד ${game.awayteam}` : "משחק לא ידוע"
  }

  // Get game result by ID
  const getGameResult = (gameId: string) => {
    const game = games.find((g) => g.id === gameId)
    return game?.result || "-"
  }

  // Filter predictions
  const filteredPredictions = predictions.filter((prediction) => {
    const userName = getUserName(prediction.userid).toLowerCase()
    const userPlayerCode = getUserPlayerCode(prediction.userid).toLowerCase()
    const gameName = getGameName(prediction.gameid).toLowerCase()

    const matchesSearch =
      userName.includes(searchTerm.toLowerCase()) ||
      userPlayerCode.includes(searchTerm.toLowerCase()) ||
      gameName.includes(searchTerm.toLowerCase()) ||
      prediction.prediction.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesUserFilter = userFilter ? prediction.userid === userFilter : true
    const matchesGameFilter = gameFilter ? prediction.gameid === gameFilter : true

    return matchesSearch && matchesUserFilter && matchesGameFilter
  })

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">מעקב ניחושים</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="חיפוש..."
            className="pl-3 pr-10 py-2 border border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סינון לפי משתמש:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="">כל המשתמשים</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.playercode})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סינון לפי משחק:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
          >
            <option value="">כל המשחקים</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>
                {game.hometeam} נגד {game.awayteam}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
        </div>
      ) : filteredPredictions.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">לא נמצאו ניחושים</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  משתמש
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קוד שחקן
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  משחק
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ניחוש
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תוצאה בפועל
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נקודות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  זמן הגשה
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPredictions.map((prediction) => {
                const gameResult = getGameResult(prediction.gameid)
                const isCorrect = gameResult !== "-" && prediction.prediction === gameResult

                return (
                  <tr key={prediction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {getUserName(prediction.userid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {getUserPlayerCode(prediction.userid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getGameName(prediction.gameid)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {prediction.prediction}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {gameResult !== "-" ? (
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {gameResult}
                        </span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {isNaN(Number(prediction.points)) ? "0" : String(prediction.points || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {prediction.timestamp ? new Date(prediction.timestamp).toLocaleString() : "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
