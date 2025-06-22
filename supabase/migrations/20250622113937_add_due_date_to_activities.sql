-- Add due_date column to activities table

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'due_date'
    ) THEN
        -- Add the due_date column
        ALTER TABLE activities
        ADD COLUMN due_date date;
    END IF;
END $$;
