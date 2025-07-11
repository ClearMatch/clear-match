-- Phase 1: Single-Tenant Consolidation Migration
-- This migration consolidates all users into a single "Clear Match Talent" organization
-- Author: Claude AI Assistant
-- Date: 2025-07-11

DO $$
DECLARE
    master_org_id UUID;
    old_org_id UUID;
    affected_count INTEGER;
    total_users INTEGER;
    total_contacts INTEGER;
    total_activities INTEGER;
    total_events INTEGER;
    total_templates INTEGER;
    total_tags INTEGER;
    total_contact_tags INTEGER;
BEGIN
    -- Log the start of migration
    RAISE NOTICE 'Starting Single-Tenant Consolidation Migration';
    
    -- Get current counts for verification
    SELECT COUNT(*) INTO total_users FROM profiles;
    SELECT COUNT(*) INTO total_contacts FROM contacts;
    SELECT COUNT(*) INTO total_activities FROM activities;
    SELECT COUNT(*) INTO total_events FROM events;
    SELECT COUNT(*) INTO total_templates FROM templates;
    SELECT COUNT(*) INTO total_tags FROM tags;
    SELECT COUNT(*) INTO total_contact_tags FROM contact_tags;
    
    RAISE NOTICE 'Current data counts:';
    RAISE NOTICE '  Users: %', total_users;
    RAISE NOTICE '  Contacts: %', total_contacts;
    RAISE NOTICE '  Activities: %', total_activities;
    RAISE NOTICE '  Events: %', total_events;
    RAISE NOTICE '  Templates: %', total_templates;
    RAISE NOTICE '  Tags: %', total_tags;
    RAISE NOTICE '  Contact Tags: %', total_contact_tags;
    
    -- Step 1: Create or identify the master "Clear Match Talent" organization
    SELECT id INTO master_org_id 
    FROM organizations 
    WHERE name = 'Clear Match Talent' 
    ORDER BY created_at ASC 
    LIMIT 1;
    
    IF master_org_id IS NULL THEN
        -- Create new master organization
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (uuid_generate_v4(), 'Clear Match Talent', NOW(), NOW())
        RETURNING id INTO master_org_id;
        
        RAISE NOTICE 'Created new master organization: %', master_org_id;
    ELSE
        RAISE NOTICE 'Using existing master organization: %', master_org_id;
    END IF;
    
    -- Step 2: Migrate all users to the master organization
    UPDATE profiles 
    SET organization_id = master_org_id, updated_at = NOW()
    WHERE organization_id != master_org_id;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % users to master organization', affected_count;
    
    -- Step 3: Migrate all contacts to the master organization
    -- This handles both contacts with different organization_id and NULL organization_id
    UPDATE contacts 
    SET organization_id = master_org_id, updated_at = NOW()
    WHERE organization_id != master_org_id OR organization_id IS NULL;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % contacts to master organization', affected_count;
    
    -- Step 4: Migrate all activities to the master organization
    UPDATE activities 
    SET organization_id = master_org_id
    WHERE organization_id != master_org_id OR organization_id IS NULL;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % activities to master organization', affected_count;
    
    -- Step 5: Migrate all events to the master organization
    UPDATE events 
    SET organization_id = master_org_id, updated_at = NOW()
    WHERE organization_id != master_org_id OR organization_id IS NULL;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % events to master organization', affected_count;
    
    -- Step 6: Migrate all templates to the master organization
    UPDATE templates 
    SET organization_id = master_org_id, updated_at = NOW()
    WHERE organization_id != master_org_id;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % templates to master organization', affected_count;
    
    -- Step 7: Migrate all tags to the master organization
    -- Handle potential tag name conflicts by appending organization suffix
    FOR old_org_id IN 
        SELECT DISTINCT organization_id 
        FROM tags 
        WHERE organization_id != master_org_id
    LOOP
        -- Check for tag name conflicts and resolve them
        UPDATE tags 
        SET 
            organization_id = master_org_id,
            name = CASE 
                WHEN EXISTS (
                    SELECT 1 FROM tags 
                    WHERE organization_id = master_org_id 
                    AND name = tags.name
                ) THEN name || '_' || LEFT(old_org_id::text, 8)
                ELSE name
            END
        WHERE organization_id = old_org_id;
    END LOOP;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % tags to master organization', affected_count;
    
    -- Step 8: Update contact_tags junction table references
    -- Note: contact_tags doesn't have organization_id, it inherits from contacts and tags
    -- Since we've already migrated contacts and tags, the relationships should be preserved
    
    -- Step 9: Migrate job_postings to the master organization
    UPDATE job_postings 
    SET organization_id = master_org_id, updated_at = NOW()
    WHERE organization_id != master_org_id;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Migrated % job postings to master organization', affected_count;
    
    -- Step 10: Delete empty organizations (keeping the master one)
    DELETE FROM organizations 
    WHERE id != master_org_id;
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % empty organizations', affected_count;
    
    -- Step 11: Verify data integrity
    -- Verify all users are in master organization
    SELECT COUNT(*) INTO affected_count 
    FROM profiles 
    WHERE organization_id != master_org_id;
    
    IF affected_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % users still in other organizations', affected_count;
    END IF;
    
    -- Verify all contacts are in master organization
    SELECT COUNT(*) INTO affected_count 
    FROM contacts 
    WHERE organization_id != master_org_id;
    
    IF affected_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % contacts still in other organizations', affected_count;
    END IF;
    
    -- Verify all activities are in master organization
    SELECT COUNT(*) INTO affected_count 
    FROM activities 
    WHERE organization_id != master_org_id;
    
    IF affected_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % activities still in other organizations', affected_count;
    END IF;
    
    -- Verify all events are in master organization
    SELECT COUNT(*) INTO affected_count 
    FROM events 
    WHERE organization_id != master_org_id;
    
    IF affected_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % events still in other organizations', affected_count;
    END IF;
    
    -- Verify all tags are in master organization
    SELECT COUNT(*) INTO affected_count 
    FROM tags 
    WHERE organization_id != master_org_id;
    
    IF affected_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: % tags still in other organizations', affected_count;
    END IF;
    
    -- Verify only one organization remains
    SELECT COUNT(*) INTO affected_count FROM organizations;
    
    IF affected_count != 1 THEN
        RAISE EXCEPTION 'Migration failed: Expected 1 organization, found %', affected_count;
    END IF;
    
    -- Final verification counts
    SELECT COUNT(*) INTO affected_count FROM profiles WHERE organization_id = master_org_id;
    RAISE NOTICE 'Final verification - Users in master org: %', affected_count;
    
    SELECT COUNT(*) INTO affected_count FROM contacts WHERE organization_id = master_org_id;
    RAISE NOTICE 'Final verification - Contacts in master org: %', affected_count;
    
    SELECT COUNT(*) INTO affected_count FROM activities WHERE organization_id = master_org_id;
    RAISE NOTICE 'Final verification - Activities in master org: %', affected_count;
    
    SELECT COUNT(*) INTO affected_count FROM events WHERE organization_id = master_org_id;
    RAISE NOTICE 'Final verification - Events in master org: %', affected_count;
    
    RAISE NOTICE 'Single-Tenant Consolidation Migration completed successfully';
    RAISE NOTICE 'Master organization ID: %', master_org_id;
    
END $$;

-- Add a comment documenting this migration
COMMENT ON TABLE organizations IS 'Single-tenant organization table - consolidated to "Clear Match Talent"';