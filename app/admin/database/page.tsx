import { Suspense } from "react"
import DatabaseFixes from "@/components/database-fixes"

export default function DatabaseManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">ניהול מסד נתונים</h1>

      <div className="max-w-3xl mx-auto">
        <Suspense fallback={<div>טוען...</div>}>
          <DatabaseFixes />
        </Suspense>
      </div>
    </div>
  )
}
