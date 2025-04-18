"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseClient } from "../lib/supabase"

// טיפוס AuthContextType
type AuthContextType = {
  isAuthenticated: boolean
  isAdmin: boolean
  isPlayer: boolean
  isSuperAdmin: boolean
  userIdentifier: string | null
  adminCode: string | null
  isRoleSelectionRequired: boolean
  loginWithCode: (code: string) => Promise<boolean>
  loginAsAdmin: (code: string) => Promise<boolean>
  switchToPlayerMode: () => void
  switchToAdminMode: () => void
  selectRole: (role: "admin" | "player") => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPlayer, setIsPlayer] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [userIdentifier, setUserIdentifier] = useState<string | null>(null)
  const [adminCode, setAdminCode] = useState<string | null>(null)
  const [isRoleSelectionRequired, setIsRoleSelectionRequired] = useState(false)

  // בדיקה אם המשתמש כבר מחובר (מהלוקל סטורג')
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType")
    const storedIdentifier = localStorage.getItem("userIdentifier")
    const storedAdminCode = localStorage.getItem("adminCode")

    if (storedUserType && storedIdentifier) {
      setUserIdentifier(storedIdentifier)
      setIsAuthenticated(true)
      setIsAdmin(storedUserType === "admin")
      setIsPlayer(storedUserType === "player" || storedUserType === "admin-player")

      if (storedAdminCode) {
        setAdminCode(storedAdminCode)
      }

      // בדיקה אם המשתמש הוא Super Admin מהמסד נתונים
      checkUserRoleFromDatabase(storedIdentifier)
    }
  }, [])

  // פונקציה לבדיקת תפקיד המשתמש ממסד הנתונים
  const checkUserRoleFromDatabase = async (playercode: string) => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("Supabase client is not available")
        return
      }

      const { data, error } = await supabase.from("users").select("role").eq("playercode", playercode).single()

      if (error) {
        console.error("Error checking user role:", error)
        return
      }

      if (data) {
        const role = data.role || "player"

        // עדכון הרשאות המשתמש בהתאם לתפקיד
        if (role === "super-admin") {
          setIsSuperAdmin(true)
          setIsAdmin(true)
          setIsPlayer(true)
          localStorage.setItem("userType", "admin")
        } else if (role === "admin") {
          setIsSuperAdmin(false)
          setIsAdmin(true)
          setIsPlayer(true)
          localStorage.setItem("userType", "admin")
        }
      }
    } catch (error) {
      console.error("Error checking user role:", error)
    }
  }

  // פונקציית התחברות עם קוד - שימוש במסד נתונים בלבד
  const loginWithCode = async (code: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("Supabase client is not available")
        return false
      }

      // בדיקה אם הקוד קיים במסד הנתונים
      const { data, error } = await supabase
        .from("users")
        .select("id, role, playercode")
        .eq("playercode", code)
        .single()

      if (error) {
        console.error("Error checking user code:", error)
        return false
      }

      if (data) {
        // המשתמש נמצא במסד הנתונים
        setUserIdentifier(code)
        setIsAuthenticated(true)

        const role = data.role || "player"

        if (role === "super-admin") {
          // אם זה Super Admin, התחבר ישירות כמנהל
          setIsSuperAdmin(true)
          setIsAdmin(true)
          setIsPlayer(true)
          setAdminCode(code)
          setIsRoleSelectionRequired(false)
          localStorage.setItem("userType", "admin")
          localStorage.setItem("adminCode", code)
        } else if (role === "admin") {
          // אם זה מנהל רגיל, הפעל את מסך בחירת התפקיד
          setIsSuperAdmin(false)
          setIsAdmin(false)
          setIsPlayer(false)
          setAdminCode(code)
          setIsRoleSelectionRequired(true)
          localStorage.setItem("adminCode", code)
        } else {
          // התחברות רגילה כשחקן
          setIsSuperAdmin(false)
          setIsAdmin(false)
          setIsPlayer(true)
          localStorage.setItem("userType", "player")
        }

        localStorage.setItem("userIdentifier", code)
        return true
      }

      return false
    } catch (error) {
      console.error("Error in loginWithCode:", error)
      return false
    }
  }

  // פונקציה להתחברות ישירה כמנהל
  const loginAsAdmin = async (code: string): Promise<boolean> => {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        console.error("Supabase client is not available")
        return false
      }

      // בדיקה אם הקוד קיים במסד הנתונים
      const { data, error } = await supabase.from("users").select("id, role").eq("playercode", code).single()

      if (error) {
        console.error("Error checking admin code:", error)
        return false
      }

      if (data) {
        const role = data.role || "player"

        // רק אם המשתמש הוא מנהל או מנהל-על
        if (role === "admin" || role === "super-admin") {
          setUserIdentifier(code)
          setIsAuthenticated(true)
          setIsAdmin(true)
          setIsPlayer(true)
          setAdminCode(code)
          setIsRoleSelectionRequired(false)
          setIsSuperAdmin(role === "super-admin")

          localStorage.setItem("userIdentifier", code)
          localStorage.setItem("adminCode", code)
          localStorage.setItem("userType", "admin")

          return true
        }
      }

      return false
    } catch (error) {
      console.error("Error in loginAsAdmin:", error)
      return false
    }
  }

  // פונקציה לבחירת תפקיד
  const selectRole = (role: "admin" | "player") => {
    if (adminCode) {
      if (role === "admin") {
        setIsAdmin(true)
        setIsPlayer(true)
        localStorage.setItem("userType", "admin")
      } else {
        setIsAdmin(false)
        setIsPlayer(true)
        localStorage.setItem("userType", "admin-player")
      }
      setIsRoleSelectionRequired(false)
    }
  }

  // פונקציה למעבר למצב שחקן
  const switchToPlayerMode = () => {
    if (adminCode) {
      setIsAdmin(false)
      setIsPlayer(true)
      localStorage.setItem("userType", "admin-player")
    }
  }

  // פונקציה למעבר למצב מנהל
  const switchToAdminMode = () => {
    if (adminCode) {
      setIsAdmin(true)
      setIsPlayer(true)
      localStorage.setItem("userType", "admin")
    }
  }

  // פונקציית התנתקות
  const logout = () => {
    setUserIdentifier(null)
    setIsAuthenticated(false)
    setIsAdmin(false)
    setIsPlayer(false)
    setIsSuperAdmin(false)
    setAdminCode(null)
    setIsRoleSelectionRequired(false)
    localStorage.removeItem("userType")
    localStorage.removeItem("userIdentifier")
    localStorage.removeItem("adminCode")
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        isPlayer,
        isSuperAdmin,
        userIdentifier,
        adminCode,
        isRoleSelectionRequired,
        loginWithCode,
        loginAsAdmin,
        switchToPlayerMode,
        switchToAdminMode,
        selectRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// הוק לשימוש בקונטקסט
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
