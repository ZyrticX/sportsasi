"use client"

import { useState } from "react"
import { getSupabaseClient } from "../../../lib/supabase"
import { Search, Download, UserCog, UserX, RefreshCw } from "lucide-react"
import type { User, Game } from "../../types"
import PlayerDetail from "./PlayerDetail"

interface PlayersListProps {
  users: User[]
  games?: Game[]
  onUserUpdated?: () => void
}

export default function PlayersList({ users, games = [], onUserUpdated }: PlayersListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<keyof User>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetail, setShowUserDetail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.playercode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Sort users based on sort field and direction
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField] || ""
    const bValue = b[sortField] || ""

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  // Handle sort change
  const handleSort = (field: keyof User) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleUserUpdated = () => {
    // Trigger a refresh of the users list
    onUserUpdated?.()
  }

  // Delete user
  const confirmDeleteUser = (userId: string) => {
    setDeleteUserId(userId)
    setShowDeleteConfirm(true)
  }

  const deleteUser = async () => {
    if (!deleteUserId) return

    setIsDeleting(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("delete_user", {
        user_id: deleteUserId,
      })

      if (error) {
        throw new Error(`Error deleting user: ${error.message}`)
      }

      if (data) {
        setSuccess(`המשתמש נמחק בהצלחה`)
        // קריאה לפונקציה שתרענן את רשימת המשתמשים
        onUserUpdated?.()
        // סגירת חלון האישור
        setShowDeleteConfirm(false)
        setDeleteUserId(null)
      } else {
        setError("לא ניתן היה למחוק את המשתמש")
      }
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsDeleting(false)
    }
  }

  // Export users to CSV
  const exportToCSV = () => {
    const headers = ["שם", "קוד שחקן", "טלפון", "עיר", "סטטוס", "נקודות", "תאריך יצירה"]
    const csvData = sortedUsers.map((user) => [
      user.name || "",
      user.playercode || "",
      user.phone || "",
      user.city || "",
      user.status || "",
      user.points?.toString() || "0",
      user.created_at ? new Date(user.created_at).toLocaleDateString() : "",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "players.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">רשימת שחקנים</h2>

        <div className="flex items-center">
          <div className="relative mr-2">
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
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p>{success}</p>
        </div>
      )}

      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("name")}
              >
                שם {sortField === "name" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("playercode")}
              >
                קוד שחקן {sortField === "playercode" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טלפון</th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("city")}
              >
                עיר {sortField === "city" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("status")}
              >
                סטטוס {sortField === "status" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort("points")}
              >
                נקודות {sortField === "points" && (sortDirection === "asc" ? "▲" : "▼")}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{user.playercode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.city || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status === "active" ? "פעיל" : user.status === "blocked" ? "חסום" : "-"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isNaN(Number(user.points)) ? "0" : String(user.points || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowUserDetail(true)
                        }}
                      >
                        <UserCog className="w-5 h-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-800" onClick={() => confirmDeleteUser(user.id)}>
                        <UserX className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  לא נמצאו משתמשים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showUserDetail && selectedUser && (
        <PlayerDetail
          user={selectedUser}
          games={games}
          onClose={() => setShowUserDetail(false)}
          onUserUpdated={() => {
            handleUserUpdated()
            setShowUserDetail(false)
          }}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">אישור מחיקת משתמש</h3>
            <p className="mb-4">
              האם אתה בטוח שברצונך למחוק את המשתמש <strong>{users.find((u) => u.id === deleteUserId)?.name}</strong>?
              פעולה זו אינה הפיכה וכל הניחושים של המשתמש יימחקו גם כן.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                onClick={() => setShowDeleteConfirm(false)}
              >
                ביטול
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-md flex items-center"
                onClick={deleteUser}
                disabled={isDeleting}
              >
                {isDeleting ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <UserX className="w-4 h-4 mr-1" />}
                מחק משתמש
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
