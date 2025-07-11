/*
  # Fix RLS Recursion with Function-Based Approach
  
  Create a function to get the user's organization ID that can be used
  by all RLS policies to avoid recursion issues.
*/

-- Create a function to get the current user's organization ID
-- This function will be used by all RLS policies to avoid recursion
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id uuid;
BEGIN
  -- Get the organization_id for the current user
  SELECT organization_id INTO org_id
  FROM profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_organization_id() TO authenticated;

-- =============================================================================
-- UPDATE ALL RLS POLICIES TO USE THE FUNCTION
-- =============================================================================

-- Drop all existing policies and recreate them with the function
-- This eliminates the recursion issue

-- CONTACTS TABLE
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON contacts;

CREATE POLICY "Users can view contacts in their organization"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create contacts in their organization"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update contacts in their organization"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete contacts in their organization"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- ACTIVITIES TABLE
DROP POLICY IF EXISTS "Users can view activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can create activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can update activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can delete activities in their organization" ON activities;

CREATE POLICY "Users can view activities in their organization"
  ON activities
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create activities in their organization"
  ON activities
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update activities in their organization"
  ON activities
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete activities in their organization"
  ON activities
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- TAGS TABLE
DROP POLICY IF EXISTS "Users can view tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can create tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can update tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON tags;

CREATE POLICY "Users can view tags in their organization"
  ON tags
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create tags in their organization"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update tags in their organization"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete tags in their organization"
  ON tags
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- TEMPLATES TABLE
DROP POLICY IF EXISTS "Users can view templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can create templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can update templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can delete templates in their organization" ON templates;

CREATE POLICY "Users can view templates in their organization"
  ON templates
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create templates in their organization"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update templates in their organization"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete templates in their organization"
  ON templates
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- EVENTS TABLE
DROP POLICY IF EXISTS "Users can view events in their organization" ON events;
DROP POLICY IF EXISTS "Users can create events in their organization" ON events;
DROP POLICY IF EXISTS "Users can update events in their organization" ON events;
DROP POLICY IF EXISTS "Users can delete events in their organization" ON events;

CREATE POLICY "Users can view events in their organization"
  ON events
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create events in their organization"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update events in their organization"
  ON events
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete events in their organization"
  ON events
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- JOB_POSTINGS TABLE
DROP POLICY IF EXISTS "Users can view job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can create job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can update job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can delete job_postings in their organization" ON job_postings;

CREATE POLICY "Users can view job_postings in their organization"
  ON job_postings
  FOR SELECT
  TO authenticated
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create job_postings in their organization"
  ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update job_postings in their organization"
  ON job_postings
  FOR UPDATE
  TO authenticated
  USING (organization_id = get_user_organization_id())
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can delete job_postings in their organization"
  ON job_postings
  FOR DELETE
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- CONTACT_TAGS TABLE
DROP POLICY IF EXISTS "Users can view contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can create contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete contact_tags in their organization" ON contact_tags;

CREATE POLICY "Users can view contact_tags in their organization"
  ON contact_tags
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_organization_id()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can create contact_tags in their organization"
  ON contact_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_organization_id()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_organization_id()
    )
  );

CREATE POLICY "Users can delete contact_tags in their organization"
  ON contact_tags
  FOR DELETE
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_organization_id()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_organization_id()
    )
  );

-- ORGANIZATIONS TABLE
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id = get_user_organization_id());

-- PROFILES TABLE - Special case to avoid recursion
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

CREATE POLICY "Users can view profiles in their organization"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to view their own profile
    id = auth.uid() 
    OR 
    -- Allow users to view profiles in the same organization
    organization_id = get_user_organization_id()
  );

-- Add comments to document the function-based approach
COMMENT ON FUNCTION get_user_organization_id() IS 'Returns the organization_id for the current authenticated user. Used by RLS policies to avoid recursion.';

-- Log completion
SELECT 'RLS Function-based approach applied successfully' AS status;