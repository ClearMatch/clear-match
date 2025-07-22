/*
  # Create Missing Profiles for Existing Users
  
  This migration creates profiles for users who exist in auth.users 
  but don't have corresponding profiles, which breaks the application
  since all RLS policies depend on organization context from profiles.
*/

-- First, let's check current state and log it
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    org_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO org_count FROM organizations;
    
    RAISE NOTICE 'Current state: % users, % profiles, % organizations', user_count, profile_count, org_count;
END $$;

-- Create profiles for users who don't have them
-- Use the existing "Clear Match Talent" organization or create one if it doesn't exist
DO $$
DECLARE
    master_org_id UUID;
    user_record RECORD;
    created_count INTEGER := 0;
BEGIN
    -- Find or create the Clear Match Talent organization
    SELECT id INTO master_org_id 
    FROM organizations 
    WHERE name = 'Clear Match Talent' 
    LIMIT 1;
    
    -- If no Clear Match Talent org exists, use the first available organization
    IF master_org_id IS NULL THEN
        SELECT id INTO master_org_id 
        FROM organizations 
        ORDER BY created_at ASC 
        LIMIT 1;
        
        RAISE NOTICE 'Using existing organization: %', master_org_id;
    ELSE
        RAISE NOTICE 'Found Clear Match Talent organization: %', master_org_id;
    END IF;
    
    -- If still no organization, create one
    IF master_org_id IS NULL THEN
        INSERT INTO organizations (id, name, slug, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'Clear Match Talent',
            'clear-match-talent',
            NOW(),
            NOW()
        )
        RETURNING id INTO master_org_id;
        
        RAISE NOTICE 'Created new Clear Match Talent organization: %', master_org_id;
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
            master_org_id,
            'User', -- Default first name
            'Account', -- Default last name  
            'member', -- Default role (secure default)
            user_record.created_at,
            NOW()
        );
        
        created_count := created_count + 1;
        RAISE NOTICE 'Created profile for user: % (email: %)', user_record.id, user_record.email;
    END LOOP;
    
    RAISE NOTICE 'Created % new profiles', created_count;
END $$;

-- Verify the fix
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
    missing_profiles INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    
    SELECT COUNT(*) INTO missing_profiles 
    FROM auth.users u 
    LEFT JOIN profiles p ON u.id = p.id 
    WHERE p.id IS NULL;
    
    RAISE NOTICE 'Final state: % users, % profiles, % missing profiles', user_count, profile_count, missing_profiles;
    
    IF missing_profiles = 0 THEN
        RAISE NOTICE 'SUCCESS: All users now have profiles!';
    ELSE
        RAISE WARNING 'ISSUE: % users still missing profiles', missing_profiles;
    END IF;
END $$;

-- Log completion
SELECT 'Missing Profiles Migration Complete' AS status;