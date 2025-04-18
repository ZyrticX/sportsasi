import { type NextRequest, NextResponse } from "next/server"
import type { z } from "zod"

export function validateRequest<T>(
  schema: z.ZodType<T>,
  handler: (req: NextRequest, data: T) => Promise<NextResponse>,
) {
  return async (req: NextRequest) => {
    try {
      // קבלת הנתונים מהבקשה
      const body = await req.json().catch(() => ({}))

      // תיקוף הנתונים
      const result = schema.safeParse(body)

      if (!result.success) {
        // אם התיקוף נכשל, החזר שגיאה
        const errors = result.error.format()
        return NextResponse.json(
          {
            success: false,
            errors,
            message: "שגיאה בתיקוף נתונים",
          },
          { status: 400 },
        )
      }

      // אם התיקוף הצליח, המשך לטיפול בבקשה
      return handler(req, result.data)
    } catch (error) {
      console.error("Error in validate middleware:", error)
      return NextResponse.json(
        {
          success: false,
          message: "שגיאה בעיבוד הבקשה",
        },
        { status: 500 },
      )
    }
  }
}
