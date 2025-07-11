# Single-Tenant Consolidation Migration Documentation

## Overview

This documentation covers the Phase 1: Single-Tenant Consolidation migration implemented for Clear Match Talent, addressing GitHub issue #116. The migration consolidates all users into a single "Clear Match Talent" organization and cleans up the database structure.

## Migration Details

### Migration File
- **File**: `supabase/migrations/20250711000309_single_tenant_consolidation.sql`
- **Date**: July 11, 2025
- **Purpose**: Consolidate all users into a single organization for single-tenant operation

### What the Migration Does

1. **Creates/Identifies Master Organization**
   - Looks for existing "Clear Match Talent" organization
   - Creates new one if none exists
   - Uses the oldest existing one if multiple exist

2. **Migrates All Data**
   - **Users**: Moves all profiles to master organization
   - **Contacts**: Moves all contacts (handles NULL organization_id)
   - **Activities**: Moves all activities (handles NULL organization_id)
   - **Events**: Moves all events (handles NULL organization_id)
   - **Templates**: Moves all templates to master organization
   - **Tags**: Moves all tags with conflict resolution
   - **Job Postings**: Moves all job postings to master organization

3. **Handles Edge Cases**
   - NULL organization_id values are properly handled
   - Tag name conflicts are resolved by appending organization suffix
   - Comprehensive validation after migration

4. **Cleans Up**
   - Deletes all empty organizations
   - Verifies data integrity
   - Confirms only one organization remains

## Migration Results

### Test Results (Local Database)
- **Organizations**: 25 → 1 (deleted 24 empty organizations)
- **Users**: 7 users consolidated into master organization
- **Contacts**: 37 contacts consolidated (fixed NULL organization_id issues)
- **Activities**: 14 activities consolidated
- **Events**: 20 events consolidated
- **Final Organization**: "Clear Match Talent"

### Data Integrity Verification
- ✅ All users in master organization
- ✅ All contacts in master organization  
- ✅ All activities in master organization
- ✅ All events in master organization
- ✅ Only one organization remains
- ✅ No orphaned data
- ✅ RLS policies remain functional

## Supporting Scripts

### 1. Backup Script
- **File**: `scripts/backup_before_migration.sql`
- **Purpose**: Creates backup tables before migration
- **Usage**: Run before migration to ensure data safety

### 2. Test Script
- **File**: `scripts/test_migration.sql`
- **Purpose**: Tests migration readiness and shows current state
- **Usage**: Run to understand current data distribution

### 3. RLS Test Script
- **File**: `scripts/test_rls_after_migration.sql`
- **Purpose**: Verifies RLS policies work correctly after migration
- **Usage**: Run after migration to validate security

### 4. Rollback Script
- **File**: `scripts/rollback_single_tenant_consolidation.sql`
- **Purpose**: Provides rollback instructions (requires pre-migration backup)
- **Usage**: Emergency rollback if needed

## Running the Migration

### Prerequisites
1. **Backup**: Create full database backup
2. **Testing**: Test on local/staging environment first
3. **Downtime**: Plan for application downtime during migration

### Steps

1. **Create Backup**
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/backup_before_migration.sql
   ```

2. **Test Migration Readiness**
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/test_migration.sql
   ```

3. **Run Migration**
   ```bash
   supabase db reset  # This applies the migration
   # OR manually run:
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/migrations/20250711000309_single_tenant_consolidation.sql
   ```

4. **Verify Results**
   ```bash
   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f scripts/test_rls_after_migration.sql
   ```

## Post-Migration Considerations

### RLS Policies
- Current RLS policies use permissive rules (`USING (true)`)
- Single-tenant setup makes organization-based filtering redundant
- Consider simplifying policies for single-tenant operation
- All existing organization-based policies will continue to work

### Application Changes
- No application code changes required
- All existing functionality continues to work
- Organization-based filtering becomes redundant but harmless

### Database Schema
- No schema changes beyond data migration
- All foreign key relationships preserved
- All indexes remain intact
- All constraints remain functional

## Rollback Process

### If Immediate Rollback Needed
1. **Stop Application**: Prevent new data creation
2. **Restore from Backup**: Use pre-migration backup
3. **Verify Data**: Ensure all data is restored correctly
4. **Restart Application**: Resume normal operations

### Rollback Command Example
```bash
# Stop application
# Create safety backup of current state
supabase db dump --data-only > post_migration_backup.sql

# Restore from pre-migration backup
supabase db reset
# Restore your pre-migration backup here

# Verify and restart application
```

## Technical Notes

### Migration Safety Features
- **Comprehensive Validation**: Multiple integrity checks
- **Error Handling**: Migration fails fast on any validation error
- **Logging**: Detailed progress logging throughout migration
- **Rollback Safety**: Preserves ability to rollback via backup

### Performance Considerations
- Migration is designed for safety over speed
- Uses standard UPDATE operations (not bulk operations)
- Includes progress reporting for monitoring
- Suitable for databases with thousands of records

### Edge Cases Handled
- NULL organization_id values
- Tag name conflicts across organizations
- Empty organizations
- Missing `updated_at` columns on some tables
- Validation failures cause full rollback

## Success Criteria

### Migration Success Indicators
- [ ] Only one organization exists named "Clear Match Talent"
- [ ] All users have the same organization_id
- [ ] All contacts have the same organization_id
- [ ] All activities have the same organization_id
- [ ] All events have the same organization_id
- [ ] All templates have the same organization_id
- [ ] All tags have the same organization_id
- [ ] All job postings have the same organization_id
- [ ] No orphaned data remains
- [ ] Application functions normally
- [ ] RLS policies work correctly

### Post-Migration Verification
```sql
-- Verify single organization
SELECT COUNT(*) FROM organizations; -- Should be 1

-- Verify all data in master organization
SELECT 
    (SELECT COUNT(*) FROM profiles WHERE organization_id = (SELECT id FROM organizations)) as users,
    (SELECT COUNT(*) FROM contacts WHERE organization_id = (SELECT id FROM organizations)) as contacts,
    (SELECT COUNT(*) FROM activities WHERE organization_id = (SELECT id FROM organizations)) as activities,
    (SELECT COUNT(*) FROM events WHERE organization_id = (SELECT id FROM organizations)) as events;
```

## Contact Information

For questions or issues with this migration:
- **Author**: Claude AI Assistant
- **Issue**: GitHub #116
- **Date**: July 11, 2025
- **Type**: Phase 1 Single-Tenant Consolidation