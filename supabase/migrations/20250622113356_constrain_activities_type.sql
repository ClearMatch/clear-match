-- Constrain the type column on activities table to specific values and set default

-- First, check if there are any existing values that don't match our allowed values
DO $$
BEGIN
    -- Update any existing values that don't match our allowed values to 'none'
    UPDATE activities
    SET type = 'none'
    WHERE type NOT IN ('none', 'email', 'call', 'video', 'text');
END $$;

-- Add CHECK constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'type'
        AND constraint_name = 'activities_type_check'
    ) THEN
        ALTER TABLE activities
        ADD CONSTRAINT activities_type_check
        CHECK (type IN ('none', 'email', 'call', 'video', 'text'));
    END IF;
END $$;

-- Set default value if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'type'
        AND column_default = '''none'''
    ) THEN
        ALTER TABLE activities
        ALTER COLUMN type SET DEFAULT 'none';
    END IF;
END $$;
