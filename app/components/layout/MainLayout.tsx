"use client"

import type React from "react"

import { Bell, LogIn } from "lucide-react"

interface MainLayoutProps {
  userName: string
  userIdentifier: string | null
  isSuperAdmin: boolean
  isAdmin: boolean
  adminCode: string | null
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
  onSwitchToPlayerMode: () => void
  onSwitchToAdminMode: () => void
  onShowAdminModal: () => void
  children: React.ReactNode
}

export default function MainLayout({
  userName,
  userIdentifier,
  isSuperAdmin,
  isAdmin,
  adminCode,
  activeTab,
  onTabChange,
  onLogout,
  onSwitchToPlayerMode,
  onSwitchToAdminMode,
  onShowAdminModal,
  children,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-bold text-2xl text-navy-600">ניחושים בין החברים</div>

          <div className="flex items-center space-x-4">
            <button className="text-gray-600 hover:text-navy-600 transition duration-300">
              <Bell className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 ml-2">שלום, {userName || userIdentifier}</span>
              {isSuperAdmin && (
                <span className="ml-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">SUPER ADMIN</span>
              )}

              {isAdmin && (
                <div className="flex items-center mr-4">
                  <button
                    className={`px-3 py-1 rounded-md text-xs font-medium mr-2 ${
                      activeTab !== "admin" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={onSwitchToPlayerMode}
                  >
                    מצב שחקן
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md text-xs font-medium ${
                      activeTab === "admin" ? "bg-navy-600 text-white" : "bg-gray-200 text-gray-800"
                    }`}
                    onClick={onSwitchToAdminMode}
                  >
                    מצב מנהל
                  </button>
                </div>
              )}

              {/* Admin mode button - only shown if there's an admin code and user is not in admin mode */}
              {adminCode && !isAdmin && (
                <button
                  className="px-3 py-1 rounded-md text-xs font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 mr-4"
                  onClick={onShowAdminModal}
                >
                  מעבר למצב מנהל
                </button>
              )}

              <button
                className="flex items-center text-gray-600 hover:text-navy-600 transition duration-300 mr-4"
                onClick={onLogout}
              >
                <LogIn className="w-5 h-5 ml-1" />
                התנתק
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="max-w-6xl mx-auto px-4 py-2 flex border-t border-gray-200">
          {["home", "leaderboard", "history", "admin"].map((tab) => {
            // Hide admin tab if user is not admin
            if (tab === "admin" && !isAdmin) {
              return null
            }

            return (
              <button
                key={tab}
                className={`mr-4 px-3 py-2 rounded-md transition duration-300 ${
                  activeTab === tab ? "bg-gray-100 text-navy-600" : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => onTabChange(tab)}
              >
                {tab === "home" && "דף הבית"}
                {tab === "leaderboard" && "טבלת דירוג"}
                {tab === "history" && "תוצאות"}
                {tab === "admin" && "ממשק מנהל"}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="py-8">{children}</main>

      <footer className="bg-gray-800 text-white py-6 text-center">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-lg">© 2025 ניחושים בין החברים - כל הזכויות שמורות</p>
        </div>
      </footer>
    </div>
  )
}
