-- פונקציה לעדכון משחקים שבועיים שעוקפת את מדיניות ה-RLS
CREATE OR REPLACE FUNCTION update_weekly_games_bypass_rls(
  p_week INTEGER,
  p_day TEXT,
  p_games JSONB
) RETURNS BOOLEAN AS $$
DECLARE
  v_id UUID;
BEGIN
  -- בדיקה אם כבר קיימת רשומה ליום ושבוע זה
  SELECT id INTO v_id
  FROM weekly_games
  WHERE week = p_week AND day = p_day;
  
  -- אם קיימת רשומה, עדכן אותה
  IF v_id IS NOT NULL THEN
    UPDATE weekly_games
    SET 
      games = p_games,
      updated_at = NOW()
    WHERE id = v_id;
  -- אחרת, צור רשומה חדשה
  ELSE
    INSERT INTO weekly_games (
      week,
      day,
      games,
      created_at,
      updated_at
    ) VALUES (
      p_week,
      p_day,
      p_games,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating weekly games: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות הרצה לפונקציה
GRANT EXECUTE ON FUNCTION update_weekly_games_bypass_rls TO authenticated, anon, service_role;
