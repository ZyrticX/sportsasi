import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { GameSchema, validateGameBusinessRules } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// עדכון משחק קיים
export const PUT = validateRequest(GameSchema, async (req, validatedData) => {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משחק חסר",
        },
        { status: 400 },
      )
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validateGameBusinessRules(validatedData)
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

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // עדכון המשחק במסד הנתונים
    const { data, error } = await supabase
      .from("games")
      .update({
        hometeam: validatedData.hometeam,
        awayteam: validatedData.awayteam,
        time: validatedData.time,
        date: validatedData.date,
        league: validatedData.league,
        closingtime: validatedData.closingtime,
        week: validatedData.week,
        isfinished: validatedData.isfinished,
        islocked: validatedData.islocked,
        result: validatedData.result,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      throw new Error(`Error updating game: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "המשחק עודכן בהצלחה",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in PUT /api/games/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_UPDATE_GAME_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData, url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בעדכון משחק",
      },
      { status: 500 },
    )
  }
})

// מחיקת משחק
export async function DELETE(req: NextRequest) {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משחק חסר",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם יש ניחושים למשחק זה
    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("id")
      .eq("gameid", id)
      .limit(1)

    if (predictionsError) {
      throw new Error(`Error checking predictions: ${predictionsError.message}`)
    }

    // אם יש ניחושים, לא ניתן למחוק את המשחק
    if (predictions && predictions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "לא ניתן למחוק משחק שיש לו ניחושים",
        },
        { status: 400 },
      )
    }

    // מחיקת המשחק ממסד הנתונים
    const { error } = await supabase.from("games").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting game: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: "המשחק נמחק בהצלחה",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in DELETE /api/games/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_DELETE_GAME_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה במחיקת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה במחיקת משחק",
      },
      { status: 500 },
    )
  }
}

// קבלת משחק ספציפי
export async function GET(req: NextRequest) {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משחק חסר",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.from("games").select("*").eq("id", id).single()

    if (error) {
      throw new Error(`Error fetching game: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in GET /api/games/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_GET_GAME_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בקבלת משחק",
      },
      { status: 500 },
    )
  }
}
