# Clear Match Environment Migration Checklist

## Pre-Migration Status
- [x] GitHub branches created (main, staging, production)
- [x] Branch protection rules configured
- [x] Current environment variables backed up
- [ ] Team notified of migration plan

## Phase 1: Supabase Setup
- [ ] Create new production Supabase project
- [ ] Migrate schema from current (becoming staging) to new production
- [ ] Verify RLS policies in new production
- [ ] Test new production database connectivity
- [ ] Document new production credentials

## Phase 2: Vercel Configuration (Single Project Approach)

### 2.1 Update Project Settings
- [ ] Change production branch from `main` to `production` in Vercel dashboard
- [ ] Verify deployment settings

### 2.2 Update Environment Variables
For each variable, set different values per environment:

**Production Environment:**
- [ ] NEXT_PUBLIC_SUPABASE_URL → New production Supabase URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY → New production anon key
- [ ] SUPABASE_URL → New production Supabase URL
- [ ] SUPABASE_ANON_KEY → New production anon key
- [ ] SUPABASE_SERVICE_ROLE_KEY → New production service key
- [ ] Keep other variables (HubSpot, Paragon) as-is

**Preview Environment (Staging):**
- [ ] NEXT_PUBLIC_SUPABASE_URL → Current Supabase URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY → Current anon key
- [ ] SUPABASE_URL → Current Supabase URL
- [ ] SUPABASE_ANON_KEY → Current anon key
- [ ] SUPABASE_SERVICE_ROLE_KEY → Current service key
- [ ] Keep other variables (HubSpot, Paragon) as-is

## Phase 3: Testing

### 3.1 Test Staging Branch
- [ ] Push a test commit to staging branch
- [ ] Verify preview deployment created
- [ ] Confirm connection to staging (current) Supabase
- [ ] Test application functionality

### 3.2 Test Production Branch
- [ ] Create PR from main to production
- [ ] Merge to production branch
- [ ] Verify production deployment created
- [ ] Confirm connection to new production Supabase
- [ ] Test application functionality

## Phase 4: Update Team

### 4.1 Developer Communication
- [ ] Send updated .env.local template
- [ ] Explain new branch workflow
- [ ] Document which database they're connecting to locally

### 4.2 Deployment Workflow
- [ ] Document new deployment process
- [ ] Update CI/CD documentation
- [ ] Create deployment runbook

## Phase 5: Cutover

### 5.1 Final Checks
- [ ] Backup current production data
- [ ] Verify all environment variables set correctly
- [ ] Test both environments thoroughly
- [ ] Prepare rollback plan

### 5.2 Go Live
- [ ] Update DNS/domains if needed
- [ ] Monitor for issues
- [ ] Verify all integrations working
- [ ] Team celebration! 🎉

## Post-Migration

### Cleanup (After 1 Week)
- [ ] Remove old environment variables
- [ ] Clean up any temporary branches
- [ ] Archive migration documentation
- [ ] Document lessons learned

## Rollback Plan

If issues arise:
1. **Immediate**: Revert Vercel environment variables to original values
2. **Branch Config**: Change production branch back to `main`
3. **Database**: Keep both Supabase instances until stability confirmed

## Important Notes

1. **No variable prefixing needed** - Vercel handles environment separation
2. **Keep it simple** - Use the same variable names across environments
3. **Test thoroughly** - Each environment should be validated independently
4. **Communication is key** - Keep the team informed throughout