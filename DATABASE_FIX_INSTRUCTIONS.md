# Database Fix Instructions - Engagement Score

## Current Situation
Database issue that needs to be resolved:

**Engagement Score Constraint Error:**
```
{code: "23514", message: "new row for relation \"contacts\" violates check constraint \"candidates_engagement_score_check\""}
```
The old constraint only allows 1-5 values, but we now use 1-10 scale.

## 🔧 PERMANENT SOLUTION (Database Migration)
To permanently fix this, you need to run the database migration:

### Option 1: Run Manual SQL (Recommended)
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the complete SQL from `manual_database_fix.sql`:

```sql
-- COMPREHENSIVE DATABASE FIX
-- Step 1: Check current state
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'contacts' AND tc.constraint_type = 'CHECK';

-- Step 2: Fix Engagement Score (1-5 to 1-10)
UPDATE contacts 
SET engagement_score = engagement_score * 2 
WHERE engagement_score IS NOT NULL AND engagement_score BETWEEN 1 AND 5;

ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS candidates_engagement_score_check;

ALTER TABLE contacts 
ADD CONSTRAINT contacts_engagement_score_check 
CHECK (engagement_score BETWEEN 1 AND 10);

-- Step 3: Verify changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'contacts' AND column_name = 'engagement_score';
```

4. Run the SQL
5. Verify that:
   - `engagement_score` constraint now allows 1-10

### Option 2: Use Supabase CLI (if available)
```bash
supabase db reset
```

## 🧪 TESTING
After applying either fix:
1. Try creating a new contact with engagement score selected
2. Try editing an existing contact's engagement score
3. Verify that the form shows the correct 1-10 scale
4. Verify that data saves without errors

## ⚠️ IMPORTANT NOTES
- The database migration is recommended for the long-term solution
- No code changes are needed after running the database migration

## 📝 Current Status
- ✅ Build and lint passing
- ⏳ Database migration pending (run manually when convenient)
- ✅ Contact form should now work with engagement score 1-10 scale