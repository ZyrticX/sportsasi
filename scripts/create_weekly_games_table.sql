-- בדיקה אם הטבלה כבר קיימת
CREATE TABLE IF NOT EXISTS weekly_games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  hometeam VARCHAR(100) NOT NULL,
  awayteam VARCHAR(100) NOT NULL,
  league VARCHAR(100),
  closingtime TIMESTAMP NOT NULL,
  isfinished BOOLEAN DEFAULT FALSE,
  islocked BOOLEAN DEFAULT FALSE,
  manuallylocked BOOLEAN DEFAULT FALSE,
  result VARCHAR(10),
  week INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת אינדקסים לשיפור ביצועים
CREATE INDEX IF NOT EXISTS idx_weekly_games_day ON weekly_games(day);
CREATE INDEX IF NOT EXISTS idx_weekly_games_week ON weekly_games(week);
CREATE INDEX IF NOT EXISTS idx_weekly_games_date ON weekly_games(date);

-- יצירת פונקציית RPC להוספת משחק שבועי
CREATE OR REPLACE FUNCTION add_weekly_game(
  p_day VARCHAR(20),
  p_date DATE,
  p_time TIME,
  p_hometeam VARCHAR(100),
  p_awayteam VARCHAR(100),
  p_league VARCHAR(100),
  p_closingtime TIMESTAMP,
  p_week INTEGER
) RETURNS UUID AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO weekly_games (
    day, date, time, hometeam, awayteam, league, closingtime, week
  ) VALUES (
    p_day, p_date, p_time, p_hometeam, p_awayteam, p_league, p_closingtime, p_week
  ) RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת פונקציית RPC לעדכון תוצאת משחק
CREATE OR REPLACE FUNCTION update_weekly_game_result(
  p_game_id UUID,
  p_result VARCHAR(10)
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE weekly_games
  SET result = p_result, isfinished = TRUE, updated_at = NOW()
  WHERE id = p_game_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת פונקציית RPC לנעילת/פתיחת משחק
CREATE OR REPLACE FUNCTION toggle_weekly_game_lock(
  p_game_id UUID,
  p_locked BOOLEAN
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE weekly_games
  SET manuallylocked = p_locked, updated_at = NOW()
  WHERE id = p_game_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- יצירת פונקציית RPC לקבלת משחקים לפי יום ושבוע
CREATE OR REPLACE FUNCTION get_weekly_games_by_day_and_week(
  p_day VARCHAR(20),
  p_week INTEGER
) RETURNS SETOF weekly_games AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM weekly_games
  WHERE day = p_day AND week = p_week
  ORDER BY time;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
