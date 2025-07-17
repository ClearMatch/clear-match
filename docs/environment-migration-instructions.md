# Environment Migration Instructions

This guide provides step-by-step instructions to migrate from your current setup (main → production) to the new three-environment system (staging → main → production).

## Current State
- **main branch** → Deploys to production Vercel & Supabase
- **Developers** → Using production Supabase from local

## Target State
- **staging branch** → Deploys to staging (your current production becomes staging)
- **main branch** → Golden source (no deployments)
- **production branch** → Deploys to new production environment

## Migration Overview

### How Vercel's GitHub App Integration Works

With the GitHub app integration, Vercel has fixed branch → deployment mappings:
- **main branch** → Always creates "Production" deployments
- **All other branches** → Always create "Preview" deployments

Since we can't change this behavior, we'll use **two Vercel projects**:
1. **Current project** → Becomes staging (uses staging Supabase)
2. **New project** → Becomes production (uses new production Supabase)

Both projects will deploy from `main`, but serve different domains and use different databases.

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

**Important**: With Vercel's GitHub app integration, we'll work with their default behavior where `main` is always the production branch. We'll use a domain-based approach instead.

#### 2.1 Understanding Vercel's Default Behavior

- **main branch** → Production deployment (can't change this)
- **All other branches** → Preview deployments
- We'll use domains to control which deployment serves which environment

#### 2.2 Keep Current Vercel Project for Staging

Your current Vercel project will become staging:

1. **First, backup your environment variables**:
   - Go to **Settings → Environment Variables**
   - Copy all variables to a text file
   - Note which environment each is set for

2. **Update Environment Variables** (keep them in place):
   - Go to **Settings → Environment Variables**
   - Add these new variables for **all environments**:
   ```
   STAGING_SUPABASE_URL=<your-current-supabase-url>
   STAGING_SUPABASE_ANON_KEY=<your-current-anon-key>
   STAGING_SUPABASE_SERVICE_ROLE_KEY=<your-current-service-key>
   ```
   - Keep existing variables for backward compatibility

3. **Configure Domains**:
   - Go to **Settings → Domains**
   - Add a staging subdomain: `staging.yourdomain.com`
   - Once staging branch exists, you'll assign this domain to staging branch deployments

#### 2.3 Create New Vercel Project for Production

1. **Go to Vercel Dashboard** → **Add New Project**
2. **Import the same GitHub repository**
3. **During setup**:
   - **Project Name**: `clear-match-production` (or similar)
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `pnpm build` (or auto-detected)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `pnpm install --frozen-lockfile`

4. **Important**: The new project will also use `main` as production branch (can't change)

5. **Configure Environment Variables** for the new production project:
   ```
   PROD_SUPABASE_URL=<will-get-from-new-supabase>
   PROD_SUPABASE_ANON_KEY=<will-get-from-new-supabase>
   PROD_SUPABASE_SERVICE_ROLE_KEY=<will-get-from-new-supabase>
   HUBSPOT_API_KEY=<your-existing-hubspot-key>
   ```

6. **Add Production Domain**:
   - Go to **Settings → Domains** in the new project
   - Add your production domain: `yourdomain.com` or `www.yourdomain.com`
   - This will be configured after you remove it from the current project

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
- Vercel creates a **preview deployment** (not production)
- Check the preview URL works
- Application connects to staging Supabase (check environment detection)

#### 6.2 Test Main Branch Deployment

```bash
# Create PR from staging to main
gh pr create --base main --title "Test: Main branch deployment"

# Merge PR
```

Verify:
- **Current project**: Deploys as "Production" (will become staging domain later)
- **New production project**: Also deploys from main
- Both deployments work but serve different domains

#### 6.3 Update Domain Assignments

**In Current Vercel Project (Staging)**:
1. Go to **Settings → Domains**
2. Remove your production domain (save it for the new project)
3. Add `staging.yourdomain.com`
4. Assign staging domain to:
   - Branch: `staging`
   - Or keep on `main` if you prefer

**In New Vercel Project (Production)**:
1. Go to **Settings → Domains**
2. Add your production domain that you removed from staging
3. It will automatically use `main` branch deployments

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

### Phase 8: Final Deployment Strategy

Since both Vercel projects deploy from `main`, here's the final workflow:

#### For Staging Testing:
1. **Create feature branches** from `main`
2. **Push to feature branch** → Creates preview deployment in staging project
3. **Test using preview URL**
4. **Merge to main** → Both projects deploy, but serve different domains

#### For Production Deployment:
1. **Ensure main branch is tested** in staging
2. **The new production project automatically deploys** from main
3. **No manual production branch needed** with this setup

#### Domain Management:
- **Staging project**: `staging.yourdomain.com` (points to main deployments)
- **Production project**: `yourdomain.com` (points to main deployments)
- Different environment variables ensure they use different databases

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