import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const week = searchParams.get("week")

    if (!week) {
      return NextResponse.json({ error: "Week parameter is required" }, { status: 400 })
    }

    const supabase = getSupabaseServer()

    // קבלת סטטיסטיקות שבועיות
    const { data: weeklyStats, error: statsError } = await supabase
      .from("predictions")
      .select(`
       id,
       points,
       users!inner(id, name),
       games!inner(week, hometeam, awayteam)
     `)
      .eq("games.week", week)

    if (statsError) {
      console.error("Error fetching weekly stats:", statsError)
      return NextResponse.json({ error: "Failed to fetch weekly stats" }, { status: 500 })
    }

    // עיבוד הנתונים לפורמט הרצוי
    const processedStats = processWeeklyStats(weeklyStats)

    return NextResponse.json({ data: processedStats })
  } catch (error) {
    console.error("Error in weekly stats API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function processWeeklyStats(stats: any[]) {
  // עיבוד הנתונים לפורמט הרצוי - דוגמה בלבד
  const userStats: Record<string, any> = {}

  stats.forEach((prediction) => {
    const userId = prediction.users.id
    const userName = prediction.users.name

    if (!userStats[userId]) {
      userStats[userId] = {
        name: userName,
        totalPoints: 0,
        correctPredictions: 0,
        totalPredictions: 0,
      }
    }

    userStats[userId].totalPoints += prediction.points || 0
    userStats[userId].totalPredictions += 1
    if (prediction.points > 0) {
      userStats[userId].correctPredictions += 1
    }
  })

  return Object.values(userStats).sort((a: any, b: any) => b.totalPoints - a.totalPoints)
}
