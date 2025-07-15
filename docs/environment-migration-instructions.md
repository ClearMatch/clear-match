# Environment Migration Instructions

This guide provides step-by-step instructions to migrate from your current setup (main → production) to the new three-environment system (staging → main → production).

## Current State
- **main branch** → Deploys to production Vercel & Supabase
- **Developers** → Using production Supabase from local

## Target State
- **staging branch** → Deploys to staging (your current production becomes staging)
- **main branch** → Golden source (no deployments)
- **production branch** → Deploys to new production environment

## Migration Steps

### Phase 1: GitHub Configuration

#### 1.1 Create New Branches

```bash
# First, ensure main is up to date
git checkout main
git pull origin main

# Create staging branch from current main
git checkout -b staging
git push -u origin staging

# Create production branch from main
git checkout main
git checkout -b production
git push -u origin production
```

#### 1.2 Update Branch Protection Rules

Go to **Settings → Branches** in your GitHub repository:

**For `main` branch:**
- ✅ Require pull request before merging
- ✅ Require approvals: 2
- ✅ Dismiss stale pull request approvals
- ✅ Require status checks to pass:
  - `test`
  - `build-check`
- ✅ Require branches to be up to date
- ✅ Include administrators
- ❌ Allow force pushes (disable)

**For `staging` branch:**
- ✅ Require pull request before merging
- ✅ Require approvals: 1
- ✅ Require status checks to pass:
  - `test`
  - `build-check`
- ❌ Require branches to be up to date (optional)
- ✅ Allow force pushes (for emergency resets)
- Allowed users: Development team

**For `production` branch:**
- ✅ Require pull request before merging
- ✅ Require approvals: 2
- ✅ Restrict who can push: Add specific deployment team members
- ✅ Allow force pushes
- ✅ Allow deletions: No
- Allowed users: Deployment team only

### Phase 2: Vercel Configuration

#### 2.1 Update Current Vercel Project (Becomes Staging)

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Git**
3. Change **Production Branch** from `main` to `staging`
4. Under **Ignored Build Step**, ensure it's set to "Automatic"

#### 2.2 Update Environment Variables for Staging

1. Go to **Settings → Environment Variables**
2. For each existing variable, change scope:
   - Remove from "Production"
   - Add to "Preview" and "Development"
3. Rename variables to staging-specific:
   ```
   NEXT_PUBLIC_SUPABASE_URL → STAGING_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY → STAGING_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY → STAGING_SUPABASE_SERVICE_ROLE_KEY
   ```

#### 2.3 Create New Vercel Project for Production

1. Go to Vercel Dashboard → Add New Project
2. Import the same GitHub repository
3. Configure:
   - **Project Name**: `clear-match-production`
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build`
   - **Production Branch**: `production`

4. Add Production Environment Variables:
   ```
   PROD_SUPABASE_URL=<will-get-from-new-supabase>
   PROD_SUPABASE_ANON_KEY=<will-get-from-new-supabase>
   PROD_SUPABASE_SERVICE_ROLE_KEY=<will-get-from-new-supabase>
   HUBSPOT_API_KEY=<your-existing-hubspot-key>
   ```

### Phase 3: Supabase Configuration

#### 3.1 Current Supabase Becomes Staging

No changes needed - your current Supabase project automatically becomes the staging database.

#### 3.2 Create New Production Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Configure:
   - **Name**: `clear-match-production`
   - **Database Password**: Generate and save securely
   - **Region**: Same as current (for consistency)
   - **Pricing Plan**: Pro (recommended for production)

4. Wait for project to be provisioned

#### 3.3 Migrate Schema to Production

```bash
# Install Supabase CLI if not already installed
brew install supabase/tap/supabase

# Pull schema from staging (current production)
supabase db pull \
  --db-url "postgresql://postgres:[YOUR-CURRENT-PASSWORD]@db.[YOUR-CURRENT-PROJECT-REF].supabase.co:5432/postgres" \
  --schema public,auth

# Link to new production project
supabase link --project-ref [NEW-PRODUCTION-PROJECT-REF]

# Push schema to production
supabase db push
```

#### 3.4 Configure Production RLS Policies

1. Go to new production Supabase dashboard
2. Navigate to **Authentication → Policies**
3. Verify all RLS policies were migrated correctly
4. Test with a sample query to ensure policies work

#### 3.5 Get Production Credentials

From the new production Supabase dashboard:
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `PROD_SUPABASE_URL`
   - **anon/public key** → `PROD_SUPABASE_ANON_KEY`
   - **service_role key** → `PROD_SUPABASE_SERVICE_ROLE_KEY`

3. Add these to your Production Vercel project

### Phase 4: Update Application Code

#### 4.1 Update Environment Detection

The application already has multi-environment support, but verify `.env.example` is updated:

```bash
# Development (points to staging database)
DEV_SUPABASE_URL=<your-current-supabase-url>
DEV_SUPABASE_ANON_KEY=<your-current-anon-key>
DEV_SUPABASE_SERVICE_ROLE_KEY=<your-current-service-key>

