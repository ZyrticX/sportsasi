import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    // בדיקת מפתח API לאבטחה
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("api_key")

    // בדיקת תקינות מפתח ה-API
    if (apiKey !== process.env.CRON_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // יצירת לקוח סופאבייס בצד השרת
    const supabase = createServerSupabaseClient()

    // קריאה לפונקציה שמעדכנת את היום הנוכחי
    const { data, error } = await supabase.rpc("auto_update_current_day")

    if (error) {
      throw new Error(`Error updating current day: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      message: "Current day updated successfully",
      updated: !!data,
    })
  } catch (error) {
    console.error("Error in update-day cron job:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error updating current day",
      },
      { status: 500 },
    )
  }
}
