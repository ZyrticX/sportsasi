"use server"

import { createServerSupabaseClient } from "@/lib/supabase"
import { errorService, ErrorSeverity } from "@/lib/error-handling"

/**
 * פעולת שרת לשמירת העדפות משתמש
 */
export async function saveUserPreferences(module: string, preferences: Record<string, any>) {
  try {
    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    const supabase = createServerSupabaseClient()

    // שימוש בפונקציית RPC לשמירת ההעדפות
    const { data, error } = await supabase.rpc("save_user_preferences", {
      p_module: module,
      p_preferences: preferences,
    })

    if (error) {
      throw new Error(`Error saving user preferences: ${error.message}`)
    }

    return { success: true, message: "ההעדפות נשמרו בהצלחה" }
  } catch (error) {
    console.error("Error in saveUserPreferences:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_SAVE_PREFERENCES_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בשמירת העדפות",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { module, preferences },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בשמירת העדפות",
    }
  }
}

/**
 * פעולת שרת לקבלת העדפות משתמש
 */
export async function getUserPreferences(module: string) {
  try {
    // יצירת לקוח סופאבייס בצד השרת (עם הרשאות מלאות)
    const supabase = createServerSupabaseClient()

    // קבלת ההעדפות
    const { data, error } = await supabase.from("user_preferences").select("preferences").eq("module", module).single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw new Error(`Error getting user preferences: ${error.message}`)
    }

    return {
      success: true,
      data: data?.preferences || {},
      message: "ההעדפות נטענו בהצלחה",
    }
  } catch (error) {
    console.error("Error in getUserPreferences:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_GET_PREFERENCES_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בטעינת העדפות",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { module },
    })

    return {
      success: false,
      data: {},
      message: error instanceof Error ? error.message : "שגיאה בטעינת העדפות",
    }
  }
}
