import type { ReactNode } from "react"
import { type Permission, permissionService } from "@/lib/permissions"

interface PermissionGuardProps {
  permission: Permission
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  // במצב פיתוח, נאפשר גישה לכל ההרשאות
  const isDevelopment = process.env.NODE_ENV === "development"
  const hasPermission = isDevelopment || permissionService.hasPermission(permission)

  if (!hasPermission) {
    console.warn(`Permission denied: ${permission}`)
    return <>{fallback}</>
  }

  return <>{children}</>
}
