"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseClient } from "../../../lib/supabase"
import type { User, Game } from "../../types"
import { X, AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import PlayerPredictions from "./PlayerPredictions"

interface PlayerDetailProps {
  user: User
  games: Game[]
  onClose: () => void
  onUserUpdated: () => void
}

export default function PlayerDetail({ user, games, onClose, onUserUpdated }: PlayerDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editedUser, setEditedUser] = useState<User>({ ...user })

  // Update user status
  const updateUserStatus = async (newStatus: "active" | "blocked") => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_user_status", {
        user_id: user.id,
        new_status: newStatus,
      })

      if (error) {
        throw new Error(`Error updating user status: ${error.message}`)
      }

      if (data) {
        setSuccess(`סטטוס המשתמש עודכן ל-${newStatus === "active" ? "פעיל" : "חסום"}`)
        setEditedUser({ ...editedUser, status: newStatus })
        onUserUpdated()
      } else {
        setError("לא ניתן היה לעדכן את סטטוס המשתמש")
      }
    } catch (err) {
      console.error("Error updating user status:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

  // Update user points
  const updateUserPoints = async (points: number) => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase.rpc("update_user_points", {
        user_id: user.id,
        new_points: points,
      })

      if (error) {
        throw new Error(`Error updating user points: ${error.message}`)
      }

      if (data) {
        setSuccess(`הנקודות של המשתמש עודכנו ל-${points}`)
        setEditedUser({ ...editedUser, points })
        onUserUpdated()
      } else {
        setError("לא ניתן היה לעדכן את נקודות המשתמש")
      }
    } catch (err) {
      console.error("Error updating user points:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

  // Update user details
  const updateUserDetails = async () => {
    setIsUpdating(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          name: editedUser.name,
          phone: editedUser.phone,
          city: editedUser.city,
          email: editedUser.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select()

      if (error) {
        throw new Error(`Error updating user details: ${error.message}`)
      }

      if (data && data.length > 0) {
        setSuccess(`פרטי המשתמש עודכנו בהצלחה`)
        onUserUpdated()
      } else {
        setError("לא ניתן היה לעדכן את פרטי המשתמש")
      }
    } catch (err) {
      console.error("Error updating user details:", err)
      setError(err instanceof Error ? err.message : "שגיאה לא ידועה")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditedUser({ ...editedUser, [name]: value })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">פרטי שחקן: {user.name}</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-bold mb-2">פרטים אישיים</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  שם
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={editedUser.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="playercode" className="block text-sm font-medium text-gray-700 mb-1">
                  קוד שחקן
                </label>
                <input
                  type="text"
                  id="playercode"
                  name="playercode"
                  value={editedUser.playercode}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  טלפון
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={editedUser.phone || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  אימייל
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={editedUser.email || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  עיר
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={editedUser.city || ""}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div className="flex justify-end">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-md flex items-center"
                  onClick={updateUserDetails}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  עדכן פרטים
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-2">פעולות</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {editedUser.status === "blocked" ? (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      onClick={() => updateUserStatus("active")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      )}
                      הפעל משתמש
                    </button>
                  ) : (
                    <button
                      className="bg-orange-600 text-white px-3 py-1 rounded-md text-sm flex items-center"
                      onClick={() => updateUserStatus("blocked")}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1" />
                      )}
                      חסום משתמש
                    </button>
                  )}
                </div>

                <div className="flex items-center">
                  <span className="text-sm mr-2">נקודות:</span>
                  <input
                    type="number"
                    className="border border-gray-300 rounded-md px-2 py-1 w-16 text-center"
                    defaultValue={editedUser.points || 0}
                    min={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const points = Number.parseInt((e.target as HTMLInputElement).value)
                        if (!isNaN(points)) {
                          updateUserPoints(points)
                        }
                      }
                    }}
                  />
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded-md text-sm ml-2"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      const points = Number.parseInt(input.value)
                      if (!isNaN(points)) {
                        updateUserPoints(points)
                      }
                    }}
                    disabled={isUpdating}
                  >
                    עדכן
                  </button>
                </div>

                <div className="mt-4">
                  <h4 className="font-bold text-sm mb-2">מידע נוסף:</h4>
                  <p className="text-sm">
                    <span className="font-bold">סטטוס:</span>{" "}
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        editedUser.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {editedUser.status === "active" ? "פעיל" : editedUser.status === "blocked" ? "חסום" : "-"}
                    </span>
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-bold">תאריך הצטרפות:</span>{" "}
                    {editedUser.created_at ? new Date(editedUser.created_at).toLocaleDateString() : "-"}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-bold">מזהה:</span> {editedUser.id}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PlayerPredictions userId={user.id} games={games} />
      </div>
    </div>
  )
}
