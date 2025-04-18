"use client"

interface UserStatsProps {
  currentDateTime: string
  currentWeek: number
  userName: string
}

export default function UserStats({ currentDateTime, currentWeek, userName }: UserStatsProps) {
  return (
    <div className="bg-white text-gray-800 p-8 rounded-lg shadow-md mb-8 border border-gray-200 text-center">
      <h1 className="text-3xl font-bold mb-4 text-center text-navy-600">ברוכים הבאים</h1>
      <h2 className="text-4xl font-bold mb-6 text-center text-olive-600">ניחושים בין החברים</h2>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <p className="text-xl text-center text-gray-600 bg-gray-100 py-2 px-4 rounded-full">{currentDateTime}</p>
        <p className="text-xl text-center text-white bg-navy-600 py-2 px-4 rounded-full">
          שבוע {currentWeek ? currentWeek.toString() : "1"}
        </p>
      </div>
      {userName && (
        <div className="mt-4 text-lg text-center text-gray-700">
          שלום, <span className="font-bold">{userName}</span>
        </div>
      )}
    </div>
  )
}
