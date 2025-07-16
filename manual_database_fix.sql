-- COMPREHENSIVE DATABASE FIX
-- Run this SQL directly in your Supabase SQL Editor to fix engagement score constraint

-- Step 1: Check current constraints and column types
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contacts' AND tc.constraint_type = 'CHECK';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'engagement_score';

-- Step 2: Fix Engagement Score Constraint (1-5 to 1-10)
-- First, migrate existing engagement score data by doubling the scores
UPDATE contacts 
SET engagement_score = engagement_score * 2 
WHERE engagement_score IS NOT NULL AND engagement_score BETWEEN 1 AND 5;

-- Drop old constraint
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS candidates_engagement_score_check;

-- Add new constraint for 1-10 scale
ALTER TABLE contacts 
ADD CONSTRAINT contacts_engagement_score_check 
CHECK (engagement_score BETWEEN 1 AND 10);

-- Step 3: Verify all changes
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contacts' AND tc.constraint_type = 'CHECK';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'engagement_score';