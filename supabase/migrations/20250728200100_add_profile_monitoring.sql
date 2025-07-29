/*
  # Profile Creation Monitoring
  
  This migration adds monitoring functions to detect and report
  missing user profiles. This helps identify when the automatic
  profile creation process fails.
*/

-- Function to get profile creation health check
CREATE OR REPLACE FUNCTION get_profile_health_check()
RETURNS TABLE (
    total_users bigint,
    total_profiles bigint,
    missing_profiles bigint,
    health_status text,
    last_checked timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        (SELECT COUNT(*) FROM auth.users) as total_users,
        (SELECT COUNT(*) FROM profiles) as total_profiles,
        (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as missing_profiles,
        CASE 
            WHEN (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) = 0 
            THEN 'HEALTHY'
            ELSE 'MISSING_PROFILES'
        END as health_status,
        NOW() as last_checked;
$$;

-- Function to get users missing profiles (for debugging)
CREATE OR REPLACE FUNCTION get_users_missing_profiles()
RETURNS TABLE (
    user_id uuid,
    user_email text,
    created_at timestamptz,
    missing_since interval
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        u.id as user_id,
        u.email as user_email,
        u.created_at,
        NOW() - u.created_at as missing_since
    FROM auth.users u
    LEFT JOIN profiles p ON u.id = p.id
    WHERE p.id IS NULL
    ORDER BY u.created_at DESC;
$$;

-- Function to auto-fix missing profiles (emergency use)
CREATE OR REPLACE FUNCTION fix_missing_profiles()
RETURNS TABLE (
    fixed_count integer,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    default_org_id uuid;
    user_record record;
    fixed_count integer := 0;
BEGIN
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
    
    -- Create profiles for users who don't have them
    FOR user_record IN 
        SELECT u.id, u.email, u.created_at
        FROM auth.users u
        LEFT JOIN profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        INSERT INTO profiles (
            id, 
            organization_id, 
            first_name, 
            last_name, 
            role, 
            created_at, 
            updated_at
        ) VALUES (
            user_record.id,
            default_org_id,
            'User',
            'Account',
            'member',
            user_record.created_at,
            NOW()
        );
        
        fixed_count := fixed_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT fixed_count, 'SUCCESS'::text;
END;
$$;

-- Grant permissions for monitoring functions
GRANT EXECUTE ON FUNCTION get_profile_health_check() TO authenticated;
GRANT EXECUTE ON FUNCTION get_users_missing_profiles() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_missing_profiles() TO service_role;

-- Add comments
COMMENT ON FUNCTION get_profile_health_check() IS 
'Returns overall health status of user profile creation';

COMMENT ON FUNCTION get_users_missing_profiles() IS 
'Returns list of users who are missing profiles for debugging';

COMMENT ON FUNCTION fix_missing_profiles() IS 
'Emergency function to create missing profiles (service_role only)';

-- Log completion
SELECT 'Profile Monitoring Functions Added' AS status;