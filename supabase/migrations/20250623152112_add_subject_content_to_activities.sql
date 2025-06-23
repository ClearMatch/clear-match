-- Add subject and content fields to activities table

-- Using a defensive approach to check if the columns already exist
DO $$
BEGIN
    -- Check if the subject column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'subject'
    ) THEN
        -- Add the subject column as varchar
        ALTER TABLE activities
        ADD COLUMN subject varchar;
    END IF;

    -- Check if the content column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'content'
    ) THEN
        -- Add the content column as text
        ALTER TABLE activities
        ADD COLUMN content text;
    END IF;
END $$;