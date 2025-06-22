-- Add event_id column to activities table

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'event_id'
    ) THEN
        -- Add the event_id column as a nullable integer
        ALTER TABLE activities
        ADD COLUMN event_id integer;
    END IF;
END $$;
