"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "../../../lib/supabase"
import { Search, Download, RefreshCw, AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react"
import type { User } from "../../types"

export default function LeaderboardTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  // טעינת משתמשים
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      setError(null)

      try {
        const supabase = getSupabaseClient()
        if (!supabase) {
          throw new Error("Supabase client is not available")
        }

        const { data, error } = await supabase.from("users").select("*").order("points", { ascending: false })

        if (error) {
          throw new Error(`Error fetching users: ${error.message}`)
        }

        setUsers(data || [])
      } catch (err) {
        console.error("Error fetching users:", err)
        setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.playercode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["דירוג", "שם", "קוד שחקן", "נקודות", "ניחושים נכונים", "סה״כ ניחושים", "אחוז הצלחה"]
    const csvData = filteredUsers.map((user, index) => [
      (index + 1).toString(),
      user.name || "",
      user.playercode || "",
      user.points?.toString() || "0",
      user.correct_predictions?.toString() || "0",
      user.total_predictions?.toString() || "0",
      user.correct_predictions && user.total_predictions
        ? ((user.correct_predictions / user.total_predictions) * 100).toFixed(1) + "%"
        : "0%",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "leaderboard.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // חישוב מגמה
  const getTrendIcon = (user: User) => {
    if (!user.trend) return <Minus className="w-4 h-4 text-gray-400" />

    if (user.trend === "up") {
      return <TrendingUp className="w-4 h-4 text-green-500" />
    } else if (user.trend === "down") {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">טבלת דירוג</h2>

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

        <button className="bg-navy-600 text-white px-4 py-2 rounded-md flex items-center" onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          ייצוא CSV
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-navy-600" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-600">לא נמצאו משתמשים</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  דירוג
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  קוד שחקן
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נקודות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  נקודות שבועיות
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ניחושים נכונים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סה״כ ניחושים
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  אחוז הצלחה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  מגמה
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user, index) => {
                const successRate =
                  user.correct_predictions && user.total_predictions
                    ? (user.correct_predictions / user.total_predictions) * 100
                    : 0

                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center justify-center w-6 h-6 bg-navy-600 text-white rounded-full">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.playercode}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-navy-600">{user.points || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.weekly_points || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.correct_predictions || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.total_predictions || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{successRate.toFixed(1)}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center">{getTrendIcon(user)}</div>
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
