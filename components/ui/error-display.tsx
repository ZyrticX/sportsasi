"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"
import { type AppError, ErrorSeverity } from "@/lib/error-handling"

interface ErrorDisplayProps {
  error: AppError | null
  onRetry?: () => void
  onDismiss?: () => void
}

export function ErrorDisplay({ error, onRetry, onDismiss }: ErrorDisplayProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    setIsRetrying(false)
  }, [error])

  if (!error) return null

  const handleRetry = async () => {
    if (!error.retry && !onRetry) return

    setIsRetrying(true)
    try {
      if (error.retry) {
        await error.retry()
      } else if (onRetry) {
        await onRetry()
      }
    } catch (e) {
      console.error("Retry failed:", e)
    } finally {
      setIsRetrying(false)
    }
  }

  // קביעת סוג ההתראה לפי חומרת השגיאה
  const getAlertVariant = () => {
    switch (error.severity) {
      case ErrorSeverity.INFO:
        return "default"
      case ErrorSeverity.WARNING:
        return "warning"
      case ErrorSeverity.ERROR:
      case ErrorSeverity.CRITICAL:
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <Alert variant={getAlertVariant()} className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {error.severity === ErrorSeverity.INFO && "מידע"}
        {error.severity === ErrorSeverity.WARNING && "אזהרה"}
        {error.severity === ErrorSeverity.ERROR && "שגיאה"}
        {error.severity === ErrorSeverity.CRITICAL && "שגיאה קריטית"}
      </AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <div className="flex justify-end mt-2 space-x-2 rtl:space-x-reverse">
        {(error.retry || onRetry) && (
          <Button variant="outline" size="sm" onClick={handleRetry} disabled={isRetrying}>
            {isRetrying ? <RefreshCw className="h-4 w-4 animate-spin" /> : "נסה שוב"}
          </Button>
        )}
        {onDismiss && (
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            סגור
          </Button>
        )}
      </div>
    </Alert>
  )
}
