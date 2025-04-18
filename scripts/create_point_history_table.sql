-- Create point history table
CREATE TABLE IF NOT EXISTS point_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_change INTEGER NOT NULL,
  points_type TEXT NOT NULL, -- 'total', 'weekly', 'monthly'
  reason TEXT NOT NULL, -- 'prediction', 'reset', 'admin', etc.
  game_id UUID REFERENCES games(id) ON DELETE SET NULL,
  prediction_id UUID REFERENCES predictions(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- Additional data like game details, prediction details, etc.
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS point_history_user_id_idx ON point_history(user_id);
CREATE INDEX IF NOT EXISTS point_history_created_at_idx ON point_history(created_at);
CREATE INDEX IF NOT EXISTS point_history_points_type_idx ON point_history(points_type);

-- Create a function to add a point history record
CREATE OR REPLACE FUNCTION add_point_history(
  p_user_id UUID,
  p_points_change INTEGER,
  p_points_type TEXT,
  p_reason TEXT,
  p_game_id UUID DEFAULT NULL,
  p_prediction_id UUID DEFAULT NULL,
  p_admin_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
BEGIN
  INSERT INTO point_history (
    user_id,
    points_change,
    points_type,
    reason,
    game_id,
    prediction_id,
    admin_id,
    metadata
  ) VALUES (
    p_user_id,
    p_points_change,
    p_points_type,
    p_reason,
    p_game_id,
    p_prediction_id,
    p_admin_id,
    p_metadata
  ) RETURNING id INTO v_history_id;
  
  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get point history for a user
CREATE OR REPLACE FUNCTION get_user_point_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_points_type TEXT DEFAULT NULL
) RETURNS TABLE (
  id UUID,
  points_change INTEGER,
  points_type TEXT,
  reason TEXT,
  game_id UUID,
  prediction_id UUID,
  admin_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ph.id,
    ph.points_change,
    ph.points_type,
    ph.reason,
    ph.game_id,
    ph.prediction_id,
    ph.admin_id,
    ph.created_at,
    ph.metadata
  FROM
    point_history ph
  WHERE
    ph.user_id = p_user_id
    AND (p_points_type IS NULL OR ph.points_type = p_points_type)
  ORDER BY
    ph.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the update_all_points function to record point history
CREATE OR REPLACE FUNCTION update_all_points_with_history(
  user_id UUID,
  points_to_add INTEGER,
  reason TEXT,
  game_id UUID DEFAULT NULL,
  prediction_id UUID DEFAULT NULL,
  admin_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB AS $$
DECLARE
  updated_user JSONB;
BEGIN
  -- Validate input
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User ID cannot be null';
  END IF;
  
  IF points_to_add IS NULL OR points_to_add < 0 THEN
    RAISE EXCEPTION 'Points to add must be a non-negative number';
  END IF;

  -- Update all point types for the user
  UPDATE users
  SET 
    points = COALESCE(points, 0) + points_to_add,
    weekly_points = COALESCE(weekly_points, 0) + points_to_add,
    monthly_points = COALESCE(monthly_points, 0) + points_to_add,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING jsonb_build_object(
    'id', id,
    'name', name,
    'points', points,
    'weekly_points', weekly_points,
    'monthly_points', monthly_points,
    'updated_at', updated_at
  ) INTO updated_user;

  -- Check if user was found and updated
  IF updated_user IS NULL THEN
    RAISE EXCEPTION 'User with ID % not found', user_id;
  END IF;

  -- Record point history for total points
  PERFORM add_point_history(
    user_id,
    points_to_add,
    'total',
    reason,
    game_id,
    prediction_id,
    admin_id,
    metadata
  );

  -- Record point history for weekly points
  PERFORM add_point_history(
    user_id,
    points_to_add,
    'weekly',
    reason,
    game_id,
    prediction_id,
    admin_id,
    metadata
  );

  -- Record point history for monthly points
  PERFORM add_point_history(
    user_id,
    points_to_add,
    'monthly',
    reason,
    game_id,
    prediction_id,
    admin_id,
    metadata
  );

  -- Return the updated user data
  RETURN updated_user;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating points: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the reset_weekly_points function to record point history
CREATE OR REPLACE FUNCTION reset_weekly_points_with_history(
  p_admin_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id, weekly_points FROM users WHERE weekly_points > 0 LOOP
    -- Record the reset in point history
    PERFORM add_point_history(
      v_user.id,
      -v_user.weekly_points,
      'weekly',
      'reset',
      NULL,
      NULL,
      p_admin_id,
      jsonb_build_object('reset_type', 'weekly')
    );
  END LOOP;

  -- Reset weekly points for all users
  UPDATE users SET weekly_points = 0 WHERE weekly_points > 0;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error resetting weekly points: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the reset_monthly_points function to record point history
CREATE OR REPLACE FUNCTION reset_monthly_points_with_history(
  p_admin_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id, monthly_points FROM users WHERE monthly_points > 0 LOOP
    -- Record the reset in point history
    PERFORM add_point_history(
      v_user.id,
      -v_user.monthly_points,
      'monthly',
      'reset',
      NULL,
      NULL,
      p_admin_id,
      jsonb_build_object('reset_type', 'monthly')
    );
  END LOOP;

  -- Reset monthly points for all users
  UPDATE users SET monthly_points = 0 WHERE monthly_points > 0;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error resetting monthly points: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_point_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_point_history TO authenticated;
GRANT EXECUTE ON FUNCTION update_all_points_with_history TO authenticated;
GRANT EXECUTE ON FUNCTION reset_weekly_points_with_history TO authenticated;
GRANT EXECUTE ON FUNCTION reset_monthly_points_with_history TO authenticated;
