"use client"

import { getSupabaseClient } from "./supabase/client"
import type { Database } from "@/types/supabase"

type WeeklyGames = Database["public"]["Tables"]["weekly_games"]["Row"]
type Settings = Database["public"]["Tables"]["settings"]["Row"]

// פונקציה לקבלת השבוע הנוכחי מהגדרות המערכת
export async function getCurrentWeek(): Promise<number> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("settings").select("week").single()

  if (error) {
    console.error("Error fetching current week:", error)
    return 1 // ברירת מחדל אם יש שגיאה
  }

  return data?.week || 1
}

// פונקציה לעדכון השבוע הנוכחי
export async function updateCurrentWeek(week: number): Promise<boolean> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.rpc("create_or_update_settings", {
    p_id: "global",
    p_week: week,
    p_currentday: "sunday", // ברירת מחדל
  })

  if (error) {
    console.error("Error updating current week:", error)
    return false
  }

  return true
}

// פונקציה לקבלת משחקים לפי שבוע ויום - מותאמת למבנה החדש
export async function getGamesByWeekAndDay(week: number, day: string): Promise<any[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("weekly_games").select("*").eq("week", week).eq("day", day).single()

  if (error) {
    console.error("Error fetching games by week and day:", error)
    return []
  }

  // החזרת מערך המשחקים מתוך שדה games
  if (data && data.games && Array.isArray(data.games)) {
    return data.games
  }

  return []
}

// פונקציה להוספת משחקים שבועיים - מותאמת למבנה החדש
export async function addWeeklyGames(week: number, day: string, games: any[]): Promise<number | null> {
  const supabase = getSupabaseClient()

  // בדיקה אם כבר קיימת רשומה ליום ושבוע זה
  const { data: existingData, error: existingError } = await supabase
    .from("weekly_games")
    .select("id")
    .eq("week", week)
    .eq("day", day)
    .maybeSingle()

  if (existingError) {
    console.error("Error checking existing weekly games:", existingError)
    return null
  }

  if (existingData) {
    // עדכון רשומה קיימת
    const { error: updateError } = await supabase
      .from("weekly_games")
      .update({
        games,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingData.id)

    if (updateError) {
      console.error("Error updating weekly games:", updateError)
      return null
    }

    return existingData.id
  } else {
    // יצירת רשומה חדשה
    const { data: insertData, error: insertError } = await supabase
      .from("weekly_games")
      .insert({
        week,
        day,
        games,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (insertError) {
      console.error("Error inserting weekly games:", insertError)
      return null
    }

    if (insertData && insertData.length > 0) {
      return insertData[0].id
    }
  }

  return null
}

// פונקציה לעדכון תוצאות משחקים שבועיים - מותאמת למבנה החדש
export async function updateWeeklyGameResults(id: number, day: string, week: number, games: any[]): Promise<boolean> {
  const supabase = getSupabaseClient()

  // בדיקה אם קיימת רשומה עם המזהה הנתון
  const { data: existingData, error: existingError } = await supabase
    .from("weekly_games")
    .select("id, games")
    .eq("id", id)
    .single()

  if (existingError) {
    console.error("Error checking existing weekly games:", existingError)
    return false
  }

  if (existingData) {
    // עדכון רשומה קיימת
    const { error: updateError } = await supabase
      .from("weekly_games")
      .update({
        games,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (updateError) {
      console.error("Error updating weekly game results:", updateError)
      return false
    }

    return true
  }

  return false
}

// פונקציה לקבלת כל המשחקים לפי שבוע
export async function getGamesByWeek(week: number): Promise<any[]> {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("games").select("*").eq("week", week).order("date", { ascending: true })

  if (error) {
    console.error("Error fetching games by week:", error)
    return []
  }

  return data || []
}
