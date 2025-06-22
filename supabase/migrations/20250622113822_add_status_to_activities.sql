-- Add status column to activities table with constrained values and default

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'status'
    ) THEN
        -- Add the status column with a default value
        ALTER TABLE activities
        ADD COLUMN status text DEFAULT 'todo' NOT NULL;
        
        -- Add CHECK constraint
        ALTER TABLE activities
        ADD CONSTRAINT activities_status_check
        CHECK (status IN ('todo', 'in-progress', 'done'));
    END IF;
END $$;
