"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../../lib/supabase"
import { Search, Filter, RefreshCw, CheckCircle, AlertCircle, Lock, Unlock } from "lucide-react"
import type { Game } from "../../types"

export default function GameResultsEditor() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [leagueFilter, setLeagueFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "finished" | "upcoming">("all")
  const [updatingGameId, setUpdatingGameId] = useState<string | null>(null)
  const [gameResults, setGameResults] = useState<Record<string, string>>({})

  // טעינת המשחקים
  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        const { data, error } = await supabase.from("games").select("*").order("date", { ascending: false })

        if (error) {
          throw new Error(`Error fetching games: ${error.message}`)
        }

        setGames(data || [])

        // אתחול מצב התוצאות
        const resultsMap: Record<string, string> = {}
        data?.forEach((game) => {
          if (game.result) {
            resultsMap[game.id] = game.result
          }
        })
        setGameResults(resultsMap)
      } catch (err) {
        console.error("Error fetching games:", err)
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [])

  // Get unique leagues
  const leagues = Array.from(new Set(games.map((game) => game.league)))

  // Filter games
  const filteredGames = games.filter((game) => {
    const matchesSearch =
      game.hometeam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.awayteam.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.league.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLeague = leagueFilter ? game.league === leagueFilter : true

    const isFinished = game.isfinished === true
    const matchesStatus = statusFilter === "all" ? true : statusFilter === "finished" ? isFinished : !isFinished

    return matchesSearch && matchesLeague && matchesStatus
  })

  // עדכון תוצאת משחק
  const updateGameResult = async (gameId: string, result: string) => {
    setUpdatingGameId(gameId)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_game_result", {
        game_id: gameId,
        game_result: result,
      })

      if (error) {
        throw new Error(`Error updating game result: ${error.message}`)
      }

      if (data) {
        setSuccess(`תוצאת המשחק עודכנה ל-${result}`)

        // עדכון המשחק ברשימה
        setGames((prevGames) =>
          prevGames.map((game) => (game.id === gameId ? { ...game, result, isfinished: true, islocked: true } : game)),
        )
      } else {
        setError("לא ניתן היה לעדכן את תוצאת המשחק")
      }
    } catch (err) {
      console.error("Error updating game result:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setUpdatingGameId(null)
    }
  }

  // נעילה/פתיחה של משחק
  const toggleGameLock = async (gameId: string, isLocked: boolean) => {
    setUpdatingGameId(gameId)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.from("games").update({ islocked: isLocked }).eq("id", gameId).select()

      if (error) {
        throw new Error(`Error updating game lock status: ${error.message}`)
      }

      if (data && data.length > 0) {
        setSuccess(`המשחק ${isLocked ? "ננעל" : "נפתח"} בהצלחה`)

        // עדכון המשחק ברשימה
        setGames((prevGames) => prevGames.map((game) => (game.id === gameId ? { ...game, islocked: isLocked } : game)))
      } else {
        setError(`לא ניתן היה ${isLocked ? "לנעול" : "לפתוח"} את המשחק`)
      }
    } catch (err) {
      console.error("Error toggling game lock:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setUpdatingGameId(null)
    }
  }

  // טיפול בשינוי תוצאה
  const handleResultChange = (gameId: string, result: string) => {
    setGameResults((prev) => ({ ...prev, [gameId]: result }))
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">עריכת תוצאות משחקים</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{success}</span>
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
          <span className="text-sm mr-2">סינון לפי ליגה:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={leagueFilter}
            onChange={(e) => setLeagueFilter(e.target.value)}
          >
            <option value="">כל הליגות</option>
            {leagues.map((league) => (
              <option key={league} value={league}>
                {league}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <Filter className="w-4 h-4 mr-1" />
          <span className="text-sm mr-2">סטטוס:</span>
          <select
            className="border border-gray-300 rounded-md px-3 py-1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "finished" | "upcoming")}
          >
            <option value="all">הכל</option>
            <option value="finished">הסתיימו</option>
            <option value="upcoming">עתידיים</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">לא נמצאו משחקים</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קבוצת בית
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קבוצת חוץ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ליגה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שעה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תוצאה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGames.map((game) => (
                <tr key={game.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.hometeam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{game.awayteam}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.league}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(game.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{game.time}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        game.isfinished
                          ? "bg-green-100 text-green-800"
                          : game.islocked
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {game.isfinished ? "הסתיים" : game.islocked ? "נעול" : "פתוח"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {game.isfinished ? (
                      game.result || "-"
                    ) : (
                      <div className="flex items-center space-x-2">
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1"
                          value={gameResults[game.id] || ""}
                          onChange={(e) => handleResultChange(game.id, e.target.value)}
                          disabled={updatingGameId === game.id}
                        >
                          <option value="">בחר</option>
                          <option value="1">1</option>
                          <option value="X">X</option>
                          <option value="2">2</option>
                        </select>
                        <button
                          className="bg-navy-600 text-white px-2 py-1 rounded-md text-xs"
                          onClick={() => updateGameResult(game.id, gameResults[game.id] || "")}
                          disabled={!gameResults[game.id] || updatingGameId === game.id}
                        >
                          {updatingGameId === game.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : "עדכן"}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {!game.isfinished && (
                      <button
                        className={`px-2 py-1 rounded-md text-xs flex items-center ${
                          game.islocked ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}
                        onClick={() => toggleGameLock(game.id, !game.islocked)}
                        disabled={updatingGameId === game.id}
                      >
                        {updatingGameId === game.id ? (
                          <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                        ) : game.islocked ? (
                          <Unlock className="w-3 h-3 mr-1" />
                        ) : (
                          <Lock className="w-3 h-3 mr-1" />
                        )}
                        {game.islocked ? "פתח" : "נעל"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
