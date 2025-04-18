-- בדיקה אם טבלת settings קיימת
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  currentday TEXT NOT NULL,
  week INTEGER NOT NULL,
  lastreset TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- הוספת רשומה ראשונית אם לא קיימת
INSERT INTO settings (id, currentday, week, lastreset)
VALUES ('global', 'friday', 1, NOW())
ON CONFLICT (id) DO NOTHING;

-- עדכון היום הנוכחי לפי התאריך שצוין (18/04/2025 - יום שישי)
UPDATE settings
SET currentday = 'friday', updated_at = NOW()
WHERE id = 'global';

-- פונקציה לקבלת היום הנוכחי
CREATE OR REPLACE FUNCTION get_current_system_day()
RETURNS TEXT AS $$
DECLARE
  v_day TEXT;
BEGIN
  SELECT currentday INTO v_day FROM settings WHERE id = 'global';
  
  IF v_day IS NULL THEN
    -- אם אין ערך בטבלה, החזר את היום הנוכחי לפי תאריך המערכת
    RETURN CASE EXTRACT(DOW FROM NOW())
      WHEN 0 THEN 'sunday'
      WHEN 1 THEN 'monday'
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
    END;
  END IF;
  
  RETURN v_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות הרצה לפונקציה
GRANT EXECUTE ON FUNCTION get_current_system_day TO authenticated, anon, service_role;
