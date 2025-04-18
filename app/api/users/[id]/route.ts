import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { UserSchema } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// עדכון משתמש קיים
export const PUT = validateRequest(UserSchema, async (req, validatedData) => {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משתמש חסר",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם קוד השחקן כבר קיים אצל משתמש אחר
    if (validatedData.playercode) {
      const { data: existingUser, error: existingError } = await supabase
        .from("users")
        .select("id")
        .eq("playercode", validatedData.playercode)
        .neq("id", id)
        .limit(1)

      if (existingError) {
        throw new Error(`Error checking existing user: ${existingError.message}`)
      }

      if (existingUser && existingUser.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "קוד שחקן כבר קיים אצל משתמש אחר",
          },
          { status: 400 },
        )
      }
    }

    // עדכון המשתמש במסד הנתונים
    const { data, error } = await supabase
      .from("users")
      .update({
        name: validatedData.name,
        playercode: validatedData.playercode,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        city: validatedData.city || null,
        role: validatedData.role,
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      throw new Error(`Error updating user: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "המשתמש עודכן בהצלחה",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in PUT /api/users/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_UPDATE_USER_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData, url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בעדכון משתמש",
      },
      { status: 500 },
    )
  }
})

// מחיקת משתמש
export async function DELETE(req: NextRequest) {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משתמש חסר",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם יש ניחושים למשתמש זה
    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("id")
      .eq("userid", id)
      .limit(1)

    if (predictionsError) {
      throw new Error(`Error checking predictions: ${predictionsError.message}`)
    }

    // אם יש ניחושים, נמחק גם אותם
    if (predictions && predictions.length > 0) {
      const { error: deleteError } = await supabase.from("predictions").delete().eq("userid", id)

      if (deleteError) {
        throw new Error(`Error deleting user predictions: ${deleteError.message}`)
      }
    }

    // מחיקת המשתמש ממסד הנתונים
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      throw new Error(`Error deleting user: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        message: "המשתמש נמחק בהצלחה",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in DELETE /api/users/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_DELETE_USER_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה במחיקת משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה במחיקת משתמש",
      },
      { status: 500 },
    )
  }
}

// קבלת משתמש ספציפי
export async function GET(req: NextRequest) {
  try {
    const id = req.url.split("/").pop()
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "מזהה משתמש חסר",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    const { data, error } = await supabase.from("users").select("*").eq("id", id).single()

    if (error) {
      throw new Error(`Error fetching user: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in GET /api/users/[id]:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_GET_USER_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בקבלת משתמש",
      },
      { status: 500 },
    )
  }
}
