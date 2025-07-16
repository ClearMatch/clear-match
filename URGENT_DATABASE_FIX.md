# 🚨 URGENT: Database Migration Steps

## Issue
Your local environment is having issues, so here are multiple ways to fix the database constraint error:

## ✅ SOLUTION 1: Supabase Dashboard (RECOMMENDED)

### Step 1: Quick Fix (Stops the immediate error)
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Paste this SQL and click **Run**:

```sql
-- IMMEDIATE FIX - Stop the constraint error
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS candidates_engagement_score_check;

ALTER TABLE contacts 
ADD CONSTRAINT contacts_engagement_score_check 
CHECK (engagement_score BETWEEN 1 AND 10);
```

6. You should see "Success. No rows returned" or similar

## ✅ SOLUTION 2: Local Environment Fix

If you want to fix your local Supabase setup:

### Install Supabase CLI:
```bash
npm install -g supabase
# OR
curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz | tar zxf - && mv supabase /usr/local/bin/
```

### Run Migration:
```bash
cd /Users/deepakgurjar/Desktop/clear-match
supabase db reset
```

## ✅ SOLUTION 3: Direct Database Connection

If you have database credentials:

```bash
psql "postgresql://[username]:[password]@[host]:[port]/[database]" -c "
ALTER TABLE contacts 
DROP CONSTRAINT IF EXISTS candidates_engagement_score_check;

ALTER TABLE contacts 
ADD CONSTRAINT contacts_engagement_score_check 
CHECK (engagement_score BETWEEN 1 AND 10);
"
```

## 🧪 Test After Fix

1. Try creating a contact with engagement score 9
2. You should no longer get the constraint error
3. The form should save successfully

## ⚡ Priority Order
1. **Use Solution 1** (Supabase Dashboard) - Easiest and most reliable
2. **Use Solution 2** (Local CLI) - If you need local development
3. **Use Solution 3** (Direct SQL) - If you have direct database access

## 📞 Next Steps
Once you run Solution 1, let me know if:
- ✅ The constraint error is fixed
- ✅ You can create contacts with engagement scores 6-10
- ❌ You encounter any other errors

I'll help troubleshoot any remaining issues!