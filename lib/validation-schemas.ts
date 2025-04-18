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
  week: z.number().int().positive("מספר שבוע חייב להיות מספר חיובי").optional(),
  isfinished: z.boolean().optional(),
  islocked: z.boolean().optional(),
  result: z.string().optional(),
})

// סכמה לתיקוף משחק שבועי
export const WeeklyGameSchema = z.object({
  id: z.string().uuid().optional(),
  day: z.enum(["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"], {
    errorMap: () => ({ message: "יום לא תקין" }),
  }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), "תאריך לא תקין"),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "פורמט שעה לא תקין (HH:MM)"),
  hometeam: z.string().min(1, "שם קבוצת הבית הוא שדה חובה"),
  awayteam: z.string().min(1, "שם קבוצת החוץ הוא שדה חובה"),
  league: z.string().min(1, "שם הליגה הוא שדה חובה"),
  closingtime: z.string().refine((val) => !isNaN(Date.parse(val)), "זמן סגירה לא תקין"),
  week: z.number().int().positive("מספר שבוע חייב להיות מספר חיובי"),
  isfinished: z.boolean().optional(),
  islocked: z.boolean().optional(),
  manuallylocked: z.boolean().optional(),
  result: z.string().optional(),
})

// סכמה לתיקוף ניחוש
export const PredictionSchema = z.object({
  userid: z.string().uuid("מזהה משתמש לא תקין"),
  gameid: z.string().uuid("מזהה משחק לא תקין"),
  prediction: z.enum(["1", "X", "2"], {
    errorMap: () => ({ message: "ניחוש חייב להיות אחד מהערכים: 1, X, 2" }),
  }),
})

// סכמה לתיקוף משתמש
export const UserSchema = z.object({
  name: z.string().min(2, "שם חייב להכיל לפחות 2 תווים"),
  playercode: z.string().regex(/^\d{8,9}$/, "קוד שחקן חייב להכיל 8 או 9 ספרות"),
  email: z.string().email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
  phone: z
    .string()
    .regex(/^0\d{8,9}$/, "מספר טלפון לא תקין")
    .optional()
    .or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  role: z
    .enum(["user", "admin", "super-admin"], {
      errorMap: () => ({ message: "תפקיד לא תקין" }),
    })
    .optional(),
  status: z
    .enum(["active", "blocked"], {
      errorMap: () => ({ message: "סטטוס לא תקין" }),
    })
    .optional(),
})

// פונקציות עזר לתיקוף

// פונקציה כללית לתיקוף נתונים עם סכמה
export function validateWithSchema<T>(schema: z.ZodType<T>, data: unknown) {
  try {
    const validatedData = schema.parse(data)
    return {
      success: true,
      data: validatedData,
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

// פונקציות ספציפיות לתיקוף כל סוג נתונים
export function validateGame(gameData: unknown) {
  return validateWithSchema(GameSchema, gameData)
}

export function validateWeeklyGame(weeklyGameData: unknown) {
  return validateWithSchema(WeeklyGameSchema, weeklyGameData)
}

export function validatePrediction(predictionData: unknown) {
  return validateWithSchema(PredictionSchema, predictionData)
}

export function validateUser(userData: unknown) {
  return validateWithSchema(UserSchema, userData)
}

// פונקציות לבדיקות עסקיות נוספות

// בדיקות עסקיות למשחק
export function validateGameBusinessRules(gameData: any) {
  const errors: Record<string, string> = {}

  // בדיקה שזמן הסגירה הוא לפני תאריך המשחק
  const gameDate = new Date(gameData.date)
  const closingTime = new Date(gameData.closingtime)

  if (closingTime > gameDate) {
    errors.closingtime = "זמן הסגירה חייב להיות לפני תאריך המשחק"
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

// בדיקות עסקיות לניחוש
export function validatePredictionBusinessRules(predictionData: any, gameData: any) {
  const errors: Record<string, string> = {}

  // בדיקה שהמשחק לא ננעל
  if (gameData.islocked || gameData.isfinished) {
    errors.gameid = "לא ניתן לנחש משחק שננעל או הסתיים"
  }

  // בדיקה שזמן הסגירה לא עבר
  const now = new Date()
  const closingTime = new Date(gameData.closingtime)

  if (now > closingTime) {
    errors.gameid = "זמן הניחוש למשחק זה הסתיים"
  }

  return {
    success: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : null,
  }
}
