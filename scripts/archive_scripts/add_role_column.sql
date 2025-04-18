-- הוספת עמודת role לטבלת users אם היא לא קיימת
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'player';
    END IF;
END $$;

-- יצירת פונקציית RPC חדשה שתומכת בשדה role
CREATE OR REPLACE FUNCTION add_new_user_with_role(
    user_name TEXT,
    user_playercode TEXT,
    user_phone TEXT DEFAULT NULL,
    user_city TEXT DEFAULT NULL,
    user_status TEXT DEFAULT 'active',
    user_points INTEGER DEFAULT 0,
    user_role TEXT DEFAULT 'player'
) RETURNS UUID AS $$
DECLARE
    new_user_id UUID;
BEGIN
    -- בדיקה אם קוד השחקן כבר קיים
    IF EXISTS (SELECT 1 FROM users WHERE playercode = user_playercode) THEN
        RAISE EXCEPTION 'Player code already exists';
    END IF;

    -- הוספת המשתמש החדש
    INSERT INTO users (
        name,
        playercode,
        phone,
        city,
        status,
        points,
        role,
        created_at,
        updated_at
    ) VALUES (
        user_name,
        user_playercode,
        user_phone,
        user_city,
        user_status,
        user_points,
        user_role,
        NOW(),
        NOW()
    ) RETURNING id INTO new_user_id;

    RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- הענקת הרשאות לפונקציה החדשה
GRANT EXECUTE ON FUNCTION add_new_user_with_role TO anon, authenticated, service_role;
