/*
  # Fix RLS Function Context Issue
  
  The get_user_organization_id() function approach isn't working properly in the RLS context.
  This migration simplifies the approach by using direct subqueries in the RLS policies
  instead of a function.
*/

-- Drop the function-based policies and revert to direct subquery approach
-- This avoids issues with function context in RLS

-- =============================================================================
-- 1. FIX CONTACTS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON contacts;

-- Use direct subquery approach for better compatibility
CREATE POLICY "Users can view contacts in their organization"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create contacts in their organization"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update contacts in their organization"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contacts in their organization"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 2. FIX ACTIVITIES TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can create activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can update activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can delete activities in their organization" ON activities;

CREATE POLICY "Users can view activities in their organization"
  ON activities
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create activities in their organization"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update activities in their organization"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete activities in their organization"
  ON activities
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 3. FIX TAGS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can create tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can update tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON tags;

CREATE POLICY "Users can view tags in their organization"
  ON tags
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create tags in their organization"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update tags in their organization"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tags in their organization"
  ON tags
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 4. FIX TEMPLATES TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can create templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can update templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can delete templates in their organization" ON templates;

CREATE POLICY "Users can view templates in their organization"
  ON templates
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates in their organization"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates in their organization"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates in their organization"
  ON templates
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 5. FIX EVENTS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view events in their organization" ON events;
DROP POLICY IF EXISTS "Users can create events in their organization" ON events;
DROP POLICY IF EXISTS "Users can update events in their organization" ON events;
DROP POLICY IF EXISTS "Users can delete events in their organization" ON events;

CREATE POLICY "Users can view events in their organization"
  ON events
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their organization"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update events in their organization"
  ON events
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete events in their organization"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 6. FIX JOB_POSTINGS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can create job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can update job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can delete job_postings in their organization" ON job_postings;

CREATE POLICY "Users can view job_postings in their organization"
  ON job_postings
  FOR SELECT
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can create job_postings in their organization"
  ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can update job_postings in their organization"
  ON job_postings
  FOR UPDATE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete job_postings in their organization"
  ON job_postings
  FOR DELETE
  TO authenticated
  USING (
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 7. FIX CONTACT_TAGS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can create contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete contact_tags in their organization" ON contact_tags;

CREATE POLICY "Users can view contact_tags in their organization"
  ON contact_tags
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT c.id FROM contacts c 
      WHERE c.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT t.id FROM tags t 
      WHERE t.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create contact_tags in their organization"
  ON contact_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT c.id FROM contacts c 
      WHERE c.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT t.id FROM tags t 
      WHERE t.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete contact_tags in their organization"
  ON contact_tags
  FOR DELETE
  TO authenticated
  USING (
    contact_id IN (
      SELECT c.id FROM contacts c 
      WHERE c.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT t.id FROM tags t 
      WHERE t.organization_id = (
        SELECT p.organization_id FROM profiles p WHERE p.id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 8. FIX ORGANIZATIONS TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid()
    )
  );

-- =============================================================================
-- 9. FIX PROFILES TABLE RLS POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create a simpler policy for profiles that avoids recursion
CREATE POLICY "Users can view profiles in their organization"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to view their own profile
    id = auth.uid() 
    OR 
    -- Allow users to view profiles in the same organization
    organization_id = (
      SELECT p.organization_id 
      FROM profiles p 
      WHERE p.id = auth.uid() 
      LIMIT 1
    )
  );

-- Add comments to document the direct subquery approach
COMMENT ON POLICY "Users can view contacts in their organization" ON contacts IS 
'Uses direct subquery to avoid function context issues in RLS';

-- Log completion
SELECT 'RLS Direct Subquery Approach Applied Successfully' AS status;