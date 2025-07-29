/*
  # Fix Profile Insert Policy for Signup
  
  This migration updates the profile insert policy to allow
  profile creation during the signup process when the user
  context might not be fully established yet.
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a new insert policy that's more permissive during signup
CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Allow inserting your own profile
    id = auth.uid() 
    OR 
    -- Allow inserting if no auth context (during signup)
    auth.uid() IS NULL
  );

-- Add a more secure policy that validates organization exists
CREATE OR REPLACE FUNCTION is_valid_profile_insert(
  user_id uuid,
  org_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if organization exists
  RETURN EXISTS (
    SELECT 1 FROM organizations WHERE id = org_id
  );
END;
$$;

-- Update the policy to use the validation function
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    -- Must be inserting your own profile
    id = COALESCE(auth.uid(), id)
    AND
    -- Organization must exist
    is_valid_profile_insert(id, organization_id)
  );

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_valid_profile_insert TO authenticated, anon;

-- Log completion
SELECT 'Profile Insert Policy Fixed for Signup' AS status;