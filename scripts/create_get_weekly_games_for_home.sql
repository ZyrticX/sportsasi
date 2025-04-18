-- פונקציה לקבלת משחקים שבועיים לפי יום ושבוע בפורמט שדף הבית מצפה לו
CREATE OR REPLACE FUNCTION get_weekly_games_for_home(
  p_week INTEGER,
  p_day TEXT
) RETURNS JSONB AS $$
DECLARE
  v_games JSONB;
BEGIN
  -- קבלת המשחקים מהטבלה
  SELECT games INTO v_games
  FROM weekly_games
  WHERE week = p_week AND day = p_day;
  
  -- אם לא נמצאו משחקים, החזר מערך ריק
  IF v_games IS NULL THEN
    RETURN '[]'::JSONB;
  END IF;
  
  RETURN v_games;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות הרצה לפונקציה
GRANT EXECUTE ON FUNCTION get_weekly_games_for_home TO authenticated, anon, service_role;