# Staging
STAGING_SUPABASE_URL=<your-current-supabase-url>
STAGING_SUPABASE_ANON_KEY=<your-current-anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<your-current-service-key>

# Production
PROD_SUPABASE_URL=<new-production-url>
PROD_SUPABASE_ANON_KEY=<new-production-anon-key>
PROD_SUPABASE_SERVICE_ROLE_KEY=<new-production-service-key>
```

#### 4.2 Update Developer .env.local Files

Send this to all developers:

```bash
# UPDATE YOUR .env.local FILE
# Our current production is now staging
# Update your local environment to point to staging

APP_ENV=staging

# These remain the same (pointing to what is now staging)
STAGING_SUPABASE_URL=<current-supabase-url>
STAGING_SUPABASE_ANON_KEY=<current-anon-key>
STAGING_SUPABASE_SERVICE_ROLE_KEY=<current-service-key>

HUBSPOT_API_KEY=<existing-hubspot-key>
```

### Phase 5: GitHub Actions Updates

The existing workflows should work, but verify:

1. **`.github/workflows/staging-ci.yml`** exists and is configured correctly
2. **`.github/workflows/production-deploy.yml`** exists with commit validation
3. **`.github/workflows/test.yml`** runs on main branch

### Phase 6: Testing & Validation

#### 6.1 Test Staging Deployment

```bash
# Make a small change
git checkout staging
echo "# Staging Test" >> README.md
git add README.md
git commit -m "test: staging deployment"
git push origin staging
```

Verify:
- GitHub Actions run successfully
- Vercel deploys to staging URL
- Application connects to staging Supabase

#### 6.2 Test Main Branch (No Deployment)

```bash
# Create PR from staging to main
gh pr create --base main --title "Test: Main branch no-deploy"

# Merge PR
# Verify NO deployment happens
```

#### 6.3 Test Production Deployment

```bash
# Reset production to main
git checkout production
git reset --hard origin/main
git push --force-with-lease origin production
```

Verify:
- Production Vercel project deploys
- Application connects to new production Supabase
- All features work correctly

### Phase 7: Cutover Checklist

Before going live with new production:

- [ ] All developers updated their `.env.local` files
- [ ] Staging deployments working from `staging` branch
- [ ] Main branch protection rules active
- [ ] Production branch protection rules active
- [ ] New production Supabase has schema migrated
- [ ] New production Vercel project has all env vars
- [ ] Test user can log in to new production
- [ ] Backup current production data
- [ ] Document rollback procedure
- [ ] Notify team of cutover time

### Phase 8: DNS Cutover (Production Go-Live)

1. **Note current Vercel production domain**
2. **In old Vercel project (now staging)**:
   - Remove production domain
   - Add staging subdomain (e.g., `staging.clearmatch.app`)
3. **In new Vercel production project**:
   - Add production domain
   - Verify DNS propagation

### Phase 9: Post-Migration

1. **Monitor new production** for 24-48 hours
2. **Keep old setup** for 1 week as backup
3. **Document any issues** encountered
4. **Update team documentation**
5. **Schedule team training** on new workflow

## Rollback Plan

If issues arise:

1. **Immediate Rollback (DNS)**:
   - Switch domain back to old Vercel project
   - Takes effect in minutes

2. **Code Rollback**:
   ```bash
   git checkout main
   git reset --hard <last-known-good>
   git push --force origin staging
   ```

3. **Database Rollback**:
   - Use Supabase point-in-time recovery
   - Restore from backup if needed

## Communication Template

Send to team:

```
Subject: Important: Clear Match Environment Migration - Action Required

Team,

We're migrating to a new three-environment system on [DATE]. 

**What's Changing:**
- Current production → Becomes staging environment  
- New production environment with separate database
- Main branch becomes golden source (no auto-deploy)

**Action Required by [DATE]:**
1. Pull latest main branch
2. Update your .env.local file (see attached template)
3. Test your local setup connects properly

**New Workflow:**
- Feature branches → staging (auto-deploy for testing)
- staging → main (code review, no deploy)
- main → production (manual deployment)

**Timeline:**
- [DATE]: Migration begins
- [DATE]: Staging ready for use
- [DATE]: Production cutover
- [DATE]: Old system decommissioned

Please acknowledge receipt and complete the required actions.

Questions? Reach out in #engineering
```

## Success Criteria

Migration is complete when:

- ✅ Developers commit to feature branches
- ✅ Staging auto-deploys from `staging` branch
- ✅ Main branch updates don't trigger deployments
- ✅ Production deploys only from `production` branch
- ✅ All environments have correct database connections
- ✅ Team is trained on new workflow
- ✅ Monitoring/alerts configured for all environments