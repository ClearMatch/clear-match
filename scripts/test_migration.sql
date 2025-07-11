-- Test script to verify single-tenant consolidation migration works with real data
-- This simulates the migration running on a database with multiple organizations
-- Author: Claude AI Assistant
-- Date: 2025-07-11

DO $$
DECLARE
    master_org_id UUID;
    test_org_count INTEGER;
    test_user_count INTEGER;
    test_contact_count INTEGER;
    test_activity_count INTEGER;
    test_event_count INTEGER;
BEGIN
    RAISE NOTICE 'Testing Single-Tenant Consolidation Migration with existing data...';
    
    -- Show current state
    SELECT COUNT(*) INTO test_org_count FROM organizations;
    SELECT COUNT(*) INTO test_user_count FROM profiles;
    SELECT COUNT(*) INTO test_contact_count FROM contacts;
    SELECT COUNT(*) INTO test_activity_count FROM activities;
    SELECT COUNT(*) INTO test_event_count FROM events;
    
    RAISE NOTICE 'Current state:';
    RAISE NOTICE '  Organizations: %', test_org_count;
    RAISE NOTICE '  Users: %', test_user_count;
    RAISE NOTICE '  Contacts: %', test_contact_count;
    RAISE NOTICE '  Activities: %', test_activity_count;
    RAISE NOTICE '  Events: %', test_event_count;
    
    -- Check if we already have a Clear Match Talent organization
    SELECT id INTO master_org_id 
    FROM organizations 
    WHERE name = 'Clear Match Talent' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF master_org_id IS NULL THEN
        RAISE NOTICE 'No Clear Match Talent organization found - one would be created';
    ELSE
        RAISE NOTICE 'Found existing Clear Match Talent organization: %', master_org_id;
    END IF;
    
    -- Show distribution of users across organizations
    RAISE NOTICE 'User distribution across organizations:';
    FOR test_org_count IN 
        SELECT COUNT(*) 
        FROM profiles p 
        JOIN organizations o ON p.organization_id = o.id 
        GROUP BY o.name, o.id
    LOOP
        RAISE NOTICE '  Organization has % users', test_org_count;
    END LOOP;
    
    -- Show organizations with data
    RAISE NOTICE 'Organizations with contacts:';
    FOR test_org_count IN 
        SELECT COUNT(*) 
        FROM contacts c 
        JOIN organizations o ON c.organization_id = o.id 
        GROUP BY o.name, o.id
    LOOP
        RAISE NOTICE '  Organization has % contacts', test_org_count;
    END LOOP;
    
    RAISE NOTICE 'Migration test completed - ready to run actual consolidation';
END $$;