-- Add assigned_to column to activities table to track which user is assigned to each activity

-- Using a defensive approach to check if the column already exists
DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'assigned_to'
    ) THEN
        -- Add the assigned_to column with a foreign key reference to profiles.id
        ALTER TABLE activities
        ADD COLUMN assigned_to uuid;
        
        -- Add foreign key constraint
        ALTER TABLE activities
        ADD CONSTRAINT activities_assigned_to_fkey
        FOREIGN KEY (assigned_to)
        REFERENCES profiles(id);
    END IF;
END $$;
