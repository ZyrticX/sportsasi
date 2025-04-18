"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentWeek, getGamesByWeekAndDay, addWeeklyGames } from "@/lib/weeks"
import { getSupabaseClient } from "@/lib/supabase/client"

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export default function WeeklyGamesManager() {
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [selectedDay, setSelectedDay] = useState<string>("sunday")
  const [games, setGames] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)

  useEffect(() => {
    const checkAdminStatus = async () => {
      const {
        data: { session },
      } = await getSupabaseClient().auth.getSession()
      const user = session?.user

      if (user) {
        const { data } = await getSupabaseClient().from("users").select("role").eq("id", user.id).single()

        setIsAdmin(data?.role === "admin")
      }
    }

    const fetchCurrentWeek = async () => {
      const week = await getCurrentWeek()
      setCurrentWeek(week)
      setIsLoading(false)
    }

    checkAdminStatus()
    fetchCurrentWeek()
  }, [])

  useEffect(() => {
    const fetchGames = async () => {
      if (currentWeek && selectedDay) {
        setIsLoading(true)
        const gamesData = await getGamesByWeekAndDay(currentWeek, selectedDay)
        setGames(gamesData || [])
        setIsLoading(false)
      }
    }

    fetchGames()
  }, [currentWeek, selectedDay])

  const handleDayChange = (day: string) => {
    setSelectedDay(day)
  }

  const handleAddGame = () => {
    setGames([
      ...games,
      {
        id: Date.now().toString(),
        hometeam: "",
        awayteam: "",
        time: "",
        league: "",
        result: "",
        isLocked: false,
      },
    ])
  }

  const handleGameChange = (index: number, field: string, value: string) => {
    const updatedGames = [...games]
    updatedGames[index] = { ...updatedGames[index], [field]: value }
    setGames(updatedGames)
  }

  const handleRemoveGame = (index: number) => {
    const updatedGames = [...games]
    updatedGames.splice(index, 1)
    setGames(updatedGames)
  }

  const handleSaveGames = async () => {
    setIsLoading(true)

    // יצירת אובייקט המכיל את המשחקים לפי ימים
    const gamesData: Record<string, any[]> = {}
    gamesData[selectedDay] = games

    // שמירת המשחקים
    const result = await addWeeklyGames(currentWeek, gamesData)

    setIsLoading(false)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ניהול משחקים שבועיים - שבוע {currentWeek}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={selectedDay} onValueChange={handleDayChange}>
          <TabsList className="grid grid-cols-7 mb-4">
            {DAYS_OF_WEEK.map((day) => (
              <TabsTrigger key={day} value={day}>
                {day === "sunday"
                  ? "ראשון"
                  : day === "monday"
                    ? "שני"
                    : day === "tuesday"
                      ? "שלישי"
                      : day === "wednesday"
                        ? "רביעי"
                        : day === "thursday"
                          ? "חמישי"
                          : day === "friday"
                            ? "שישי"
                            : "שבת"}
              </TabsTrigger>
            ))}
          </TabsList>

          {DAYS_OF_WEEK.map((day) => (
            <TabsContent key={day} value={day} className="space-y-4">
              {isLoading ? (
                <div className="text-center py-4">טוען משחקים...</div>
              ) : (
                <>
                  {games.length === 0 ? (
                    <div className="text-center py-4">אין משחקים ליום זה</div>
                  ) : (
                    games.map((game, index) => (
                      <div key={game.id || index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <Label htmlFor={`home-${index}`}>קבוצת בית</Label>
                          <Input
                            id={`home-${index}`}
                            value={game.hometeam || ""}
                            onChange={(e) => handleGameChange(index, "hometeam", e.target.value)}
                          />
                        </div>
                        <div className="col-span-4">
                          <Label htmlFor={`away-${index}`}>קבוצת חוץ</Label>
                          <Input
                            id={`away-${index}`}
                            value={game.awayteam || ""}
                            onChange={(e) => handleGameChange(index, "awayteam", e.target.value)}
                          />
                        </div>
                        <div className="col-span-2">
                          <Label htmlFor={`time-${index}`}>שעה</Label>
                          <Input
                            id={`time-${index}`}
                            value={game.time || ""}
                            onChange={(e) => handleGameChange(index, "time", e.target.value)}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-6"
                            onClick={() => handleRemoveGame(index)}
                          >
                            הסר
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {isAdmin && (
                    <div className="flex justify-between mt-4">
                      <Button onClick={handleAddGame}>הוסף משחק</Button>
                      <Button onClick={handleSaveGames} disabled={isLoading}>
                        {isLoading ? "שומר..." : "שמור משחקים"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
