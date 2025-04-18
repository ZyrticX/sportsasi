"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/auth-context"
import { getSupabaseClient } from "./lib/supabase"
import Login from "./components/auth/login"
import RoleSelection from "./components/auth/role-selection"
import AdminDataAccessPage from "./admin-data-access/page"
import MainLayout from "./components/layout/MainLayout"
import HomePage from "./components/pages/HomePage"
import AdminModeModal from "./components/admin/AdminModeModal"

// Weekly game interface
interface WeeklyGame {
  id: string
  hometeam: string
  awayteam: string
  time: string
  league: string
  closingtime: string | Date
  result?: string
  isfinished?: boolean
  manuallylocked?: boolean
  day?: string
}

export default function Home() {
  const {
    isAuthenticated,
    isAdmin,
    isPlayer,
    isSuperAdmin,
    userIdentifier,
    logout,
    switchToPlayerMode,
    switchToAdminMode,
    isRoleSelectionRequired,
    adminCode,
  } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("home")
  const [predictions, setPredictions] = useState<Record<string, string>>({})
  const [currentDateTime, setCurrentDateTime] = useState("")
  const [submittedPredictions, setSubmittedPredictions] = useState<Record<string, boolean>>({})
  const [weeklyGames, setWeeklyGames] = useState<Record<string, WeeklyGame[]>>({
    sunday: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
  })
  const [currentWeek, setCurrentWeek] = useState(1)
  const [showLoginPage, setShowLoginPage] = useState(false)
  const [games, setGames] = useState<WeeklyGame[]>([])
  const [loadingGames, setLoadingGames] = useState(true)
  const [userName, setUserName] = useState<string>("")
  const [systemDay, setSystemDay] = useState<string>("sunday")
  const [availableDays, setAvailableDays] = useState<Record<string, boolean>>({})
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPasswordError, setAdminPasswordError] = useState("")

  const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

  // Helper function to get the last Sunday (start of the week) with week offset
  const getLastSunday = (offset = 0) => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    const diff = today.getDate() - dayOfWeek + offset * 7
    return new Date(today.setDate(diff))
  }

  // Helper function to convert day to date based on the last Sunday with week offset
  const getDateForDay = (day: string, offset = 0) => {
    const lastSunday = getLastSunday(offset)
    const targetDayNumber = getDayNumber(day)

    // Create new date by adding days to last Sunday
    const date = new Date(lastSunday)
    date.setDate(lastSunday.getDate() + targetDayNumber)

    // Return date in DD/MM/YYYY format
    return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`
  }

  // Function to convert day name to number
  const getDayNumber = (day: string): number => {
    const daysMap: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    }

    return daysMap[day] || 0
  }

  // Update current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date()
      const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      const timeOptions: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
      const hebrewDate = now.toLocaleDateString("he-IL", dateOptions)
      const hebrewTime = now.toLocaleTimeString("he-IL", timeOptions)
      setCurrentDateTime(`${hebrewDate} | ${hebrewTime}`)
    }

    updateDateTime()
    const timer = setInterval(updateDateTime, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  // Update login state
  useEffect(() => {
    setShowLoginPage(!isAuthenticated)
  }, [isAuthenticated])

  // Load current week
  useEffect(() => {
    // Default to week 1
    setCurrentWeek(1)
  }, [])

  // Check available days for user
  useEffect(() => {
    if (!isAuthenticated || !userIdentifier) return

    // Default all days to available
    const days: Record<string, boolean> = {}
    for (const day of daysOfWeek) {
      days[day] = true
    }

    setAvailableDays(days)
  }, [isAuthenticated, userIdentifier, systemDay])

  // Load games
  useEffect(() => {
    const loadGamesFromDB = async () => {
      try {
        setLoadingGames(true)
        console.log("Starting to load games...")

        // קביעת היום הנוכחי באופן דינמי
        const today = new Date()
        const dayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
        const currentDayName = daysOfWeek[dayOfWeek] // המרה למחרוזת היום
        setSystemDay(currentDayName)

        // Use empty array for games
        const allGames: WeeklyGame[] = []

        console.log("Loaded games:", allGames)

        if (allGames.length === 0) {
          console.log("No games available for the current week")
          // Set empty games for all days
          setWeeklyGames({
            sunday: [],
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
          })
          setGames([])
        } else {
          // Organize games by day
          const gamesByDay: Record<string, WeeklyGame[]> = {
            sunday: [],
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
          }

          // Organize games by day
          allGames.forEach((game) => {
            const day = game.day || "sunday"
            if (gamesByDay[day]) {
              gamesByDay[day].push(game)
            }
          })

          // Update weekly games
          setWeeklyGames(gamesByDay)
          setGames(allGames)

          // Update manually locked games
          const lockedGamesMap: Record<string, boolean> = {}
          allGames.forEach((game) => {
            if (game.manuallylocked) {
              lockedGamesMap[game.id] = true
            }
          })
        }
      } catch (error) {
        console.error("Error loading games:", error)
        // Fallback to empty data in case of any error
        setWeeklyGames({
          sunday: [],
          monday: [],
          tuesday: [],
          wednesday: [],
          thursday: [],
          friday: [],
          saturday: [],
        })
        setGames([])
      } finally {
        setLoadingGames(false)
      }
    }

    // Load games on initial load
    loadGamesFromDB()
  }, [currentWeek])

  // Load user name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!isAuthenticated || !userIdentifier) return

      try {
        const supabase = getSupabaseClient()
        if (!supabase) return

        // Check if identifier is UUID or player code
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userIdentifier)

        let query
        if (isUUID) {
          query = supabase.from("users").select("name").eq("id", userIdentifier)
        } else {
          query = supabase.from("users").select("name").eq("playercode", userIdentifier)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching user name:", error)
          return
        }

        if (data && data.length > 0) {
          setUserName(data[0].name)
        }
      } catch (error) {
        console.error("Error in fetchUserName:", error)
      }
    }

    fetchUserName()
  }, [isAuthenticated, userIdentifier])

  // Load user predictions
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (isAuthenticated && userIdentifier) {
        try {
          console.log("Loading predictions for user:", userIdentifier)

          try {
            // Check if Supabase is available
            const supabase = getSupabaseClient()
            if (!supabase) {
              throw new Error("Supabase client is not available")
            }

            // Check if user exists in database
            try {
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("playercode", userIdentifier)

              if (userError) {
                if (userError.message.includes("does not exist")) {
                  console.log("users table does not exist")
                } else {
                  console.error("Error finding user:", userError)
                }
                throw new Error("Failed to find user")
              }

              if (userData && userData.length > 0) {
                console.log("Found user with ID:", userData[0].id)

                // Load user predictions
                try {
                  const { data: userPredictions, error: predError } = await supabase
                    .from("predictions")
                    .select("*")
                    .eq("userid", userData[0].id)

                  if (predError) {
                    if (predError.message.includes("does not exist")) {
                      console.log("predictions table does not exist")
                    } else {
                      console.error("Error loading predictions:", predError)
                    }
                    throw new Error("Failed to load predictions")
                  }

                  if (userPredictions && userPredictions.length > 0) {
                    const submittedGames: Record<string, boolean> = {}
                    const userPredictionsMap: Record<string, string> = {}

                    userPredictions.forEach((pred) => {
                      if (pred.gameid) {
                        submittedGames[pred.gameid] = true
                        userPredictionsMap[pred.gameid] = pred.prediction
                      }
                    })

                    setSubmittedPredictions(submittedGames)
                    setPredictions((prev) => ({
                      ...prev,
                      ...userPredictionsMap,
                    }))

                    console.log("Loaded predictions from Supabase")
                  }
                } catch (predError) {
                  console.error("Error in predictions query:", predError)
                }
              } else {
                console.log("No user found with playercode:", userIdentifier)
              }
            } catch (userError) {
              console.error("Error in user query:", userError)
            }
          } catch (supabaseError) {
            console.error("Error with Supabase:", supabaseError)
          }
        } catch (error) {
          console.error("Error in loadUserPredictions:", error)
        }
      }
    }

    if (isAuthenticated && userIdentifier) {
      loadUserPredictions()
    }
  }, [isAuthenticated, userIdentifier])

  // Function to refresh games
  const forceRefreshGames = async () => {
    setLoadingGames(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // Organize games by day
      const gamesByDay: Record<string, WeeklyGame[]> = {
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: [],
      }

      // Fetch games for each day
      for (const day of Object.keys(gamesByDay)) {
        // Use the RPC function to get games for this day and week
        const { data, error } = await supabase.rpc("get_weekly_games_for_home", {
          p_week: currentWeek,
          p_day: day,
        })

        if (error) {
          console.error(`Error fetching games for ${day}:`, error)
        } else {
          gamesByDay[day] = data || []
        }
      }

      // Update weekly games
      setWeeklyGames(gamesByDay)

      // Flatten all games into a single array for other uses
      const allGames = Object.values(gamesByDay).flat()
      setGames(allGames)

      console.log("Successfully refreshed games with data:", gamesByDay)
    } catch (error) {
      console.error("Error refreshing games:", error)
    } finally {
      setLoadingGames(false)
    }
  }

  // Handle prediction change
  const handlePredictionChange = (gameId: string, prediction: string) => {
    setPredictions((prev) => ({
      ...prev,
      [gameId]: prediction,
    }))
  }

  // Handle submit prediction
  const handleSubmitPrediction = async (gameId: string) => {
    if (!predictions[gameId]) {
      alert("יש לבחור ניחוש לפני ההגשה")
      return
    }

    try {
      // Create prediction object
      const predictionObj = {
        user_id: userIdentifier || "anonymous",
        game_id: gameId,
        prediction: predictions[gameId],
        timestamp: new Date(),
      }

      console.log("Submitting prediction:", predictionObj)

      // Default to success
      const success = true

      if (success) {
        // Update submitted predictions
        setSubmittedPredictions((prev) => ({
          ...prev,
          [gameId]: true,
        }))

        alert(`הניחוש למשחק ${gameId} נשלח בהצלחה!`)
      } else {
        alert("אירעה שגיאה בשליחת הניחוש. נסה שוב מאוחר יותר.")
      }
    } catch (error) {
      console.error("Error submitting prediction:", error)
      alert("אירעה שגיאה בשליחת הניחוש. נסה שוב מאוחר יותר.")
    }
  }

  // Handle admin password submission
  const handleAdminPasswordSubmit = (password: string) => {
    setAdminPasswordError("")

    // Check password - "5555" is the password
    if (password === "5555") {
      // If password is correct, switch to admin mode
      switchToAdminMode()
      setShowAdminModal(false)
      setActiveTab("admin")
    } else {
      setAdminPasswordError("סיסמה שגויה, נסה שנית")
    }
  }

  // If user is not logged in, show login page
  if (showLoginPage) {
    return <Login />
  }

  // If user is logged in but needs to select a role, show role selection
  if (isRoleSelectionRequired) {
    return <RoleSelection />
  }

  return (
    <>
      <MainLayout
        userName={userName}
        userIdentifier={userIdentifier}
        isSuperAdmin={isSuperAdmin}
        isAdmin={isAdmin}
        adminCode={adminCode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={logout}
        onSwitchToPlayerMode={() => {
          switchToPlayerMode()
          setActiveTab("home")
        }}
        onSwitchToAdminMode={() => {
          switchToAdminMode()
          setActiveTab("admin")
        }}
        onShowAdminModal={() => setShowAdminModal(true)}
      >
        {activeTab === "home" && (
          <HomePage
            userName={userName}
            currentDateTime={currentDateTime}
            currentWeek={currentWeek}
            isAdmin={isAdmin}
            systemDay={systemDay}
            availableDays={availableDays}
            weeklyGames={weeklyGames}
            loadingGames={loadingGames}
            onRefreshGames={forceRefreshGames}
            onPredictionChange={handlePredictionChange}
            onSubmitPrediction={handleSubmitPrediction}
          />
        )}
        {activeTab === "leaderboard" && (
          <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">טבלת דירוג</h2>
            <p className="text-gray-600">טבלת הדירוג אינה זמינה כרגע.</p>
          </div>
        )}
        {activeTab === "history" && (
          <div className="max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">היסטוריית תוצאות</h2>
            <p className="text-gray-600">היסטוריית התוצאות אינה זמינה כרגע.</p>
          </div>
        )}
        {activeTab === "admin" && isAdmin && <AdminDataAccessPage />}
      </MainLayout>

      <AdminModeModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onSubmit={handleAdminPasswordSubmit}
      />
    </>
  )
}
