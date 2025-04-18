import { Suspense } from "react"
import WeekSelector from "@/components/week-selector"
import WeeklyGamesManager from "@/components/weekly-games-manager"

export default function WeeksManagementPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">ניהול שבועות</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Suspense fallback={<div>טוען...</div>}>
            <WeekSelector />
          </Suspense>
        </div>

        <div className="md:col-span-2">
          <Suspense fallback={<div>טוען...</div>}>
            <WeeklyGamesManager />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
