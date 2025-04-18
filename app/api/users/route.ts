import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseClient } from "@/lib/supabase"
import { validateRequest } from "@/lib/middleware/validate"
import { UserSchema } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

// הוספת משתמש חדש
export const POST = validateRequest(UserSchema, async (req, validatedData) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // בדיקה אם קוד השחקן כבר קיים
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("playercode", validatedData.playercode)
      .limit(1)

    if (existingError) {
      throw new Error(`Error checking existing user: ${existingError.message}`)
    }

    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "קוד שחקן כבר קיים במערכת",
        },
        { status: 400 },
      )
    }

    // הוספת המשתמש למסד הנתונים
    const { data, error } = await supabase
      .from("users")
      .insert({
        name: validatedData.name,
        playercode: validatedData.playercode,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        city: validatedData.city || null,
        role: validatedData.role || "user",
        status: validatedData.status || "active",
        points: 0,
        correct_predictions: 0,
        total_predictions: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      throw new Error(`Error adding user: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: "המשתמש נוסף בהצלחה",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error in POST /api/users:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_ADD_USER_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { validatedData },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בהוספת משתמש",
      },
      { status: 500 },
    )
  }
})

// קבלת כל המשתמשים
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const role = searchParams.get("role")
    const status = searchParams.get("status")

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    let query = supabase.from("users").select("*")

    // הוספת פילטרים אם הם קיימים
    if (role) {
      query = query.eq("role", role)
    }

    if (status) {
      query = query.eq("status", status)
    }

    // מיון לפי שם
    query = query.order("name", { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`)
    }

    return NextResponse.json(
      {
        success: true,
        data,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error in GET /api/users:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "API_GET_USERS_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת משתמשים",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { url: req.url },
    })

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "שגיאה בקבלת משתמשים",
      },
      { status: 500 },
    )
  }
}
