/*
  # Fix Organization Creation During Signup
  
  Adds policies to allow organization creation during signup process.
  This fixes the chicken-and-egg problem where users need to create an organization
  before they have a profile, but policies require a profile to create an organization.
*/

-- Allow authenticated users to create organizations (for signup)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations' 
        AND policyname = 'Authenticated users can create organizations'
    ) THEN
        CREATE POLICY "Authenticated users can create organizations"
        ON organizations FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- Allow users to insert their own profile (for signup)
DO $$
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile"
        ON profiles FOR INSERT
        TO authenticated
        WITH CHECK (id = auth.uid());
    END IF;
END $$;