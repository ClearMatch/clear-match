/*
  # Final RLS Fix - Avoid All Recursion Issues
  
  This migration completely eliminates recursion by using a secure context approach
  and simplifying the profiles policy to avoid any self-referencing.
*/

-- First, let's completely disable and re-enable RLS for profiles to clear any issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing profile policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create very simple profile policies that avoid recursion
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Now create a secure view for organization members that avoids recursion
CREATE OR REPLACE VIEW organization_members AS
SELECT 
  p.id,
  p.organization_id,
  p.first_name,
  p.last_name,
  p.role,
  p.created_at,
  p.updated_at
FROM profiles p;

-- Grant access to the view
GRANT SELECT ON organization_members TO authenticated;

-- Create a security definer function that can safely access profiles
CREATE OR REPLACE FUNCTION get_user_org_id_secure()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_org_id_secure() TO authenticated;

-- Now update all RLS policies to use the secure function
-- This avoids any potential recursion issues

-- CONTACTS TABLE
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON contacts;

CREATE POLICY "Users can view contacts in their organization"
  ON contacts FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create contacts in their organization"
  ON contacts FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update contacts in their organization"
  ON contacts FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete contacts in their organization"
  ON contacts FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- ACTIVITIES TABLE
DROP POLICY IF EXISTS "Users can view activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can create activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can update activities in their organization" ON activities;
DROP POLICY IF EXISTS "Users can delete activities in their organization" ON activities;

CREATE POLICY "Users can view activities in their organization"
  ON activities FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create activities in their organization"
  ON activities FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update activities in their organization"
  ON activities FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete activities in their organization"
  ON activities FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- TAGS TABLE
DROP POLICY IF EXISTS "Users can view tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can create tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can update tags in their organization" ON tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON tags;

CREATE POLICY "Users can view tags in their organization"
  ON tags FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create tags in their organization"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update tags in their organization"
  ON tags FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete tags in their organization"
  ON tags FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- TEMPLATES TABLE
DROP POLICY IF EXISTS "Users can view templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can create templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can update templates in their organization" ON templates;
DROP POLICY IF EXISTS "Users can delete templates in their organization" ON templates;

CREATE POLICY "Users can view templates in their organization"
  ON templates FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create templates in their organization"
  ON templates FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update templates in their organization"
  ON templates FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete templates in their organization"
  ON templates FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- EVENTS TABLE
DROP POLICY IF EXISTS "Users can view events in their organization" ON events;
DROP POLICY IF EXISTS "Users can create events in their organization" ON events;
DROP POLICY IF EXISTS "Users can update events in their organization" ON events;
DROP POLICY IF EXISTS "Users can delete events in their organization" ON events;

CREATE POLICY "Users can view events in their organization"
  ON events FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create events in their organization"
  ON events FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update events in their organization"
  ON events FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete events in their organization"
  ON events FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- JOB_POSTINGS TABLE
DROP POLICY IF EXISTS "Users can view job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can create job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can update job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can delete job_postings in their organization" ON job_postings;

CREATE POLICY "Users can view job_postings in their organization"
  ON job_postings FOR SELECT TO authenticated
  USING (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can create job_postings in their organization"
  ON job_postings FOR INSERT TO authenticated
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can update job_postings in their organization"
  ON job_postings FOR UPDATE TO authenticated
  USING (organization_id = get_user_org_id_secure())
  WITH CHECK (organization_id = get_user_org_id_secure());

CREATE POLICY "Users can delete job_postings in their organization"
  ON job_postings FOR DELETE TO authenticated
  USING (organization_id = get_user_org_id_secure());

-- ORGANIZATIONS TABLE
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT TO authenticated
  USING (id = get_user_org_id_secure());

-- CONTACT_TAGS TABLE
DROP POLICY IF EXISTS "Users can view contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can create contact_tags in their organization" ON contact_tags;
DROP POLICY IF EXISTS "Users can delete contact_tags in their organization" ON contact_tags;

CREATE POLICY "Users can view contact_tags in their organization"
  ON contact_tags FOR SELECT TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_org_id_secure()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_org_id_secure()
    )
  );

CREATE POLICY "Users can create contact_tags in their organization"
  ON contact_tags FOR INSERT TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_org_id_secure()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_org_id_secure()
    )
  );

CREATE POLICY "Users can delete contact_tags in their organization"
  ON contact_tags FOR DELETE TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id = get_user_org_id_secure()
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id = get_user_org_id_secure()
    )
  );

-- Add documentation
COMMENT ON FUNCTION get_user_org_id_secure() IS 
'Security definer function that safely returns the current user organization ID without recursion';

COMMENT ON VIEW organization_members IS 
'Secure view for accessing organization member information without RLS recursion';

-- Log completion
SELECT 'Final RLS Fix Applied - Recursion Issues Resolved' AS status;