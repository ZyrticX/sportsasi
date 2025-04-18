import { z } from "zod"

// סכמה לתיקוף משחק
export const GameSchema = z.object({
  id: z.string().uuid().optional(),
  hometeam: z.string().min(1, "שם קבוצת הבית הוא שדה חובה"),
  awayteam: z.string().min(1, "שם קבוצת החוץ הוא שדה חובה"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "פורמט שעה לא תקין (HH:MM)"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "תאריך לא תקין"),
  league: z.string().min(1, "שם הליגה הוא שדה חובה"),
  closingtime: z.string().refine((val) => !isNaN(Date.parse(val)), "זמן סגירה לא תקין"),
  week: z.number().int().positive().optional(),
})

// סכמה לתיקוף משחק שבועי
export const WeeklyGameSchema = z.object({
  id: z.string().uuid().optional(),
  game_id: z.string().uuid().optional(),
  day: z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], {
    errorMap: () => ({ message: "יום לא תקין" }),
  }),
  week: z.number().int().positive(),
  hometeam: z.string().min(1, "שם קבוצת הבית הוא שדה חובה"),
  awayteam: z.string().min(1, "שם קבוצת החוץ הוא שדה חובה"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "פורמט שעה לא תקין (HH:MM)"),
  league: z.string().min(1, "שם הליגה הוא שדה חובה"),
  closingtime: z.string().refine((val) => !isNaN(Date.parse(val)), "זמן סגירה לא תקין"),
  manuallylocked: z.boolean().optional(),
})

// פונקציה לתיקוף משחק
export function validateGame(gameData: any) {
  try {
    return {
      success: true,
      data: GameSchema.parse(gameData),
      errors: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join(".")
        formattedErrors[path] = err.message
      })
      return {
        success: false,
        data: null,
        errors: formattedErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { _general: "שגיאה לא ידועה בתיקוף הנתונים" },
    }
  }
}

// פונקציה לתיקוף משחק שבועי
export function validateWeeklyGame(weeklyGameData: any) {
  try {
    return {
      success: true,
      data: WeeklyGameSchema.parse(weeklyGameData),
      errors: null,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join(".")
        formattedErrors[path] = err.message
      })
      return {
        success: false,
        data: null,
        errors: formattedErrors,
      }
    }
    return {
      success: false,
      data: null,
      errors: { _general: "שגיאה לא ידועה בתיקוף הנתונים" },
    }
  }
}

// פונקציה לבדיקות עסקיות נוספות
export function validateGameBusinessRules(gameData: any) {
  const errors: Record<string, string> = {}

  // בדיקה שזמן הסגירה הוא לפני תאריך המשחק
  const gameDate = new Date(gameData.date)
  const closingTime = new Date(gameData.closingtime)

  if (closingTime > gameDate) {
    errors.closingtime = "זמן הסגירה חייב להיות לפני תאריך המשחק"
  }

  // בדיקה שהתאריך עתידי
  const now = new Date()
  if (gameDate < now) {
    errors.date = "תאריך המשחק חייב להיות עתידי"
  }

  // בדיקה שקבוצת הבית וקבוצת החוץ שונות
  if (gameData.hometeam === gameData.awayteam) {
    errors.awayteam = "קבוצת החוץ חייבת להיות שונה מקבוצת הבית"
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : null,
  }
}
