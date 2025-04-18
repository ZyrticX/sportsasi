-- וידוא שעמודת role קיימת בטבלת users
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'player';
    END IF;
END $;

-- עדכון תפקידי המשתמשים הקיימים
-- עדכון מנהלי-על
UPDATE users 
SET role = 'super-admin' 
WHERE playercode IN ('323317966', '987654321');

-- עדכון מנהלים רגילים
UPDATE users 
SET role = 'admin' 
WHERE playercode IN ('123456', '50244100', '12345678') 
AND playercode NOT IN ('323317966', '987654321');

-- וידוא שכל המשתמשים האחרים הם שחקנים
UPDATE users 
SET role = 'player' 
WHERE role IS NULL OR role = '';
