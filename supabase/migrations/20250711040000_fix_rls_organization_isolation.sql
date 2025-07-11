/*
  # Fix RLS Policies for Organization Isolation
  
  This migration addresses the security issues identified in issue #118:
  - Contacts table has overly permissive policies (users can see ALL contacts)
  - Activities table lacks proper organization-scoped policies
  - Tags and templates tables lack proper policies
  - Events and job_postings tables have RLS disabled
  - Profile policies only allow viewing own profile, not org members
  
  This ensures proper organization-based data isolation across all tables.
*/

-- =============================================================================
-- 1. FIX CONTACTS TABLE RLS POLICIES
-- =============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can create contacts" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON contacts;

-- Create organization-scoped policies for contacts
CREATE POLICY "Users can view contacts in their organization"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create contacts in their organization"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update contacts in their organization"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete contacts in their organization"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 2. FIX ACTIVITIES TABLE RLS POLICIES
-- =============================================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can create activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can update activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can delete activities" ON activities;

-- Keep existing organization-scoped policies if they exist, or create them
-- Note: These policies already exist from previous migrations, but we'll ensure they're the only ones

-- Verify organization-scoped policies exist
DO $$
BEGIN
    -- Policy for SELECT (viewing activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Users can view activities in their organization'
    ) THEN
        CREATE POLICY "Users can view activities in their organization"
        ON activities FOR SELECT
        TO authenticated
        USING (organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;
    
    -- Policy for INSERT (creating activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Users can create activities in their organization'
    ) THEN
        CREATE POLICY "Users can create activities in their organization"
        ON activities FOR INSERT
        TO authenticated
        WITH CHECK (organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;
    
    -- Policy for UPDATE (updating activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Users can update activities in their organization'
    ) THEN
        CREATE POLICY "Users can update activities in their organization"
        ON activities FOR UPDATE
        TO authenticated
        USING (organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        ))
        WITH CHECK (organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;
    
    -- Policy for DELETE (deleting activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Users can delete activities in their organization'
    ) THEN
        CREATE POLICY "Users can delete activities in their organization"
        ON activities FOR DELETE
        TO authenticated
        USING (organization_id IN (
          SELECT organization_id FROM profiles WHERE id = auth.uid()
        ));
    END IF;
END $$;

-- =============================================================================
-- 3. ADD PROPER RLS POLICIES FOR TAGS TABLE
-- =============================================================================

-- Drop any existing policies and create organization-scoped ones
DROP POLICY IF EXISTS "Authenticated users can view all tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can create tags" ON tags;
DROP POLICY IF EXISTS "Authenticated users can update tags" ON tags;

CREATE POLICY "Users can view tags in their organization"
  ON tags
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create tags in their organization"
  ON tags
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update tags in their organization"
  ON tags
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete tags in their organization"
  ON tags
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 4. ADD PROPER RLS POLICIES FOR TEMPLATES TABLE
-- =============================================================================

-- Drop any existing policies and create organization-scoped ones
DROP POLICY IF EXISTS "Authenticated users can view all templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON templates;
DROP POLICY IF EXISTS "Authenticated users can update templates" ON templates;

CREATE POLICY "Users can view templates in their organization"
  ON templates
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create templates in their organization"
  ON templates
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update templates in their organization"
  ON templates
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete templates in their organization"
  ON templates
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 5. ENABLE RLS AND ADD POLICIES FOR EVENTS TABLE
-- =============================================================================

-- Enable RLS on events table
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Create organization-scoped policies for events
CREATE POLICY "Users can view events in their organization"
  ON events
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create events in their organization"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update events in their organization"
  ON events
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete events in their organization"
  ON events
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 6. ENABLE RLS AND ADD POLICIES FOR JOB_POSTINGS TABLE
-- =============================================================================

-- Enable RLS on job_postings table
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Create organization-scoped policies for job_postings
CREATE POLICY "Users can view job_postings in their organization"
  ON job_postings
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create job_postings in their organization"
  ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update job_postings in their organization"
  ON job_postings
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ))
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete job_postings in their organization"
  ON job_postings
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 7. UPDATE PROFILES POLICIES TO ALLOW VIEWING ORG MEMBERS
-- =============================================================================

-- Drop the existing restrictive profile policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- Create policy to allow viewing profiles in the same organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- =============================================================================
-- 8. ADD PROPER RLS POLICIES FOR CONTACT_TAGS TABLE
-- =============================================================================

-- The contact_tags table is a junction table that inherits access through
-- its relationships with contacts and tags. We need to ensure users can
-- only access contact_tags where they have access to both the contact and tag.

-- Drop any existing policies
DROP POLICY IF EXISTS "Authenticated users can view all contact_tags" ON contact_tags;
DROP POLICY IF EXISTS "Authenticated users can create contact_tags" ON contact_tags;
DROP POLICY IF EXISTS "Authenticated users can update contact_tags" ON contact_tags;
DROP POLICY IF EXISTS "Authenticated users can delete contact_tags" ON contact_tags;

-- Create organization-scoped policies for contact_tags
CREATE POLICY "Users can view contact_tags in their organization"
  ON contact_tags
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create contact_tags in their organization"
  ON contact_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete contact_tags in their organization"
  ON contact_tags
  FOR DELETE
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM contacts WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    AND tag_id IN (
      SELECT id FROM tags WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- =============================================================================
-- 9. UPDATE ORGANIZATIONS POLICIES
-- =============================================================================

-- Drop overly permissive organization policies
DROP POLICY IF EXISTS "Users can view any organization" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create policy to only allow viewing user's own organization
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Don't allow creating organizations through normal user operations
-- (this should be handled by admin/signup processes)

-- =============================================================================
-- DOCUMENTATION AND COMMENTS
-- =============================================================================

-- Update table comments to document the RLS policies
COMMENT ON TABLE contacts IS 'Core contact data with organization-based RLS isolation';
COMMENT ON TABLE activities IS 'Activity tracking with organization-based RLS isolation';
COMMENT ON TABLE tags IS 'Tag definitions with organization-based RLS isolation';
COMMENT ON TABLE templates IS 'Templates with organization-based RLS isolation';
COMMENT ON TABLE events IS 'Events with organization-based RLS isolation';
COMMENT ON TABLE job_postings IS 'Job postings with organization-based RLS isolation';
COMMENT ON TABLE contact_tags IS 'Contact-tag relationships with organization-based RLS isolation';
COMMENT ON TABLE profiles IS 'User profiles with organization-based visibility';
COMMENT ON TABLE organizations IS 'Organizations with restricted access';

-- Log completion
SELECT 'RLS Organization Isolation Migration completed successfully' AS status;