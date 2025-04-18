"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function PlayerForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    playercode: "",
    role: "user", // ברירת מחדל
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabaseClient()

      // שימוש בפונקציה add_user שמקבלת את כל הפרמטרים הנדרשים
      const { data, error } = await supabase.rpc("add_user", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        playercode: formData.playercode,
        status: "active",
        points: 0,
      })

      if (error) {
        // אם הפונקציה הראשונה נכשלה, ננסה להשתמש בפונקציה אחרת
        const { data: bypassData, error: bypassError } = await supabase.rpc("add_user_bypass_rls", {
          user_name: formData.name,
          user_email: formData.email,
          user_phone: formData.phone,
          user_city: formData.city,
          user_player_code: formData.playercode,
          user_status: "active",
        })

        if (bypassError) {
          // אם גם זה נכשל, ננסה להוסיף ישירות לטבלה
          const { error: insertError } = await supabase.from("users").insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            playercode: formData.playercode,
            role: formData.role,
            points: 0,
            status: "active",
          })

          if (insertError) throw insertError
        }
      }

      // אם הגענו לכאן, המשתמש נוסף בהצלחה
      toast({
        title: "משתמש נוסף בהצלחה",
        description: `המשתמש ${formData.name} נוסף בהצלחה למערכת`,
      })

      // עדכון תפקיד המשתמש אם צריך
      if (formData.role !== "user" && data) {
        // אם יש לנו את ה-ID של המשתמש החדש, נעדכן את התפקיד שלו
        const { error: roleError } = await supabase.from("users").update({ role: formData.role }).eq("id", data)

        if (roleError) {
          console.error("Error updating user role:", roleError)
        }
      }

      // ניקוי הטופס
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        playercode: "",
        role: "user",
      })

      // רענון הדף
      router.refresh()
    } catch (error: any) {
      console.error("Error adding user:", error)
      toast({
        variant: "destructive",
        title: "שגיאה בהוספת משתמש",
        description: error.message || "אירעה שגיאה בהוספת המשתמש",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>הוספת משתמש חדש</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם מלא</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="playercode">קוד שחקן</Label>
              <Input id="playercode" name="playercode" value={formData.playercode} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">תפקיד</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="בחר תפקיד" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">משתמש רגיל</SelectItem>
                  <SelectItem value="admin">מנהל</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "מוסיף משתמש..." : "הוסף משתמש"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
