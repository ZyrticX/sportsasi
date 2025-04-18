import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { GameSchema, validateGameBusinessRules } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// הוספת משחק חדש
export const POST = validateRequest(GameSchema, async (req, validatedData) => {
  try {
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

    // הוספת המשחק למסד הנתונים
    const { data, error } = await supabase
      .from("games")
      .insert({
        hometeam: validatedData.hometeam,
        awayteam: validatedData.awayteam,
        time: validatedData.time,
        date: validatedData.date,
        league: validatedData.league,
        closingtime: validatedData.closingtime,
        week: validatedData.week || 1,
        isfinished: validatedData.isfinished || false,
        islocked: validatedData.islocked || false,
        result: validatedData.result || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw new Error(`Error adding game: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "המשחק נוסף בהצלחה",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/games:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_ADD_GAME_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בהוספת משחק",
      },
      { status: 500 },
    )
  }
})

// קבלת כל המשחקים
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const week = searchParams.get("week")
    const isFinished = searchParams.get("isFinished")

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    let query = supabase.from("games").select("*")

    // הוספת פילטרים אם הם קיימים
    if (week) {
      query = query.eq("week", week)
    }

    if (isFinished !== null) {
      query = query.eq("isfinished", isFinished === "true")
    }

    // מיון לפי תאריך
    query = query.order("date", { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching games: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in GET /api/games:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_GET_GAMES_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת משחקים",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בקבלת משחקים",
      },
      { status: 500 },
    )
  }
}
