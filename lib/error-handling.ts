export enum ErrorSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  CRITICAL = "critical",
}

export interface AppError {
  code: string
  message: string
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, any>
  retry?: () => Promise<any>
}

class ErrorService {
  private static instance: ErrorService
  private errors: AppError[] = []
  private errorHandlers: Record<string, (error: AppError) => Promise<boolean>> = {}

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService()
    }
    return ErrorService.instance
  }

  public registerErrorHandler(errorCode: string, handler: (error: AppError) => Promise<boolean>): void {
    this.errorHandlers[errorCode] = handler
  }

  public async handleError(error: AppError): Promise<boolean> {
    this.errors.push(error)
    this.logError(error)

    // אם יש מטפל ספציפי לקוד השגיאה
    if (this.errorHandlers[error.code]) {
      return await this.errorHandlers[error.code](error)
    }

    // אסטרטגיות שחזור אוטומטיות לפי חומרת השגיאה
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return true // רק לוג, ללא פעולה נוספת
      case ErrorSeverity.WARNING:
        return this.handleWarning(error)
      case ErrorSeverity.ERROR:
        return this.handleStandardError(error)
      case ErrorSeverity.CRITICAL:
        return this.handleCritical(error)
      default:
        return false
    }
  }

  private async handleWarning(error: AppError): Promise<boolean> {
    // ניסיון אחד נוסף אם יש פונקציית retry
    if (error.retry) {
      try {
        await error.retry()
        return true
      } catch (e) {
        return false
      }
    }
    return false
  }

  private async handleStandardError(error: AppError): Promise<boolean> {
    // ניסיון עד 3 פעמים עם השהייה בין ניסיונות
    if (error.retry) {
      for (let i = 0; i < 3; i++) {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)))
          await error.retry()
          return true
        } catch (e) {
          console.log(`Retry ${i + 1} failed`)
        }
      }
    }
    return false
  }

  private async handleCritical(error: AppError): Promise<boolean> {
    // שליחת התראה למנהל המערכת
    try {
      await this.notifyAdmin(error)
    } catch (e) {
      console.error("Failed to notify admin:", e)
    }
    return false
  }

  private logError(error: AppError): void {
    console.error(`[${error.severity}] ${error.code}: ${error.message}`, error.context)

    // כאן אפשר להוסיף שליחה לשירות לוגים חיצוני כמו Sentry
    // או שמירה בטבלת לוגים בסופאבייס
    try {
      const supabase = getSupabaseClient()
      if (supabase) {
        supabase
          .from("error_logs")
          .insert({
            code: error.code,
            message: error.message,
            severity: error.severity,
            context: error.context,
            created_at: error.timestamp.toISOString(),
          })
          .then(({ error: logError }) => {
            if (logError) {
              console.error("Error logging to database:", logError)
            }
          })
      }
    } catch (e) {
      console.error("Failed to log error to database:", e)
    }
  }

  private async notifyAdmin(error: AppError): Promise<void> {
    // יישום שליחת התראה למנהל המערכת
    console.log("Admin notification would be sent here for critical error:", error)

    // דוגמה לשליחת התראה למנהל דרך סופאבייס
    try {
      const supabase = getSupabaseClient()
      if (supabase) {
        await supabase.from("admin_notifications").insert({
          type: "error",
          title: `שגיאה קריטית: ${error.code}`,
          message: error.message,
          context: error.context,
          created_at: error.timestamp.toISOString(),
          is_read: false,
        })
      }
    } catch (e) {
      console.error("Failed to send admin notification:", e)
    }
  }

  public getRecentErrors(): AppError[] {
    return [...this.errors].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10)
  }
}

// ייבוא getSupabaseClient
import { getSupabaseClient } from "./supabase"

export const errorService = ErrorService.getInstance()
