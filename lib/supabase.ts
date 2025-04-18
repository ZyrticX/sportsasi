import { createClient } from "@supabase/supabase-js"

// Singleton instance for Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

/**
 * יוצר ומחזיר לקוח Supabase
 * משתמש בתבנית Singleton כדי להבטיח שיש רק מופע אחד של הלקוח
 */
export const getSupabaseClient = () => {
  // Return existing instance if already created
  if (supabaseClient) {
    return supabaseClient
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables")
      return null
    }

    // וודא שה-URL תקין
    const formattedUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`

    // Create and store the client instance
    supabaseClient = createClient(formattedUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })

    console.log("Supabase client initialized successfully")
    return supabaseClient
  } catch (error) {
    console.error("Error creating Supabase client:", error)
    return null
  }
}

/**
 * יוצר ומחזיר לקוח Supabase לשימוש בצד השרת
 * לקוח זה עוקף את מדיניות ה-RLS
 */
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables")
  }

  // וודא שה-URL תקין
  const formattedUrl = supabaseUrl.startsWith("http") ? supabaseUrl : `https://${supabaseUrl}`

  return createClient(formattedUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * בודק אם Supabase זמין
 */
export const isSupabaseAvailable = () => {
  try {
    const client = getSupabaseClient()
    return !!client
  } catch (error) {
    console.error("Error checking Supabase availability:", error)
    return false
  }
}

/**
 * בודק אם חיבור Supabase פעיל
 */
export const testSupabaseConnection = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return false

    // Try a simple query to test the connection
    const { data, error } = await supabase.from("games").select("count", { count: "exact", head: true })

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Error testing Supabase connection:", error)
    return false
  }
}

// Utility functions from utils.ts that are related to Supabase

/**
 * יצירת קוד אקראי
 */
export function generateRandomCode(length: number): string {
  const digits = Array.from({ length }, () => Math.floor(Math.random() * 10))
  return digits.join("")
}

/**
 * פונקציות עזר ל-RPC
 */

// עדכון תוצאת משחק
export const updateGameResult = async (gameId: string, result: string): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    // קריאה לפונקציית RPC לעדכון תוצאת משחק
    const { data, error } = await supabase.rpc("update_game_result", {
      game_id: gameId,
      game_result: result,
    })

    if (error) {
      console.error("Error updating game result:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Error updating game result:", error)
    return false
  }
}

// הוספת משחק חדש
export const addGame = async (game: any): Promise<string | null> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return null
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return null
    }

    const { data, error } = await supabase
      .from("games")
      .insert({
        hometeam: game.homeTeam,
        awayteam: game.awayTeam,
        time: game.time,
        date: game.date,
        league: game.league,
        closingtime: game.closingTime,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Error adding game:", error)
      return null
    }

    return data[0].id
  } catch (error) {
    console.error("Error adding game:", error)
    return null
  }
}

// מחיקת משחק
export const deleteGame = async (gameId: string): Promise<boolean> => {
  try {
    if (!isSupabaseAvailable()) {
      console.error("Supabase is not available")
      return false
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    const { error } = await supabase.from("games").delete().eq("id", gameId)

    if (error) {
      console.error("Error deleting game:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error deleting game:", error)
    return false
  }
}

// בדיקה אם טבלה קיימת
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return false
    }

    const { data, error } = await supabase.rpc("check_table_exists", {
      table_name: tableName,
    })

    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error)
      return false
    }

    return !!data
  } catch (error) {
    console.error(`Error checking if table ${tableName} exists:`, error)
    return false
  }
}

// קבלת כל המשתמשים עבור מנהל
export const getAllUsersForAdmin = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      console.error("Supabase client is not available")
      return []
    }

    const { data, error } = await supabase.rpc("get_all_users_for_admin")

    if (error) {
      console.error("Error getting all users for admin:", error)

      // נסיון לקבל משתמשים ישירות מהטבלה
      const { data: fallbackData, error: fallbackError } = await supabase.from("users").select("*").order("name")

      if (fallbackError) {
        console.error("Error fetching users directly:", fallbackError)
        return []
      }

      return fallbackData || []
    }

    return data || []
  } catch (error) {
    console.error("Error getting all users for admin:", error)
    return []
  }
}
