-- Add priority field to activities table with values constrained to numbers 1-6

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'priority'
    ) THEN
        -- Add the priority column with a CHECK constraint
        ALTER TABLE activities
        ADD COLUMN priority smallint
        CONSTRAINT activities_priority_check CHECK (priority BETWEEN 1 AND 6);
    END IF;
END $$;
