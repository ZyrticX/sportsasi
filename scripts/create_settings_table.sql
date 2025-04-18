-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY,
  current_day TEXT,
  current_week INTEGER,
  system_status TEXT,
  last_reset TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO settings (id, current_day, current_week, system_status, last_reset)
VALUES ('1', 'sunday', 1, 'active', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create function to update settings
CREATE OR REPLACE FUNCTION update_settings(
  p_id TEXT,
  p_settings JSONB
) RETURNS BOOLEAN AS $$
BEGIN
  UPDATE settings
  SET 
    current_day = COALESCE(p_settings->>'current_day', current_day),
    current_week = COALESCE((p_settings->>'current_week')::INTEGER, current_week),
    system_status = COALESCE(p_settings->>'system_status', system_status),
    last_reset = COALESCE((p_settings->>'last_reset')::TIMESTAMP WITH TIME ZONE, last_reset),
    updated_at = NOW()
  WHERE id = p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get settings
CREATE OR REPLACE FUNCTION get_settings(
  p_id TEXT DEFAULT '1'
) RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', id,
    'current_day', current_day,
    'current_week', current_week,
    'system_status', system_status,
    'last_reset', last_reset,
    'created_at', created_at,
    'updated_at', updated_at
  ) INTO v_settings
  FROM settings
  WHERE id = p_id;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to reset weekly data
CREATE OR REPLACE FUNCTION reset_weekly_data() RETURNS BOOLEAN AS $$
DECLARE
  v_current_week INTEGER;
BEGIN
  -- Get current week
  SELECT current_week INTO v_current_week FROM settings WHERE id = '1';
  
  -- Increment week number
  UPDATE settings
  SET 
    current_week = v_current_week + 1,
    last_reset = NOW(),
    updated_at = NOW()
  WHERE id = '1';
  
  -- Reset weekly points for all users
  UPDATE users
  SET 
    last_week_points = points - COALESCE(
      (SELECT SUM(points) FROM predictions WHERE userid = users.id AND created_at > (SELECT last_reset FROM settings WHERE id = '1')),
      0
    ),
    updated_at = NOW();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error resetting weekly data: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
