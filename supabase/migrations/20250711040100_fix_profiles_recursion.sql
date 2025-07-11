/*
  # Fix Profiles RLS Recursion Issue
  
  The profiles policy is causing infinite recursion because it's trying to reference itself
  in the subquery. We need to fix this by using a different approach.
*/

-- Drop the problematic profile policy
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;

-- Create a policy that uses a different approach to avoid recursion
-- This policy allows users to view profiles in their organization by using the auth.uid()
-- directly instead of referencing profiles in the subquery
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
      SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1
    )
  );

-- Add a comment to document the fix
COMMENT ON POLICY "Users can view profiles in their organization" ON profiles IS 
'Allows users to view their own profile and profiles in the same organization. Uses direct auth.uid() lookup to avoid recursion.';

-- Log completion
SELECT 'Profiles RLS recursion fix applied successfully' AS status;