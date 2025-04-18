import { Suspense } from "react"
import WeeklyStats from "@/components/weekly-stats"

export default function StatsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">סטטיסטיקות</h1>

      <div className="max-w-4xl mx-auto">
        <Suspense fallback={<div>טוען...</div>}>
          <WeeklyStats />
        </Suspense>
      </div>
    </div>
  )
}
