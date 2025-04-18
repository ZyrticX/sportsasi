import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { PredictionSchema, validatePredictionBusinessRules } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// הוספת ניחוש חדש
export const POST = validateRequest(PredictionSchema, async (req, validatedData) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם המשחק קיים
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", validatedData.gameid)
      .single()

    if (gameError) {
      throw new Error(`Error fetching game: ${gameError.message}`)
    }

    if (!game) {
      return NextResponse.json(
        {
          success: false,
          message: "המשחק לא נמצא",
        },
        { status: 404 },
      )
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validatePredictionBusinessRules(validatedData, game)
    if (!businessRulesResult.success) {
      return NextResponse.json(
        {
          success: false,
          errors: businessRulesResult.errors,
          message: "שגיאה בבדיקות העסקיות",
        },
        { status: 400 },
      )
    }

    // בדיקה אם כבר קיים ניחוש למשחק זה מהמשתמש הזה
    const { data: existingPrediction, error: existingError } = await supabase
      .from("predictions")
      .select("*")
      .eq("userid", validatedData.userid)
      .eq("gameid", validatedData.gameid)
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
          prediction: validatedData.prediction,
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
          userid: validatedData.userid,
          gameid: validatedData.gameid,
          prediction: validatedData.prediction,
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

    return NextResponse.json(
      {
        success: true,
        data,
        message: "הניחוש נשמר בהצלחה",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/predictions:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_ADD_PREDICTION_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת ניחוש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בהוספת ניחוש",
      },
      { status: 500 },
    )
  }
})

// קבלת ניחושים
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")
    const gameId = searchParams.get("gameId")

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    let query = supabase.from("predictions").select("*")

    // הוספת פילטרים אם הם קיימים
    if (userId) {
      query = query.eq("userid", userId)
    }

    if (gameId) {
      query = query.eq("gameid", gameId)
    }

    // מיון לפי זמן
    query = query.order("timestamp", { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching predictions: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in GET /api/predictions:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_GET_PREDICTIONS_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת ניחושים",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בקבלת ניחושים",
      },
      { status: 500 },
    )
  }
}
