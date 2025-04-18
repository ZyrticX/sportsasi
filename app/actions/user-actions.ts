"use server"

import { getSupabaseClient } from "@/lib/supabase"
import { validateUser } from "@/lib/validation-schemas"
import { errorService, ErrorSeverity } from "@/lib/error-handling"
import { revalidatePath } from "next/cache"

// הוספת משתמש חדש
export async function addUser(formData: FormData) {
  try {
    // המרת הנתונים מהטופס לאובייקט
    const userData = {
      name: formData.get("name") as string,
      playercode: formData.get("playercode") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      city: formData.get("city") as string,
      role: (formData.get("role") as string) || "user",
    }

    // תיקוף הנתונים
    const validationResult = validateUser(userData)
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

    // בדיקה אם קוד השחקן כבר קיים
    const { data: existingUser, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("playercode", userData.playercode)
      .limit(1)

    if (existingError) {
      throw new Error(`Error checking existing user: ${existingError.message}`)
    }

    if (existingUser && existingUser.length > 0) {
      return {
        success: false,
        message: "קוד שחקן כבר קיים במערכת",
      }
    }

    // הוספת המשתמש למסד הנתונים
    const { data, error } = await supabase.rpc("add_new_user_with_role", {
      user_name: userData.name,
      user_playercode: userData.playercode,
      user_phone: userData.phone || null,
      user_city: userData.city || null,
      user_email: userData.email || null,
      user_status: "active",
      user_points: 0,
      user_role: userData.role,
    })

    if (error) {
      throw new Error(`Error adding user: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return {
      success: true,
      data,
      message: "המשתמש נוסף בהצלחה",
    }
  } catch (error) {
    console.error("Error in addUser:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_ADD_USER_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בהוספת משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { formData: Object.fromEntries(formData.entries()) },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בהוספת משתמש",
    }
  }
}

// עדכון סטטוס משתמש
export async function updateUserStatus(userId: string, status: "active" | "blocked") {
  try {
    // תיקוף הנתונים
    if (!userId || !status) {
      return {
        success: false,
        message: "מזהה משתמש וסטטוס הם שדות חובה",
      }
    }

    if (!["active", "blocked"].includes(status)) {
      return {
        success: false,
        message: "סטטוס חייב להיות אחד מהערכים: active, blocked",
      }
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    // עדכון סטטוס המשתמש
    const { data, error } = await supabase.rpc("update_user_status", {
      user_id: userId,
      new_status: status,
    })

    if (error) {
      throw new Error(`Error updating user status: ${error.message}`)
    }

    // רענון הדף
    revalidatePath("/admin-data-access")

    return {
      success: true,
      data,
      message: `סטטוס המשתמש עודכן ל-${status === "active" ? "פעיל" : "חסום"}`,
    }
  } catch (error) {
    console.error("Error in updateUserStatus:", error)

    // שימוש בשירות הטיפול בשגיאות
    await errorService.handleError({
      code: "SERVER_ACTION_UPDATE_USER_STATUS_ERROR",
      message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון סטטוס משתמש",
      severity: ErrorSeverity.ERROR,
      timestamp: new Date(),
      context: { userId, status },
    })

    return {
      success: false,
      message: error instanceof Error ? error.message : "שגיאה בעדכון סטטוס משתמש",
    }
  }
}
