-- Rollback Script for Single-Tenant Consolidation Migration
-- This script requires a pre-migration backup to restore the original multi-tenant state
-- Author: Claude AI Assistant
-- Date: 2025-07-11

-- WARNING: This rollback script requires a database backup taken before the migration
-- The script below shows the general approach, but actual restoration should be done
-- from the backup created before migration

DO $$
BEGIN
    RAISE NOTICE 'ROLLBACK WARNING: This script requires a pre-migration backup';
    RAISE NOTICE 'To properly rollback the single-tenant consolidation:';
    RAISE NOTICE '1. Stop your application to prevent new data creation';
    RAISE NOTICE '2. Create a backup of current state (for safety)';
    RAISE NOTICE '3. Restore from the backup taken before migration';
    RAISE NOTICE '4. Verify data integrity after restoration';
    RAISE NOTICE '5. Restart your application';
    RAISE NOTICE '';
    RAISE NOTICE 'Manual restoration steps:';
    RAISE NOTICE '1. supabase db dump --data-only > post_migration_backup.sql';
    RAISE NOTICE '2. supabase db reset';
    RAISE NOTICE '3. Restore pre-migration backup';
    RAISE NOTICE '4. Verify all organizations and data are restored correctly';
    
    -- For demonstration, here's what the rollback would conceptually involve:
    -- (This is NOT executable without the original data)
    
    RAISE NOTICE '';
    RAISE NOTICE 'Conceptual rollback operations that would be needed:';
    RAISE NOTICE '1. Restore original organizations table from backup';
    RAISE NOTICE '2. Restore original organization_id references in profiles';
    RAISE NOTICE '3. Restore original organization_id references in contacts';
    RAISE NOTICE '4. Restore original organization_id references in activities';
    RAISE NOTICE '5. Restore original organization_id references in events';
    RAISE NOTICE '6. Restore original organization_id references in templates';
    RAISE NOTICE '7. Restore original organization_id references in tags';
    RAISE NOTICE '8. Restore original organization_id references in job_postings';
    RAISE NOTICE '9. Verify RLS policies work correctly with restored data';
    
    RAISE EXCEPTION 'Rollback halted - requires manual restoration from backup';
END $$;