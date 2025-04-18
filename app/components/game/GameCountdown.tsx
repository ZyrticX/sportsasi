"use client"

import { useEffect, useState } from "react"

interface GameCountdownProps {
  closingTime: Date | string
}

export default function GameCountdown({ closingTime }: GameCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<string>("")

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const closing = new Date(closingTime)
      const diff = closing.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft("סגור להימורים")
        return
      }

      // Calculate remaining time
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      // Format time
      if (hours > 0) {
        setTimeLeft(`${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      } else {
        setTimeLeft(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`)
      }
    }

    // Initial update
    updateCountdown()

    // Update every second
    const interval = setInterval(updateCountdown, 1000)

    return () => clearInterval(interval)
  }, [closingTime])

  return <span className="font-mono">{timeLeft}</span>
}
