-- Add years_of_experience and engagement_score fields to candidates table

-- Using a defensive approach to check if the columns already exist
DO $$
BEGIN
    -- Check if the years_of_experience column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'years_of_experience'
    ) THEN
        -- Add the years_of_experience column as integer
        ALTER TABLE candidates
        ADD COLUMN years_of_experience integer;
    END IF;

    -- Check if the engagement_score column already exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'candidates'
        AND column_name = 'engagement_score'
    ) THEN
        -- Add the engagement_score column with constraint (1-5)
        ALTER TABLE candidates
        ADD COLUMN engagement_score integer
        CONSTRAINT candidates_engagement_score_check CHECK (engagement_score BETWEEN 1 AND 5);
    END IF;
END $$;