-- עדכון טבלת WEEKLY_GAMES כדי להוסיף מפתח זר לטבלת GAMES
ALTER TABLE weekly_games 
ADD COLUMN IF NOT EXISTS game_id UUID REFERENCES games(id) ON UPDATE CASCADE ON DELETE SET NULL;

-- יצירת אינדקס על עמודת game_id
CREATE INDEX IF NOT EXISTS idx_weekly_games_game_id ON weekly_games(game_id);

-- יצירת טריגר שיעדכן את weekly_games כאשר משחק מתעדכן ב-games
CREATE OR REPLACE FUNCTION update_weekly_games_on_game_update()
RETURNS TRIGGER AS $$
BEGIN
  -- עדכון כל הרשומות ב-weekly_games שמפנות למשחק שהתעדכן
  UPDATE weekly_games
  SET 
    hometeam = NEW.hometeam,
    awayteam = NEW.awayteam,
    time = NEW.time,
    league = NEW.league,
    closingtime = NEW.closingtime,
    updated_at = NOW()
  WHERE game_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- בדיקה אם הטריגר כבר קיים
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'games_update_trigger'
  ) THEN
    CREATE TRIGGER games_update_trigger
    AFTER UPDATE ON games
    FOR EACH ROW
    EXECUTE FUNCTION update_weekly_games_on_game_update();
  END IF;
END $$;

-- יצירת View שמשלב מידע מטבלאות GAMES ו-WEEKLY_GAMES
CREATE OR REPLACE VIEW weekly_games_view AS
SELECT 
  wg.id AS weekly_game_id,
  g.id AS game_id,
  wg.day,
  wg.week,
  COALESCE(wg.hometeam, g.hometeam) AS hometeam,
  COALESCE(wg.awayteam, g.awayteam) AS awayteam,
  COALESCE(wg.time, g.time) AS time,
  g.date,
  COALESCE(wg.league, g.league) AS league,
  COALESCE(wg.closingtime, g.closingtime) AS closingtime,
  g.isfinished,
  g.result,
  wg.manuallylocked,
  wg.created_at,
  wg.updated_at
FROM 
  weekly_games wg
LEFT JOIN 
  games g ON wg.game_id = g.id;

-- פונקציה לקבלת משחקים שבועיים לפי יום ושבוע
CREATE OR REPLACE FUNCTION get_weekly_games_view(p_day TEXT, p_week INTEGER)
RETURNS TABLE (
  weekly_game_id UUID,
  game_id UUID,
  day TEXT,
  week INTEGER,
  hometeam TEXT,
  awayteam TEXT,
  time TEXT,
  date TIMESTAMP WITH TIME ZONE,
  league TEXT,
  closingtime TEXT,
  isfinished BOOLEAN,
  result TEXT,
  manuallylocked BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM weekly_games_view
  WHERE day = p_day AND week = p_week
  ORDER BY time;
END;
$$ LANGUAGE plpgsql;

-- יצירת טבלת לוגים לשגיאות
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת לוגים לפעולות
CREATE TABLE IF NOT EXISTS action_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  details JSONB,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- יצירת טבלת התראות למנהל
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  context JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
