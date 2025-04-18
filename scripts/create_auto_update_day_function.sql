-- פונקציה לעדכון אוטומטי של היום הנוכחי
CREATE OR REPLACE FUNCTION auto_update_current_day()
RETURNS BOOLEAN AS $$
DECLARE
  current_system_day TEXT;
BEGIN
  -- קבלת היום הנוכחי לפי תאריך המערכת
  SELECT CASE EXTRACT(DOW FROM NOW())
    WHEN 0 THEN 'sunday'
    WHEN 1 THEN 'monday'
    WHEN 2 THEN 'tuesday'
    WHEN 3 THEN 'wednesday'
    WHEN 4 THEN 'thursday'
    WHEN 5 THEN 'friday'
    WHEN 6 THEN 'saturday'
  END INTO current_system_day;
  
  -- עדכון היום הנוכחי בטבלת ההגדרות
  UPDATE settings
  SET currentday = current_system_day, updated_at = NOW()
  WHERE id = 'global';
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating current day: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות הרצה לפונקציה
GRANT EXECUTE ON FUNCTION auto_update_current_day TO authenticated, anon, service_role;

-- יצירת טריגר שיעדכן את היום הנוכחי בחצות
-- הערה: טריגרים מבוססי זמן אינם נתמכים ישירות בפוסטגרס, לכן זה רק דוגמה
-- בפועל, יש להשתמש בשירות חיצוני כמו Supabase Edge Functions או Cron Job
/*
CREATE OR REPLACE FUNCTION update_day_at_midnight()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM auto_update_current_day();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER midnight_day_update
  AFTER UPDATE ON settings
  EXECUTE FUNCTION update_day_at_midnight();
*/
