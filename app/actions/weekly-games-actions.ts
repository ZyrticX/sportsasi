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

    // שימוש בפונקציית RPC שעוקפת את מדיניות ה-RLS
    const { data, error } = await supabase.rpc("update_weekly_games_bypass_rls", {
      p_week: week,
      p_day: day,
      p_games: gamesArray,
    })

    if (error) {
      throw new Error(`Error updating weekly games: ${error.message}`)
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
