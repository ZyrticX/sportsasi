-- יצירת טבלת העדפות משתמש
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(module)
);

-- יצירת אינדקס על עמודת module
CREATE INDEX IF NOT EXISTS idx_user_preferences_module ON user_preferences(module);

-- יצירת פונקציה לשמירת העדפות משתמש
CREATE OR REPLACE FUNCTION save_user_preferences(
  p_module TEXT, 
  p_preferences JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO user_preferences (module, preferences, updated_at)
  VALUES (p_module, p_preferences, NOW())
  ON CONFLICT (module) 
  DO UPDATE SET 
    preferences = p_preferences,
    updated_at = NOW();
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error saving user preferences: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות לפונקציה
GRANT EXECUTE ON FUNCTION save_user_preferences TO authenticated, anon, service_role;
