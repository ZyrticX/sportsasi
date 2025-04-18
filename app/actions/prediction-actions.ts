"use server"

import { getSupabaseClient } from "@/lib/supabase"
import { validatePrediction, validatePredictionBusinessRules } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { revalidatePath } from "next/cache"

// הוספת ניחוש חדש
export async function addPrediction(userId: string, gameId: string, prediction: string) {
  try {
    // תיקוף הנתונים
    const predictionData = {
      userid: userId,
      gameid: gameId,
      prediction,
    }

    // תיקוף הנתונים
    const validationResult = validatePrediction(predictionData)
    if (!validationResult.success) {
      return {
        success: false,
        errors: validationResult.errors,
        message: "שגיאה בתיקוף נתונים",
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם המשחק קיים
    const { data: game, error: gameError } = await supabase.from("games").select("*").eq("id", gameId).single()

    if (gameError) {
      throw new Error(`Error fetching game: ${gameError.message}`)
    }

    if (!game) {
      return {
        success: false,
        message: "המשחק לא נמצא",
      }
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validatePredictionBusinessRules(predictionData, game)
    if (!businessRulesResult.success) {
      return {
        success: false,
        errors: businessRulesResult.errors,
        message: "שגיאה בבדיקות העסקיות",
      }
    }

    // בדיקה אם כבר קיים ניחוש למשחק זה מהמשתמש הזה
    const { data: existingPrediction, error: existingError } = await supabase
      .from("predictions")
      .select("*")
      .eq("userid", userId)
      .eq("gameid", gameId)
      .limit(1)

    if (existingError) {
      throw new Error(`Error checking existing prediction: ${existingError.message}`)
    }

    let data
    let error

    if (existingPrediction && existingPrediction.length > 0) {
      // עדכון ניחוש קיים
      const result = await supabase
        .from("predictions")
        .update({
          prediction,
          timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPrediction[0].id)
        .select()

      data = result.data
      error = result.error
    } else {
      // הוספת ניחוש חדש
      const result = await supabase
        .from("predictions")
        .insert({
          userid: userId,
          gameid: gameId,
          prediction,
          points: 0,
          timestamp: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()

      data = result.data
      error = result.error
    }

    if (error) {
      throw new Error(`Error saving prediction: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/")

    return {
      success: true,
      data,
      message: "הניחוש נשמר בהצלחה",
    }
  } catch (error) {
    console.error("Error in addPrediction:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_ADD_PREDICTION_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת ניחוש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { userId, gameId, prediction },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בהוספת ניחוש",
    }
  }
}
