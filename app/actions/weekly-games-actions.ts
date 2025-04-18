"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { revalidatePath } from "next/cache"

interface WeeklyGame {
  id: string
  game_id?: string
  hometeam: string
  awayteam: string
  time: string
  league: string
  closingtime: string | Date
  manuallylocked?: boolean
}

/**
 * פעולת שרת לעדכון משחקים שבועיים
 * פעולה זו מתבצעת בצד השרת ועוקפת את מדיניות ה-RLS
 */
export async function updateWeeklyGamesAction(week: number, day: string, games: WeeklyGame[]) {
  console.log("Starting updateWeeklyGamesAction", { week, day, gamesCount: games.length })

  try {
    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    console.log("Creating server Supabase client")
    const supabase = createServerSupabaseClient()

    if (!supabase) {
      console.error("Failed to create Supabase client")
      throw new Error("Supabase client is not available")
    }

    console.log("Supabase client created successfully")

    // הכנת מערך המשחקים לשמירה - וודא שכל משחק מקבל מזהה ייחודי
    const gamesArray = games.map((game) => ({
      id: game.id.startsWith("temp_") ? `new_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` : game.id,
      game_id: game.game_id,
      hometeam: game.hometeam,
      awayteam: game.awayteam,
      time: game.time,
      league: game.league,
      closingtime: game.closingtime,
      manuallylocked: game.manuallylocked || false,
    }))

    console.log("Games array prepared", { gamesCount: gamesArray.length, firstGame: gamesArray[0] || "No games" })

    // בדיקה אם כבר קיימת רשומה ליום ושבוע זה
    console.log("Checking if record exists for week and day")
    const { data: existingData, error: existingError } = await supabase
      .from("weekly_games")
      .select("id")
      .eq("week", week)
      .eq("day", day)
      .maybeSingle()

    if (existingError) {
      console.error("Error checking existing weekly games:", existingError)
      throw new Error(`Error checking existing weekly games: ${existingError.message}`)
    }

    if (existingData) {
      // עדכון רשומה קיימת - שימוש בעדכון ישיר לטבלה
      console.log("Record exists, updating existing record", { recordId: existingData.id })
      const { error: updateError } = await supabase
        .from("weekly_games")
        .update({
          games: gamesArray,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingData.id)

      if (updateError) {
        console.error("Error updating weekly games:", updateError)
        throw new Error(`Error updating weekly games: ${updateError.message}`)
      }

      console.log("Successfully updated existing record")
    } else {
      // יצירת רשומה חדשה
      console.log("Record does not exist, creating new record")
      const { error: insertError } = await supabase.from("weekly_games").insert({
        week,
        day,
        games: gamesArray,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting weekly games:", insertError)
        throw new Error(`Error inserting weekly games: ${insertError.message}`)
      }

      console.log("Successfully created new record")
    }

    // רענון הדף
    console.log("Revalidating path: /admin-data-access")
    revalidatePath("/admin-data-access")

    console.log("Weekly games update completed successfully")
    return { success: true, message: "המשחקים השבועיים עודכנו בהצלחה" }
  } catch (error) {
    console.error("Error in updateWeeklyGamesAction:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_UPDATE_WEEKLY_GAMES_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון המשחקים השבועיים",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { week, day, gamesCount: games.length },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בעדכון המשחקים השבועיים",
    }
  }
}
