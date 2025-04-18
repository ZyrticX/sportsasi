"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { AlertCircle } from "lucide-react"

interface AdminModeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (password: string) => void
}

export default function AdminModeModal({ isOpen, onClose, onSubmit }: AdminModeModalProps) {
  const [adminPassword, setAdminPassword] = useState("")
  const [adminPasswordError, setAdminPasswordError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const adminPasswordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && adminPasswordRef.current) {
      adminPasswordRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setAdminPasswordError("")
    setIsSubmitting(true)

    // Call the onSubmit callback with the password
    onSubmit(adminPassword)

    // Reset state
    setIsSubmitting(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-bold mb-4">אימות מנהל</h3>

        {adminPasswordError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{adminPasswordError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
              סיסמת מנהל
            </label>
            <input
              type="password"
              id="adminPassword"
              ref={adminPasswordRef}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              placeholder="הזן סיסמת מנהל"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => {
                setAdminPassword("")
                setAdminPasswordError("")
                onClose()
              }}
            >
              ביטול
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-navy-600 text-white rounded-md hover:bg-navy-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "מאמת..." : "אישור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
