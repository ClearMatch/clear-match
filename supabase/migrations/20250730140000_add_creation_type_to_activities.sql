-- Add creation_type column to activities table
-- This column tracks whether a task was created manually or automatically

DO $$
BEGIN
    -- Check if the column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'creation_type'
    ) THEN
        -- Add the creation_type column with constraint
        ALTER TABLE activities
        ADD COLUMN creation_type text DEFAULT 'manual'
        CONSTRAINT activities_creation_type_check CHECK (creation_type IN ('manual', 'automatic'));
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_activities_creation_type ON activities(creation_type);
        
        -- Update existing records to have 'manual' creation_type (since they were all created manually)
        UPDATE activities SET creation_type = 'manual' WHERE creation_type IS NULL;
        
        -- Make the column NOT NULL after setting default values
        ALTER TABLE activities ALTER COLUMN creation_type SET NOT NULL;
    END IF;
END $$;