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
import { validateUser } from "@/lib/validation-schemas"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface PlayerFormProps {
  onPlayerAdded?: () => void
}

export default function PlayerForm({ onPlayerAdded }: PlayerFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [errors, setErrors] = useState<Record<string, string> | null>(null)
  const [codeLength, setCodeLength] = useState<"8" | "9">("8")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    playercode: "",
    role: "user",
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

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }))
  }

  const handleCodeLengthChange = (value: "8" | "9") => {
    setCodeLength(value)
    // אם יש כבר קוד שחקן, נייצר קוד חדש באורך המבוקש
    if (formData.playercode) {
      generatePlayerCode(value)
    }
  }

  // פונקציה ליצירת קוד שחקן אוטומטי
  const generatePlayerCode = (length: "8" | "9" = codeLength) => {
    const codeDigits = length === "8" ? 8 : 9
    const min = 10 ** (codeDigits - 1)
    const max = 10 ** codeDigits - 1

    // יצירת קוד אקראי בן 8 או 9 ספרות
    const randomCode = Math.floor(min + Math.random() * (max - min + 1)).toString()
    setFormData((prev) => ({ ...prev, playercode: randomCode }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(null)
    setErrors(null)

    // תיקוף הנתונים עם Zod
    const validationResult = validateUser(formData)

    if (!validationResult.success) {
      setErrors(validationResult.errors)
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // ננסה להשתמש בפונקציה add_new_user
      const { data, error } = await supabase.rpc("add_new_user", {
        user_name: formData.name,
        user_playercode: formData.playercode,
        user_phone: formData.phone || null,
        user_city: formData.city || null,
        user_status: "active",
        user_points: 0,
      })

      if (error) {
        console.error("Error with add_new_user:", error)

        // ננסה להשתמש בפונקציה add_new_user_with_role
        const { data: roleData, error: roleError } = await supabase.rpc("add_new_user_with_role", {
          user_name: formData.name,
          user_playercode: formData.playercode,
          user_phone: formData.phone || null,
          user_city: formData.city || null,
          user_status: "active",
          user_points: 0,
          user_role: formData.role,
        })

        if (roleError) {
          console.error("Error with add_new_user_with_role:", roleError)
          throw new Error(roleError.message)
        }
      }

      // איפוס הטופס
      setFormData({
        name: "",
        email: "",
        phone: "",
        city: "",
        playercode: "",
        role: "user",
      })

      setSuccess(`המשתמש ${formData.name} נוסף בהצלחה`)

      // קריאה לפונקציית הרענון שהועברה כפרופ
      if (onPlayerAdded) {
        onPlayerAdded()
      }
    } catch (error: any) {
      setErrors({ _general: error.message || "אירעה שגיאה בהוספת המשתמש" })
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
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={errors?.name ? "border-red-500" : ""}
              />
              {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">אימייל (אופציונלי)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={errors?.email ? "border-red-500" : ""}
              />
              {errors?.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={errors?.phone ? "border-red-500" : ""}
              />
              {errors?.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">עיר</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={errors?.city ? "border-red-500" : ""}
              />
              {errors?.city && <p className="text-red-500 text-sm">{errors.city}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>אורך קוד שחקן</Label>
              <RadioGroup
                value={codeLength}
                onValueChange={(value) => handleCodeLengthChange(value as "8" | "9")}
                className="flex space-x-4 rtl:space-x-reverse"
              >
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="8" id="code-8" />
                  <Label htmlFor="code-8">8 ספרות</Label>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <RadioGroupItem value="9" id="code-9" />
                  <Label htmlFor="code-9">9 ספרות</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="playercode">קוד שחקן (8-9 ספרות)</Label>
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Input
                  id="playercode"
                  name="playercode"
                  value={formData.playercode}
                  onChange={handleChange}
                  className={errors?.playercode ? "border-red-500" : ""}
                  minLength={8}
                  maxLength={9}
                  pattern="\d{8,9}"
                />
                <Button type="button" onClick={() => generatePlayerCode()} className="whitespace-nowrap">
                  צור קוד
                </Button>
              </div>
              {errors?.playercode && <p className="text-red-500 text-sm">{errors.playercode}</p>}
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
