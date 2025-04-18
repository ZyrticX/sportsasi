-- Function to create or update settings
-- This function uses SECURITY DEFINER to bypass RLS policies
CREATE OR REPLACE FUNCTION create_or_update_settings(
  p_id TEXT,
  p_currentday TEXT,
  p_week INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if settings with the given ID exist
  IF EXISTS (SELECT 1 FROM settings WHERE id = p_id) THEN
    -- Update existing settings
    UPDATE settings
    SET 
      currentday = p_currentday,
      week = p_week,
      updated_at = NOW()
    WHERE id = p_id;
  ELSE
    -- Insert new settings
    INSERT INTO settings (id, currentday, week, created_at, updated_at)
    VALUES (p_id, p_currentday, p_week, NOW(), NOW());
  END IF;
  
  RETURN TRUE;
END;
$$;
