"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseClient } from "@/lib/supabase/client"

export default function DatabaseFixes() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // פונקציה לתיקון כפילויות בטבלת המשתמשים
  const fixUsersDuplicates = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // בדיקת העמודות הכפולות
      const { data: duplicateColumns } = await supabase.rpc("execute_sql", {
        sql_query: `
          SELECT column_name, COUNT(*) 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          GROUP BY column_name 
          HAVING COUNT(*) > 1
        `,
      })

      // לוגיקה לתיקון הכפילויות - דוגמה בלבד
      // במציאות יש לבדוק איזו עמודה בשימוש ולהסיר את השנייה

      setResult(`נמצאו ${duplicateColumns?.length || 0} עמודות כפולות. יש לפנות למנהל המערכת לתיקון ידני.`)
    } catch (err: any) {
      setError(err.message || "אירעה שגיאה בתיקון כפילויות")
    } finally {
      setIsLoading(false)
    }
  }

  // פונקציה לתיקון מבנה הנתונים
  const fixDataStructure = async () => {
    setIsLoading(true)
    setResult(null)
    setError(null)

    try {
      const supabase = getSupabaseClient()

      // בדיקת אינדקסים חסרים
      const { data: missingIndexes } = await supabase.rpc("execute_sql", {
        sql_query: `
          SELECT
            t.relname AS table_name,
            a.attname AS column_name
          FROM
            pg_class t,
            pg_attribute a,
            pg_index ix
          WHERE
            t.oid = a.attrelid
            AND t.relkind = 'r'
            AND a.attnum > 0
            AND t.relname IN ('games', 'predictions', 'users')
            AND a.attname IN ('userid', 'gameid', 'week')
            AND NOT EXISTS (
              SELECT 1
              FROM pg_index i
              WHERE i.indrelid = t.oid
                AND a.attnum = ANY(i.indkey)
                AND i.indisunique = false
            )
        `,
      })

      // לוגיקה ליצירת אינדקסים חסרים - דוגמה בלבד

      setResult(`נמצאו ${missingIndexes?.length || 0} אינדקסים חסרים. יש לפנות למנהל המערכת לתיקון ידני.`)
    } catch (err: any) {
      setError(err.message || "אירעה שגיאה בתיקון מבנה הנתונים")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>תיקוני מסד נתונים</CardTitle>
        <CardDescription>כלים לתיקון בעיות במבנה מסד הנתונים</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={fixUsersDuplicates} disabled={isLoading}>
            {isLoading ? "מתקן..." : "תקן כפילויות בטבלת משתמשים"}
          </Button>

          <Button onClick={fixDataStructure} disabled={isLoading}>
            {isLoading ? "מתקן..." : "תקן מבנה נתונים"}
          </Button>
        </div>

        {result && (
          <Alert>
            <AlertTitle>תוצאה</AlertTitle>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
