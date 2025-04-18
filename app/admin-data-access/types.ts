// טיפוסים משותפים למערכת הניהול

export interface User {
  id: string
  name: string
  phone?: string
  email?: string
  city?: string
  playercode: string
  status?: "active" | "blocked"
  points?: number
  weekly_points?: number
  monthly_points?: number
  correct_predictions?: number
  total_predictions?: number
  role?: "player" | "admin" | "super-admin"
  created_at?: string
  updated_at?: string
}

export interface Prediction {
  id: string
  userid: string
  gameid: string
  prediction: string
  points?: number
  timestamp: string
  created_at?: string
  updated_at?: string
}

export interface Game {
  id: string
  hometeam: string
  awayteam: string
  time: string
  date: string
  league: string
  closingtime: string
  isfinished?: boolean
  islocked?: boolean
  result?: string
  week?: number
  created_at?: string
  updated_at?: string
}

export interface WeeklyGame {
  id: string
  hometeam: string
  awayteam: string
  time: string
  league: string
  closingtime: string | Date
  result?: string
  isfinished?: boolean
  manuallylocked?: boolean
  game_id?: string
  day?: string
  week?: number
}

export interface WeeklyGamesRecord {
  id: string
  week: number
  day: string
  games: WeeklyGame[]
  created_at?: string
  updated_at?: string
}

export interface LeaderboardEntry {
  id: string
  userid: string
  name: string
  points: number
  weekly_points: number
  monthly_points: number
  correct_predictions: number
  total_predictions: number
  success_rate: number
  trend?: "up" | "down" | "stable"
}

export interface SystemSettings {
  id: string
  current_day: string
  current_week: number
  system_status: string
  last_reset: string
}
