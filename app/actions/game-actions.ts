"use server"

import { getSupabaseClient } from "@/lib/supabase"
import { validateGame, validateGameBusinessRules } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { revalidatePath } from "next/cache"

// הוספת משחק חדש
export async function addGame(formData: FormData) {
  try {
    // המרת הנתונים מהטופס לאובייקט
    const gameData = {
      hometeam: formData.get("hometeam") as string,
      awayteam: formData.get("awayteam") as string,
      time: formData.get("time") as string,
      date: formData.get("date") as string,
      league: formData.get("league") as string,
      closingtime: formData.get("closingtime") as string,
      week: Number.parseInt(formData.get("week") as string) || 1,
    }

    // תיקוף הנתונים
    const validationResult = validateGame(gameData)
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.errors,
        message: "שגיאה בתיקוף נתונים",
      }
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validateGameBusinessRules(gameData)
    if (!businessRulesResult.success) {
      return {
        success: false,
        errors: businessRulesResult.errors,
        message: "שגיאה בבדיקות העסקיות",
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // הוספת המשחק למסד הנתונים
    const { data, error } = await supabase
      .from("games")
      .insert({
        hometeam: gameData.hometeam,
        awayteam: gameData.awayteam,
        time: gameData.time,
        date: gameData.date,
        league: gameData.league,
        closingtime: gameData.closingtime,
        week: gameData.week,
        isfinished: false,
        islocked: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw new Error(`Error adding game: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return {
      success: true,
      data,
      message: "המשחק נוסף בהצלחה",
    }
  } catch (error) {
    console.error("Error in addGame:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_ADD_GAME_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { formData: Object.fromEntries(formData.entries()) },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בהוספת משחק",
    }
  }
}

// עדכון תוצאת משחק
export async function updateGameResult(gameId: string, result: string) {
  try {
    // תיקוף הנתונים
    if (!gameId || !result) {
      return {
        success: false,
        message: "מזהה משחק ותוצאה הם שדות חובה",
      }
    }

    if (!["1", "X", "2"].includes(result)) {
      return {
        success: false,
        message: "תוצאה חייבת להיות אחת מהערכים: 1, X, 2",
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // עדכון תוצאת המשחק
    const { data, error } = await supabase.rpc("update_game_result", {
      game_id: gameId,
      game_result: result,
    })

    if (error) {
      throw new Error(`Error updating game result: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return {
      success: true,
      data,
      message: "תוצאת המשחק עודכנה בהצלחה",
    }
  } catch (error) {
    console.error("Error in updateGameResult:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_UPDATE_GAME_RESULT_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון תוצאת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { gameId, result },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בעדכון תוצאת משחק",
    }
  }
}
