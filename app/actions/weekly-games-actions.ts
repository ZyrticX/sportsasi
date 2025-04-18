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
  try {
    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    const supabase = createServerSupabaseClient()

    // הכנת מערך המשחקים לשמירה
    const gamesArray = games.map((game) => ({
      id: game.id || `temp_${Date.now()}`,
      game_id: game.game_id,
      hometeam: game.hometeam,
      awayteam: game.awayteam,
      time: game.time,
      league: game.league,
      closingtime: game.closingtime,
      manuallylocked: game.manuallylocked || false,
    }))

    // ננסה להשתמש בפונקציה החדשה שעוקפת את כל מדיניות ה-RLS
    const { data, error } = await supabase.rpc("direct_update_weekly_games", {
      p_week: week,
      p_day: day,
      p_games: gamesArray,
    })

    if (error) {
      // אם יש שגיאה בקריאה ל-RPC, ננסה לעדכן ישירות את הטבלה
      console.error("Error using direct_update_weekly_games, trying fallback method:", error)

      // ננסה להשתמש בפונקציה הקודמת
      const { data: rpcData, error: rpcError } = await supabase.rpc("update_weekly_games_bypass_rls", {
        p_week: week,
        p_day: day,
        p_games: gamesArray,
      })

      if (rpcError) {
        console.error("Error using update_weekly_games_bypass_rls, trying direct update:", rpcError)

        // בדיקה אם כבר קיימת רשומה ליום ושבוע זה
        const { data: existingData, error: existingError } = await supabase
          .from("weekly_games")
          .select("id")
          .eq("week", week)
          .eq("day", day)
          .maybeSingle()

        if (existingError) {
          throw new Error(`Error checking existing weekly games: ${existingError.message}`)
        }

        if (existingData) {
          // עדכון רשומה קיימת
          const { error: updateError } = await supabase
            .from("weekly_games")
            .update({
              games: gamesArray,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existingData.id)

          if (updateError) {
            throw new Error(`Error updating weekly games: ${updateError.message}`)
          }
        } else {
          // יצירת רשומה חדשה
          const { error: insertError } = await supabase.from("weekly_games").insert({
            week,
            day,
            games: gamesArray,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) {
            throw new Error(`Error inserting weekly games: ${insertError.message}`)
          }
        }
      }
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return { success: true, message: "המשחקים השבועיים עודכנו בהצלחה" }
  } catch (error) {
    console.error("Error in updateWeeklyGamesAction:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_UPDATE_WEEKLY_GAMES_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון המשחקים השבועיים",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { week, day, games },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בעדכון המשחקים השבועיים",
    }
  }
}
