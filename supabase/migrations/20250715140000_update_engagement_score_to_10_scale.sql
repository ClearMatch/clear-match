-- Update engagement score constraint from 1-5 to 1-10 scale
-- Also migrate existing data by doubling the scores (1→2, 2→4, 3→6, 4→8, 5→10)

DO $$
BEGIN
    -- First, check if the constraint exists and update existing data
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'candidates_engagement_score_check' 
        AND table_name = 'contacts'
    ) THEN
        -- Migrate existing data: double the current scores to fit 1-10 scale
        -- This preserves relative rankings while expanding the range
        UPDATE contacts 
        SET engagement_score = engagement_score * 2 
        WHERE engagement_score IS NOT NULL;
        
        -- Drop the old constraint
        ALTER TABLE contacts 
        DROP CONSTRAINT candidates_engagement_score_check;
        
        -- Add new constraint for 1-10 scale
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_engagement_score_check 
        CHECK (engagement_score BETWEEN 1 AND 10);
        
        RAISE NOTICE 'Updated engagement score constraint to 1-10 scale and migrated existing data';
    ELSE
        -- If constraint doesn't exist, just add it (defensive approach)
        ALTER TABLE contacts 
        ADD CONSTRAINT contacts_engagement_score_check 
        CHECK (engagement_score BETWEEN 1 AND 10);
        
        RAISE NOTICE 'Added engagement score constraint for 1-10 scale';
    END IF;
END $$;