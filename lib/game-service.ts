import { getSupabaseClient } from "./supabase"
import { errorService, ErrorSeverity, type AppError } from "./error-handling"
import { validateGame, validateWeeklyGame, validateGameBusinessRules } from "./validation"

interface GameData {
  id?: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  closingtime: string
  week?: number
}

interface WeeklyGameData {
  id?: string
  game_id?: string
  day: string
  week: number
  hometeam: string
  awayteam: string
  time: string
  league: string
  closingtime: string
  manuallylocked?: boolean
}

export class GameService {
  private static instance: GameService

  private constructor() {}

  public static getInstance(): GameService {
    if (!GameService.instance) {
      GameService.instance = new GameService()
    }
    return GameService.instance
  }

  /**
   * מוסיף או מעדכן משחק ומסנכרן אותו עם המשחקים השבועיים
   */
  public async addOrUpdateGame(gameData: GameData): Promise<string | null> {
    // תיקוף הנתונים
    const validationResult = validateGame(gameData)
    if (!validationResult.success) {
      await errorService.handleError({
        code: "GAME_VALIDATION_ERROR",
        message: "שגיאה בתיקוף נתוני המשחק",
        severity: ErrorSeverity.WARNING,
        timestamp: new Date(),
        context: { errors: validationResult.errors, gameData },
      })
      throw new Error("שגיאה בתיקוף נתוני המשחק")
    }

    // בדיקות עסקיות
    const businessRulesResult = validateGameBusinessRules(gameData)
    if (!businessRulesResult.success) {
      await errorService.handleError({
        code: "GAME_BUSINESS_RULES_ERROR",
        message: "שגיאה בבדיקות העסקיות של המשחק",
        severity: ErrorSeverity.WARNING,
        timestamp: new Date(),
        context: { errors: businessRulesResult.errors, gameData },
      })
      throw new Error("שגיאה בבדיקות העסקיות של המשחק")
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    try {
      // הוספה או עדכון המשחק בטבלת GAMES
      let gameId = gameData.id

      if (gameId) {
        // עדכון משחק קיים
        const { error: updateError } = await supabase
          .from("games")
          .update({
            hometeam: gameData.hometeam,
            awayteam: gameData.awayteam,
            time: gameData.time,
            date: gameData.date,
            league: gameData.league,
            closingtime: gameData.closingtime,
            week: gameData.week,
            updated_at: new Date().toISOString(),
          })
          .eq("id", gameId)

        if (updateError) {
          throw new Error(`Error updating game: ${updateError.message}`)
        }
      } else {
        // הוספת משחק חדש
        const { data: insertData, error: insertError } = await supabase
          .from("games")
          .insert({
            hometeam: gameData.hometeam,
            awayteam: gameData.awayteam,
            time: gameData.time,
            date: gameData.date,
            league: gameData.league,
            closingtime: gameData.closingtime,
            week: gameData.week,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (insertError) {
          throw new Error(`Error inserting game: ${insertError.message}`)
        }

        if (insertData && insertData.length > 0) {
          gameId = insertData[0].id
        } else {
          throw new Error("Failed to get inserted game ID")
        }
      }

      return gameId
    } catch (error) {
      // טיפול בשגיאה
      const appError: AppError = {
        code: "GAME_UPDATE_ERROR",
        message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון המשחק",
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        context: { gameData },
        retry: async () => this.addOrUpdateGame(gameData),
      }
      await errorService.handleError(appError)
      throw error
    }
  }

  /**
   * מוסיף משחק לטבלת המשחקים השבועיים
   */
  public async addGameToWeeklySchedule(weeklyGameData: WeeklyGameData): Promise<string | null> {
    // תיקוף הנתונים
    const validationResult = validateWeeklyGame(weeklyGameData)
    if (!validationResult.success) {
      await errorService.handleError({
        code: "WEEKLY_GAME_VALIDATION_ERROR",
        message: "שגיאה בתיקוף נתוני המשחק השבועי",
        severity: ErrorSeverity.WARNING,
        timestamp: new Date(),
        context: { errors: validationResult.errors, weeklyGameData },
      })
      throw new Error("שגיאה בתיקוף נתוני המשחק השבועי")
    }

    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    try {
      // בדיקה אם כבר קיימת רשומה ליום ושבוע זה
      const { data: existingData, error: existingError } = await supabase
        .from("weekly_games")
        .select("id, games")
        .eq("week", weeklyGameData.week)
        .eq("day", weeklyGameData.day)
        .maybeSingle()

      if (existingError) {
        throw new Error(`Error checking existing weekly games: ${existingError.message}`)
      }

      // הכנת אובייקט המשחק לשמירה
      const gameObject = {
        id: weeklyGameData.id || `temp_${Date.now()}`,
        game_id: weeklyGameData.game_id,
        hometeam: weeklyGameData.hometeam,
        awayteam: weeklyGameData.awayteam,
        time: weeklyGameData.time,
        league: weeklyGameData.league,
        closingtime: weeklyGameData.closingtime,
        manuallylocked: weeklyGameData.manuallylocked || false,
      }

      if (existingData) {
        // עדכון רשומה קיימת
        let games = existingData.games || []

        // אם games אינו מערך, הפוך אותו למערך
        if (!Array.isArray(games)) {
          games = []
        }

        // בדיקה אם המשחק כבר קיים במערך
        const existingGameIndex = games.findIndex(
          (g: any) => g.id === gameObject.id || (g.game_id === gameObject.game_id && gameObject.game_id),
        )

        if (existingGameIndex >= 0) {
          // עדכון משחק קיים
          games[existingGameIndex] = gameObject
        } else {
          // הוספת משחק חדש
          games.push(gameObject)
        }

        // עדכון הרשומה בבסיס הנתונים
        const { error: updateError } = await supabase
          .from("weekly_games")
          .update({
            games,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)

        if (updateError) {
          throw new Error(`Error updating weekly games: ${updateError.message}`)
        }

        return existingData.id
      } else {
        // יצירת רשומה חדשה
        const { data: insertData, error: insertError } = await supabase
          .from("weekly_games")
          .insert({
            week: weeklyGameData.week,
            day: weeklyGameData.day,
            games: [gameObject],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()

        if (insertError) {
          throw new Error(`Error inserting weekly games: ${insertError.message}`)
        }

        if (insertData && insertData.length > 0) {
          return insertData[0].id
        }
      }

      return null
    } catch (error) {
      // טיפול בשגיאה
      const appError: AppError = {
        code: "WEEKLY_GAME_UPDATE_ERROR",
        message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון המשחק השבועי",
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        context: { weeklyGameData },
        retry: async () => this.addGameToWeeklySchedule(weeklyGameData),
      }
      await errorService.handleError(appError)
      throw error
    }
  }

  /**
   * מעדכן את כל המשחקים השבועיים ליום ושבוע מסוימים
   * עובד עם מבנה הטבלה הנכון שבו games הוא שדה JSONB
   */
  public async updateWeeklyGames(week: number, day: string, games: WeeklyGameData[]): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    try {
      // בדיקה אם כבר קיימת רשומה ליום ושבוע זה
      const { data: existingData, error: existingError } = await supabase
        .from("weekly_games")
        .select("id")
        .eq("week", week)
        .eq("day", day)
        .maybeSingle()

      if (existingError) {
        throw new Error(`Error checking existing weekly games: ${existingError.message}`)
      }

      // הכנת מערך המשחקים לשמירה
      const gamesArray = games.map((game) => ({
        id: game.id || `temp_${Date.now()}`,
        game_id: game.game_id,
        hometeam: game.hometeam,
        awayteam: game.awayteam,
        time: game.time,
        league: game.league,
        closingtime: game.closingtime,
        manuallylocked: game.manuallylocked || false,
      }))

      if (existingData) {
        // עדכון רשומה קיימת
        const { error: updateError } = await supabase
          .from("weekly_games")
          .update({
            games: gamesArray,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingData.id)

        if (updateError) {
          throw new Error(`Error updating weekly games: ${updateError.message}`)
        }
      } else {
        // יצירת רשומה חדשה
        const { error: insertError } = await supabase.from("weekly_games").insert({
          week,
          day,
          games: gamesArray,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          throw new Error(`Error inserting weekly games: ${insertError.message}`)
        }
      }

      return true
    } catch (error) {
      // טיפול בשגיאה
      const appError: AppError = {
        code: "WEEKLY_GAMES_UPDATE_ERROR",
        message: error instanceof Error ? error.message : "שגיאה לא ידועה בעדכון המשחקים השבועיים",
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        context: { week, day, games },
        retry: async () => this.updateWeeklyGames(week, day, games),
      }
      await errorService.handleError(appError)
      throw error
    }
  }

  /**
   * מסנכרן את כל המשחקים השבועיים עם טבלת המשחקים
   */
  public async syncWeeklyGames(week: number): Promise<boolean> {
    const supabase = getSupabaseClient()
    if (!supabase) {
      throw new Error("Supabase client is not available")
    }

    try {
      // קבלת כל המשחקים השבועיים
      const { data: weeklyGamesData, error: weeklyError } = await supabase
        .from("weekly_games")
        .select("*")
        .eq("week", week)

      if (weeklyError) {
        throw new Error(`Error fetching weekly games: ${weeklyError.message}`)
      }

      // עדכון כל משחק שבועי עם המידע העדכני מטבלת המשחקים
      for (const weeklyGameRecord of weeklyGamesData || []) {
        // בדיקה שיש שדה games ושהוא מערך
        if (!weeklyGameRecord.games || !Array.isArray(weeklyGameRecord.games)) {
          continue
        }

        // עדכון כל משחק במערך games
        const updatedGames = await Promise.all(
          weeklyGameRecord.games.map(async (game: any) => {
            if (game.game_id) {
              // קבלת המידע העדכני מטבלת המשחקים
              const { data: gameData, error: gameError } = await supabase
                .from("games")
                .select("*")
                .eq("id", game.game_id)
                .single()

              if (gameError) {
                console.error(`Error fetching game ${game.game_id}:`, gameError)
                return game
              }

              if (gameData) {
                // עדכון המשחק עם המידע העדכני
                return {
                  ...game,
                  hometeam: gameData.hometeam,
                  awayteam: gameData.awayteam,
                  time: gameData.time,
                  league: gameData.league,
                  closingtime: gameData.closingtime,
                }
              }
            }
            return game
          }),
        )

        // עדכון הרשומה בבסיס הנתונים
        const { error: updateError } = await supabase
          .from("weekly_games")
          .update({
            games: updatedGames,
            updated_at: new Date().toISOString(),
          })
          .eq("id", weeklyGameRecord.id)

        if (updateError) {
          console.error(`Error updating weekly games ${weeklyGameRecord.id}:`, updateError)
        }
      }

      return true
    } catch (error) {
      // טיפול בשגיאה
      const appError: AppError = {
        code: "WEEKLY_GAMES_SYNC_ERROR",
        message: error instanceof Error ? error.message : "שגיאה לא ידועה בסנכרון המשחקים השבועיים",
        severity: ErrorSeverity.ERROR,
        timestamp: new Date(),
        context: { week },
        retry: async () => this.syncWeeklyGames(week),
      }
      await errorService.handleError(appError)
      return false
    }
  }
}

export const gameService = GameService.getInstance()
