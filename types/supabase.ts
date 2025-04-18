export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: string
          phone?: string
          city?: string
          playercode?: string
          points: number
          correctpredictions?: number
          totalpredictions?: number
          status?: string
          winner?: boolean
          weekly_points?: number
          monthly_points?: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role?: string
          phone?: string
          city?: string
          playercode?: string
          points?: number
          status?: string
        }
        Update: {
          name?: string
          email?: string
          role?: string
          phone?: string
          city?: string
          playercode?: string
          points?: number
          correctpredictions?: number
          totalpredictions?: number
          status?: string
          winner?: boolean
          weekly_points?: number
          monthly_points?: number
        }
      }
      predictions: {
        Row: {
          id: string
          userid: string
          gameid: string
          prediction: string
          points: number
          timestamp: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          userid: string
          gameid: string
          prediction: string
          points?: number
          timestamp?: string
        }
        Update: {
          prediction?: string
          points?: number
        }
      }
      games: {
        Row: {
          id: string
          hometeam: string
          awayteam: string
          time: string
          date: string
          league: string
          closingtime: string
          result?: string
          isfinished: boolean
          islocked: boolean
          week: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          hometeam: string
          awayteam: string
          time: string
          date: string
          league: string
          closingtime: string
          result?: string
          isfinished?: boolean
          islocked?: boolean
          week: number
        }
        Update: {
          hometeam?: string
          awayteam?: string
          time?: string
          date?: string
          league?: string
          closingtime?: string
          result?: string
          isfinished?: boolean
          islocked?: boolean
          week?: number
        }
      }
      weekly_games: {
        Row: {
          id: string
          week: number
          day: string
          games: Json
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          week: number
          day: string
          games: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          week?: number
          day?: string
          games?: Json
          updated_at?: string
        }
      }
      game_results: {
        Row: {
          id: string
          game_id: string
          result: string
          created_by: string
          week: number
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          game_id: string
          result: string
          created_by: string
          week: number
        }
        Update: {
          result?: string
        }
      }
      settings: {
        Row: {
          id: string
          week: number
          currentday: string
          lastreset: string
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id: string
          week: number
          currentday: string
          lastreset?: string
        }
        Update: {
          week?: number
          currentday?: string
          lastreset?: string
        }
      }
    }
    Functions: {
      add_game: {
        Args: {
          p_hometeam: string
          p_awayteam: string
          p_time: string
          p_date: string
          p_league: string
          p_closingtime: string
          p_week: number
        }
        Returns: string
      }
      add_weekly_game: {
        Args: {
          p_week: number
          p_day: string
          p_games: Json
        }
        Returns: number
      }
      create_or_update_settings: {
        Args: {
          p_id: string
          p_week: number
          p_currentday: string
        }
        Returns: string
      }
      get_weekly_games_by_day_and_week: {
        Args: {
          p_day: string
          p_week: number
        }
        Returns: Json
      }
      update_weekly_game_result: {
        Args: {
          p_id: number
          p_games: Json
        }
        Returns: boolean
      }
    }
  }
}
