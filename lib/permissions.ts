import { getSupabaseClient } from "./supabase"

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  SUPER_ADMIN = "super-admin",
}

export enum Permission {
  VIEW_GAMES = "view_games",
  EDIT_GAMES = "edit_games",
  DELETE_GAMES = "delete_games",
  VIEW_USERS = "view_users",
  EDIT_USERS = "edit_users",
  DELETE_USERS = "delete_users",
  VIEW_PREDICTIONS = "view_predictions",
  EDIT_PREDICTIONS = "edit_predictions",
  DELETE_PREDICTIONS = "delete_predictions",
  MANAGE_SYSTEM = "manage_system",
}

// מיפוי הרשאות לפי תפקיד
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [Permission.VIEW_GAMES, Permission.VIEW_PREDICTIONS],
  [UserRole.ADMIN]: [
    Permission.VIEW_GAMES,
    Permission.EDIT_GAMES,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.VIEW_PREDICTIONS,
    Permission.EDIT_PREDICTIONS,
  ],
  [UserRole.SUPER_ADMIN]: [
    Permission.VIEW_GAMES,
    Permission.EDIT_GAMES,
    Permission.DELETE_GAMES,
    Permission.VIEW_USERS,
    Permission.EDIT_USERS,
    Permission.DELETE_USERS,
    Permission.VIEW_PREDICTIONS,
    Permission.EDIT_PREDICTIONS,
    Permission.DELETE_PREDICTIONS,
    Permission.MANAGE_SYSTEM,
  ],
}

export class PermissionService {
  private static instance: PermissionService
  private userRole: UserRole | null = null
  private userPermissions: Set<Permission> = new Set()

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService()
    }
    return PermissionService.instance
  }

  public async loadUserPermissions(userId: string): Promise<Set<Permission>> {
    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Supabase client is not available")
      }

      // קבלת תפקיד המשתמש
      const { data, error } = await supabase.from("users").select("role").eq("id", userId).single()

      if (error) {
        throw new Error(`Error fetching user role: ${error.message}`)
      }

      // המרת התפקיד למבנה הנכון
      let role: UserRole
      if (!data || !data.role || !Object.values(UserRole).includes(data.role as UserRole)) {
        // אם אין תפקיד או שהתפקיד לא תקין, נגדיר כמשתמש רגיל
        role = UserRole.USER
        console.warn(`User ${userId} has no valid role, defaulting to USER`)
      } else {
        role = data.role as UserRole
      }
      this.userRole = role

      // קבלת ההרשאות לפי התפקיד
      this.userPermissions = new Set(rolePermissions[role])

      return this.userPermissions
    } catch (error) {
      console.error("Error loading user permissions:", error)
      // ברירת מחדל - הרשאות משתמש רגיל
      this.userRole = UserRole.USER
      this.userPermissions = new Set(rolePermissions[UserRole.USER])
      return this.userPermissions
    }
  }

  public hasPermission(permission: Permission): boolean {
    // בסביבת פיתוח, נאפשר גישה לכל ההרשאות
    if (process.env.NODE_ENV === "development") {
      return true
    }

    // בסביבת ייצור, נבדוק אם יש למשתמש את ההרשאה
    return this.userPermissions.has(permission)
  }

  public getUserRole(): UserRole | null {
    return this.userRole
  }

  public logAction(action: string, details: Record<string, any>): void {
    // יישום תיעוד פעולות
    console.log(`[ACTION LOG] ${action}:`, details)

    // כאן אפשר להוסיף שמירה של הפעולה בבסיס הנתונים
    try {
      const supabase = getSupabaseClient()
      if (supabase) {
        supabase
          .from("action_logs")
          .insert({
            action,
            details,
            user_id: details.userId || null,
            created_at: new Date().toISOString(),
          })
          .then(({ error }) => {
            if (error) {
              console.error("Error logging action:", error)
            }
          })
      }
    } catch (error) {
      console.error("Error logging action:", error)
    }
  }

  public initializeDefaultPermissions(): void {
    // במצב פיתוח, נגדיר הרשאות מנהל כברירת מחדל
    if (process.env.NODE_ENV === "development") {
      console.log("Initializing default ADMIN permissions for development")
      this.userRole = UserRole.ADMIN
      this.userPermissions = new Set(rolePermissions[UserRole.ADMIN])
    } else {
      // במצב ייצור, נגדיר הרשאות משתמש רגיל כברירת מחדל
      this.userRole = UserRole.USER
      this.userPermissions = new Set(rolePermissions[UserRole.USER])
    }
  }

  public setUserPermissions(permissions: Set<Permission>): void {
    this.userPermissions = permissions
  }

  // הוסף גם פונקציה לקבלת ההרשאות הנוכחיות
  public getUserPermissions(): Permission[] {
    return Array.from(this.userPermissions)
  }
}

export const permissionService = PermissionService.getInstance()
