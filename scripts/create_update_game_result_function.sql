-- פונקציה לעדכון תוצאת משחק וחישוב נקודות
CREATE OR REPLACE FUNCTION update_game_result(
  game_id UUID,
  game_result TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_game RECORD;
  v_prediction RECORD;
  v_points INTEGER;
  v_is_saturday BOOLEAN;
BEGIN
  -- בדיקה אם המשחק קיים
  SELECT * INTO v_game FROM games WHERE id = game_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game with ID % not found', game_id;
  END IF;
  
  -- בדיקה אם המשחק כבר ננעל
  IF v_game.islocked OR v_game.isfinished THEN
    RAISE EXCEPTION 'Game is already locked or finished';
  END IF;
  
  -- בדיקה אם התוצאה תקינה
  IF game_result NOT IN ('1', 'X', '2') THEN
    RAISE EXCEPTION 'Invalid result. Must be 1, X, or 2';
  END IF;
  
  -- בדיקה אם המשחק הוא ביום שבת
  v_is_saturday := EXTRACT(DOW FROM v_game.date) = 6; -- 6 = Saturday
  
  -- עדכון תוצאת המשחק
  UPDATE games
  SET 
    result = game_result,
    isfinished = TRUE,
    islocked = TRUE,
    updated_at = NOW()
  WHERE id = game_id;
  
  -- חישוב נקודות לכל הניחושים
  FOR v_prediction IN 
    SELECT * FROM predictions WHERE gameid = game_id
  LOOP
    -- חישוב נקודות - ניחוש נכון מקבל 1 נקודה, או 2 נקודות אם זה משחק שבת
    IF v_prediction.prediction = game_result THEN
      v_points := CASE WHEN v_is_saturday THEN 2 ELSE 1 END;
      
      -- עדכון הניחוש עם הנקודות
      UPDATE predictions
      SET points = v_points
      WHERE id = v_prediction.id;
      
      -- עדכון נקודות המשתמש
      UPDATE users
      SET 
        points = COALESCE(points, 0) + v_points,
        weekly_points = COALESCE(weekly_points, 0) + v_points,
        monthly_points = COALESCE(monthly_points, 0) + v_points,
        correct_predictions = COALESCE(correct_predictions, 0) + 1,
        updated_at = NOW()
      WHERE id = v_prediction.userid;
      
      -- הוספת רשומה להיסטוריית הנקודות
      INSERT INTO point_history (
        user_id,
        points_change,
        points_type,
        reason,
        game_id,
        prediction_id,
        metadata
      ) VALUES (
        v_prediction.userid,
        v_points,
        'total',
        'prediction',
        game_id,
        v_prediction.id,
        jsonb_build_object(
          'game', jsonb_build_object(
            'hometeam', v_game.hometeam,
            'awayteam', v_game.awayteam,
            'result', game_result
          ),
          'prediction', v_prediction.prediction,
          'is_saturday', v_is_saturday
        )
      );
    ELSE
      -- עדכון הניחוש עם 0 נקודות
      UPDATE predictions
      SET points = 0
      WHERE id = v_prediction.id;
    END IF;
  END LOOP;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating game result: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות הרצה לפונקציה
GRANT EXECUTE ON FUNCTION update_game_result TO authenticated;
