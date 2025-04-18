import { NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { z } from "zod"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// סכמה לתיקוף עדכון תוצאת משחק
const GameResultSchema = z.object({
  gameId: z.string().uuid("מזהה משחק לא תקין"),
  result: z.enum(["1", "X", "2"], {
    errorMap: () => ({ message: "תוצאה חייבת להיות אחת מהערכים: 1, X, 2" }),
  }),
})

// עדכון תוצאת משחק
export const POST = validateRequest(GameResultSchema, async (req, validatedData) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם המשחק קיים
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("*")
      .eq("id", validatedData.gameId)
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

    // בדיקה אם המשחק כבר הסתיים
    if (game.isfinished) {
      return NextResponse.json(
        {
          success: false,
          message: "המשחק כבר הסתיים ולא ניתן לעדכן את התוצאה",
        },
        { status: 400 },
      )
    }

    // עדכון תוצאת המשחק
    const { data, error } = await supabase.rpc("update_game_result", {
      game_id: validatedData.gameId,
      game_result: validatedData.result,
    })

    if (error) {
      throw new Error(`Error updating game result: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "תוצאת המשחק עודכנה בהצלחה",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in POST /api/games/results:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_UPDATE_GAME_RESULT_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון תוצאת משחק",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בעדכון תוצאת משחק",
      },
      { status: 500 },
    )
  }
})
