/*
  # Automatic Profile Creation Trigger
  
  This migration adds a database trigger to automatically create user profiles
  when new users sign up through Supabase Auth. This provides a safety net
  in case the application-level profile creation fails.
  
  Key Features:
  - Automatically creates profile when user signs up
  - Uses the first available organization (or creates default if none exist)  
  - Sets secure default values
  - Idempotent - won't create duplicate profiles
*/

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_org_id uuid;
    profile_exists boolean := false;
BEGIN
    -- Check if profile already exists (prevent duplicates)
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = NEW.id) INTO profile_exists;
    
    IF profile_exists THEN
        RETURN NEW;
    END IF;
    
    -- Get the first available organization
    SELECT id INTO default_org_id 
    FROM organizations 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    -- If no organization exists, create a default one
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Clear Match',
            NOW(),
            NOW()
        )
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Create the profile
    INSERT INTO profiles (
        id,
        organization_id,
        first_name,
        last_name,
        role,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        default_org_id,
        'User',
        'Account',
        'member',
        NEW.created_at,
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create trigger to run after user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO supabase_auth_admin;

-- Add comments for documentation
COMMENT ON FUNCTION handle_new_user() IS 
'Automatically creates user profile when new user signs up through Supabase Auth';

-- Log completion
SELECT 'Automatic Profile Creation Trigger Added' AS status;