"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { revalidatePath } from "next/cache"

/**
 * פעולת שרת לקבלת היום הנוכחי במערכת
 */
export async function getCurrentSystemDayAction() {
  try {
    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    const supabase = createServerSupabaseClient()

    // קבלת היום הנוכחי מטבלת ההגדרות
    const { data, error } = await supabase.from("settings").select("currentday").eq("id", "global").single()

    if (error) {
      throw new Error(`Error fetching current system day: ${error.message}`)
    }

    return {
      success: true,
      currentDay: data?.currentday || "sunday",
      message: "היום הנוכחי נטען בהצלחה",
    }
  } catch (error) {
    console.error("Error in getCurrentSystemDayAction:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_GET_CURRENT_DAY_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בקבלת היום הנוכחי",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: {},
    })

    // במקרה של שגיאה, החזר יום ברירת מחדל
    return {
      success: false,
      currentDay: "sunday",
      message: error instanceof Error ? error.message : "שגיאה בקבלת היום הנוכחי",
    }
  }
}

/**
 * פעולת שרת לעדכון היום הנוכחי במערכת
 */
export async function updateCurrentSystemDayAction(day: string) {
  try {
    // וידוא שהיום תקין
    const validDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    if (!validDays.includes(day)) {
      throw new Error("יום לא תקין")
    }

    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    const supabase = createServerSupabaseClient()

    // עדכון היום הנוכחי בטבלת ההגדרות
    const { error } = await supabase
      .from("settings")
      .update({
        currentday: day,
        updated_at: new Date().toISOString(),
      })
      .eq("id", "global")

    if (error) {
      throw new Error(`Error updating current system day: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return { success: true, message: "היום הנוכחי עודכן בהצלחה" }
  } catch (error) {
    console.error("Error in updateCurrentSystemDayAction:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_UPDATE_CURRENT_DAY_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון היום הנוכחי",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { day },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בעדכון היום הנוכחי",
    }
  }
}
