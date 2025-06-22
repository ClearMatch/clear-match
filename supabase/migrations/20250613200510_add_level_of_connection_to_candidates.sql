-- Add nullable text column 'level_of_connection' to 'candidates' table

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'level_of_connection'
    ) THEN
        -- Add the level_of_connection column
        ALTER TABLE candidates
        ADD COLUMN level_of_connection text;
    END IF;
END $$;
