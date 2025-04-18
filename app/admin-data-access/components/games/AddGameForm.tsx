"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { validateGame, validateGameBusinessRules } from "@/lib/validation-schemas"

export default function AddGameForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string> | null>(null)
  const [formData, setFormData] = useState({
    hometeam: "",
    awayteam: "",
    time: "",
    date: "",
    league: "",
    closingtime: "",
    week: 1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // נקה שגיאות כאשר המשתמש מתחיל להקליד
    if (errors && errors[name]) {
      const newErrors = { ...errors }
      delete newErrors[name]
      setErrors(Object.keys(newErrors).length > 0 ? newErrors : null)
    }
  }

  const handleWeekChange = (value: string) => {
    setFormData((prev) => ({ ...prev, week: Number.parseInt(value) }))
  }

  const handleLeagueChange = (value: string) => {
    setFormData((prev) => ({ ...prev, league: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)
    setErrors(null)

    // תיקוף הנתונים עם Zod
    const validationResult = validateGame(formData)

    if (!validationResult.success) {
      setErrors(validationResult.errors)
      setIsLoading(false)
      return
    }

    // בדיקות עסקיות נוספות
    const businessRulesResult = validateGameBusinessRules(formData)

    if (!businessRulesResult.success) {
      setErrors(businessRulesResult.errors)
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // הוספת המשחק למסד הנתונים
      const { data, error } = await supabase
        .from("games")
        .insert({
          hometeam: formData.hometeam,
          awayteam: formData.awayteam,
          time: formData.time,
          date: formData.date,
          league: formData.league,
          closingtime: formData.closingtime,
          week: formData.week,
          isfinished: false,
          islocked: false,
        })
        .select()

      if (error) {
        throw new Error(`Error adding game: ${error.message}`)
      }

      // איפוס הטופס
      setFormData({
        hometeam: "",
        awayteam: "",
        time: "",
        date: "",
        league: "",
        closingtime: "",
        week: 1,
      })

      setSuccess(`המשחק ${formData.hometeam} נגד ${formData.awayteam} נוסף בהצלחה`)
    } catch (error: any) {
      setErrors({ _general: error.message || "אירעה שגיאה בהוספת המשחק" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הוספת משחק חדש</CardTitle>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">הצלחה</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        {errors && errors._general && (
          <Alert className="mb-4 bg-red-50 border-red-200" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{errors._general}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hometeam">קבוצת בית</Label>
              <Input
                id="hometeam"
                name="hometeam"
                value={formData.hometeam}
                onChange={handleChange}
                className={errors?.hometeam ? "border-red-500" : ""}
              />
              {errors?.hometeam && <p className="text-red-500 text-sm">{errors.hometeam}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="awayteam">קבוצת חוץ</Label>
              <Input
                id="awayteam"
                name="awayteam"
                value={formData.awayteam}
                onChange={handleChange}
                className={errors?.awayteam ? "border-red-500" : ""}
              />
              {errors?.awayteam && <p className="text-red-500 text-sm">{errors.awayteam}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">תאריך</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={errors?.date ? "border-red-500" : ""}
              />
              {errors?.date && <p className="text-red-500 text-sm">{errors.date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">שעה</Label>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className={errors?.time ? "border-red-500" : ""}
              />
              {errors?.time && <p className="text-red-500 text-sm">{errors.time}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="league">ליגה</Label>
              <Select value={formData.league} onValueChange={handleLeagueChange}>
                <SelectTrigger id="league" className={errors?.league ? "border-red-500" : ""}>
                  <SelectValue placeholder="בחר ליגה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ליגת העל">ליגת העל</SelectItem>
                  <SelectItem value="ליגה לאומית">ליגה לאומית</SelectItem>
                  <SelectItem value="ליגת אלופות">ליגת אלופות</SelectItem>
                  <SelectItem value="ליגה אירופית">ליגה אירופית</SelectItem>
                  <SelectItem value="פרמייר ליג">פרמייר ליג</SelectItem>
                  <SelectItem value="לה ליגה">לה ליגה</SelectItem>
                  <SelectItem value="סריה א">סריה א</SelectItem>
                  <SelectItem value="בונדסליגה">בונדסליגה</SelectItem>
                </SelectContent>
              </Select>
              {errors?.league && <p className="text-red-500 text-sm">{errors.league}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="closingtime">זמן סגירה להימורים</Label>
              <Input
                id="closingtime"
                name="closingtime"
                type="datetime-local"
                value={formData.closingtime}
                onChange={handleChange}
                className={errors?.closingtime ? "border-red-500" : ""}
              />
              {errors?.closingtime && <p className="text-red-500 text-sm">{errors.closingtime}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="week">שבוע</Label>
              <Select value={formData.week.toString()} onValueChange={handleWeekChange}>
                <SelectTrigger id="week" className={errors?.week ? "border-red-500" : ""}>
                  <SelectValue placeholder="בחר שבוע" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 38 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      שבוע {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors?.week && <p className="text-red-500 text-sm">{errors.week}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "מוסיף משחק..." : "הוסף משחק"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
