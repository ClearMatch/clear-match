/*
  # Fix RLS Infinite Recursion
  
  The profiles table has policies that reference itself, causing infinite recursion.
  This migration fixes the policies to break the circular dependency.
*/

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view any organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

-- Update the existing update policy to be non-recursive
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());