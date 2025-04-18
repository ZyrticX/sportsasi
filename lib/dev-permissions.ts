import { permissionService, Permission } from "./permissions"

/**
 * פונקציה לבדיקת הרשאות במצב פיתוח
 * משמשת לדיבוג ופתרון בעיות הרשאה
 */
export function checkDevelopmentPermissions() {
  // רק במצב פיתוח
  if (process.env.NODE_ENV !== "development") {
    return
  }

  console.group("Development Permissions Check")

  // בדיקת תפקיד נוכחי
  const currentRole = permissionService.getUserRole()
  console.log(`Current Role: ${currentRole}`)

  // בדיקת הרשאות
  console.log("Permissions:")
  Object.values(Permission).forEach((permission) => {
    const hasPermission = permissionService.hasPermission(permission)
    console.log(`- ${permission}: ${hasPermission ? "✅" : "❌"}`)
  })

  // אתחול הרשאות ברירת מחדל אם אין תפקיד
  if (!currentRole) {
    console.log("No role detected, initializing default permissions")
    permissionService.initializeDefaultPermissions()
    console.log(`New Role: ${permissionService.getUserRole()}`)
  }

  console.groupEnd()
}

/**
 * פונקציה לאכיפת הרשאות מנהל במצב פיתוח
 * משמשת לעקיפת בדיקות הרשאה במצב פיתוח
 */
export function enforceAdminPermissions() {
  // רק במצב פיתוח
  if (process.env.NODE_ENV !== "development") {
    return
  }

  console.log("Enforcing ADMIN permissions for development")
  permissionService.initializeDefaultPermissions()
}
