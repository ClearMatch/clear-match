# Environment Migration Instructions

This guide provides step-by-step instructions to migrate from your current setup (main → production) to the new three-environment system (staging → main → production).

## Current State
- **main branch** → Deploys to production Vercel & Supabase
- **Developers** → Using production Supabase from local

## Target State
- **staging branch** → Deploys to staging (your current production becomes staging)
- **main branch** → Golden source (no deployments)
- **production branch** → Deploys to new production environment

## Real-World Context

**Based on actual Clear Match Vercel setup (as of 2025-07-18):**

### Current State
- **Single Vercel project** with team account
- **Environment variables** set per environment in Vercel (not prefixed)
- **Branches already created**: main, staging, production
- **Simple local setup**: Only 3 environment variables needed locally

### Key Learnings
- Vercel automatically manages different variable values per environment
- No need for complex variable prefixing (DEV_*, STAGING_*, PROD_*)
- The application uses `NEXT_PUBLIC_*` prefix for client-side variables
- Vercel adds additional variables (like Postgres) that aren't needed locally

## Simplified Migration Approach

### Recommended Strategy

Use your **existing single Vercel project** with proper environment configuration:

1. **Keep current Vercel project** - No need for multiple projects
2. **Set production branch** to `production` in Vercel settings
3. **Update environment variables** per environment in Vercel dashboard
4. **Use Vercel's built-in environment system** - It handles the complexity for you

This approach matches your current setup and Vercel best practices.

## Migration Overview

### How Vercel's GitHub App Integration Actually Works

Vercel's GitHub app integration behavior can be controlled through configuration:
- **Default behavior**: main branch creates "Production" deployments, other branches create "Preview" deployments
- **Configurable**: This behavior can be customized using `vercel.json` configuration files
- **Production branch flexibility**: You can configure any branch to be the production branch

We have two deployment strategy options:

**Option A: Single Project with Branch Configuration (Recommended)**
- Use `vercel.json` to configure which branches deploy to production
- Configure staging and production branches within one project
- Use environment variables to point to different databases

**Option B: Two Vercel Projects (Alternative)**
- Current project → Becomes staging (uses staging Supabase)
- New project → Becomes production (uses new production Supabase)
- Both projects can be configured to deploy from any branch

## Migration Steps

### Phase 1: GitHub Configuration ✅ COMPLETED

#### 1.1 Create New Branches ✅ COMPLETED

**Branches Created:**
- `main` - Golden source branch (existing)
- `staging` - Staging environment branch ✅
- `production` - Production environment branch ✅
- Currently on branch `9` for development work

#### 1.2 Update Branch Protection Rules ✅ COMPLETED

**Branch Protection Active:**
- Main branch protection configured
- Staging branch protection configured  
- Production branch protection configured

Go to **Settings → Branches** in your GitHub repository for reference:

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

### Phase 2: Vercel Configuration 🚧 READY FOR MANUAL COMPLETION

**Current Status**: Production Supabase is ready. Environment variables prepared. Manual Vercel configuration needed.

**NEXT STEPS TO COMPLETE:**
1. **Update Vercel environment variables** (see `production-env-variables.txt`)
2. **Set production branch** to `production` in Vercel settings
3. **Test both environments**

**Important**: With Vercel's GitHub app integration, we'll work with their default behavior where `main` is always the production branch. We'll use a domain-based approach instead.

#### 2.1 Understanding Vercel's Configurable Behavior

- **Default**: main branch → Production deployment, other branches → Preview deployments
- **Configurable**: Can be customized using `vercel.json` with `git.deploymentEnabled` settings
- **Production branch**: Can be configured to be any branch (staging, production, main, etc.)
- **Environment targeting**: Use `vercel deploy --target=<environment>` for specific environments

#### 2.2 Option A: Configure Single Project with Branch Rules (Recommended)

**Create vercel.json configuration:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": false,
      "staging": true,
      "production": true
    }
  }
}
```

This configuration:
- Disables automatic deployments from `main` branch
- Enables deployments from `staging` branch (creates preview deployments)
- Enables deployments from `production` branch (creates production deployments)

**Configure production branch:**
1. Go to your Vercel project settings
2. Navigate to **Git** section  
3. Change **Production Branch** from `main` to `production`
4. Save settings

**Alternative: Use CLI targeting:**
```bash
# Deploy to specific environment regardless of branch
vercel deploy --target=production
vercel deploy --target=preview
```

#### 2.3 Option B: Keep Current Vercel Project for Staging (Alternative)

Your current Vercel project will become staging:

1. **Environment variables are already backed up** (see `docs/vercel-config/`)

2. **Update Environment Variables Strategy** 🚧 READY FOR MANUAL COMPLETION:
   - Go to **Settings → Environment Variables**
   - **DO NOT create prefixed variables** (no STAGING_*, PROD_*, etc.)
   - Instead, use Vercel's environment selector:
     - Set different values for the SAME variable name per environment
     - Example: `NEXT_PUBLIC_SUPABASE_URL` has different values for Production vs Preview
   
3. **Variables to update** ✅ PREPARED:
   ```
   # All production values are prepared in production-env-variables.txt
   NEXT_PUBLIC_SUPABASE_URL       # Production: aogbiuouulzurceewpye.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY  # Production: [new production key]
   SUPABASE_SERVICE_ROLE_KEY      # Production: [new production key]  
   SUPABASE_URL                   # Production: aogbiuouulzurceewpye.supabase.co
   SUPABASE_ANON_KEY              # Production: [new production key]
   ```

   **Action Required**: Copy values from `production-env-variables.txt` to Vercel Dashboard

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

4. **Configure production branch**: Set the production branch to your desired branch (e.g., `production`) in project settings

5. **Configure Environment Variables** (if using two projects):
   ```
   # Use the SAME variable names as staging, NOT prefixed versions
   NEXT_PUBLIC_SUPABASE_URL=<will-get-from-new-supabase>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<will-get-from-new-supabase>
   SUPABASE_SERVICE_ROLE_KEY=<will-get-from-new-supabase>
   SUPABASE_URL=<will-get-from-new-supabase>
   SUPABASE_ANON_KEY=<will-get-from-new-supabase>
   HUBSPOT_ACCESS_TOKEN=<your-existing-hubspot-key>
   PARAGON_PROJECT_ID=<your-existing-paragon-id>
   ```

6. **Add Production Domain**:
   - Go to **Settings → Domains** in the new project
   - Add your production domain: `yourdomain.com` or `www.yourdomain.com`
   - This will be configured after you remove it from the current project

### Phase 3: Supabase Configuration

#### 3.1 Current Supabase Becomes Staging

No changes needed - your current Supabase project automatically becomes the staging database.

#### 3.2 Create New Production Supabase Project ✅ COMPLETED

**Production Supabase Project Created:**
- **Name**: `clear-match-production`
- **Project ID**: `aogbiuouulzurceewpye`
- **Region**: us-west-1 (same as staging)
- **Plan**: Pro ($10/month)
- **Status**: Active and healthy

#### 3.3 Migrate Schema to Production ✅ COMPLETED

**Schema Migration Completed:**
- Applied all 31 migration files to production database
- 9 tables created with proper structure and relationships:
  - `organizations`, `profiles`, `contacts`, `activities`, `events`, `job_postings`, `tags`, `contact_tags`, `templates`
- All RLS policies migrated and functional
- All foreign key relationships established
- All indexes and constraints applied

#### 3.4 Configure Production RLS Policies ✅ COMPLETED

**RLS Security Implemented:**
- All tables have Row Level Security enabled
- Organization-based isolation policies active
- Helper function `get_user_organization_id()` created
- Comprehensive policies for SELECT, INSERT, UPDATE, DELETE operations
- Junction table `contact_tags` properly configured

#### 3.5 Get Production Credentials ✅ COMPLETED

**Production Database Credentials:**
- **Project URL**: `https://aogbiuouulzurceewpye.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvZ2JpdW91dWx6dXJjZWV3cHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjI4OTUsImV4cCI6MjA2ODQzODg5NX0.3C2cAOZHF7k3E7XRIXsNZO419COiGGCH0FKme6CkV64`
- **Service Role Key**: Available from Supabase dashboard → Settings → API

**Next Step**: Update Vercel environment variables with these credentials ✅ PREPARED

**Environment Variables Ready**: All production database credentials are prepared in `production-env-variables.txt` file (git-ignored for security).

### Phase 4: Update Application Code

#### 4.1 Update Environment Variables

**Important**: Based on the actual Clear Match setup, the application does NOT use prefixed environment variables. Update `.env.example` to reflect the actual variables used:

```bash
# Core Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Only if your app uses these server-side
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Third-party integrations
HUBSPOT_ACCESS_TOKEN=your_hubspot_token
PARAGON_PROJECT_ID=your_paragon_id
```

**Note**: Vercel will automatically provide the correct values based on the environment (production, preview, development).

#### 4.2 Update Developer .env.local Files

Send this to all developers:

```bash
# UPDATE YOUR .env.local FILE
# Our current production database is becoming staging
# Your local setup remains simple - just 3 variables:

NEXT_PUBLIC_SUPABASE_URL=<current-production-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<current-production-anon-key>
HUBSPOT_ACCESS_TOKEN=<existing-hubspot-key>

# That's it! No complex prefixes or environment detection needed.
# The app uses these same variable names across all environments.
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

#### Option A: Single Project with Branch Configuration

**For Staging Testing:**
1. **Create feature branches** from `main`
2. **Push to feature branch** → Creates preview deployment
3. **Merge to staging** → Creates staging deployment (preview environment)
4. **Test using staging URL**

**For Production Deployment:**
1. **Merge staging to main** → No automatic deployment (disabled in vercel.json)
2. **Create PR from main to production** → Review and approve
3. **Merge to production** → Triggers production deployment

**Domain Management:**
- **Staging deployments**: Use staging subdomain or preview URLs
- **Production deployments**: Use production domain
- Environment variables automatically set based on branch/environment

#### Option B: Two Projects Strategy

**For Staging Testing:**
1. **Create feature branches** from `main`
2. **Push to feature branch** → Creates preview deployment in staging project
3. **Test using preview URL**
4. **Merge to main** → Staging project deploys, production project can be configured to deploy from `production` branch

**For Production Deployment:**
1. **Ensure main branch is tested** in staging
2. **Create production branch from main**
3. **Production project deploys** from `production` branch

**Domain Management:**
- **Staging project**: `staging.yourdomain.com`
- **Production project**: `yourdomain.com`
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

## HOW TO RESUME AFTER BREAK 🚀

**Current Status**: Production Supabase database is ready. Environment variables prepared. Ready for manual Vercel configuration.

### Immediate Next Steps

1. **Update Vercel Environment Variables** (5 minutes)
   - Open `production-env-variables.txt` (git-ignored file with all credentials)
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update PRODUCTION environment only (leave Preview/Development as-is)
   - Copy each variable from the file to Vercel

2. **Configure Production Branch** (2 minutes)
   - In same Vercel project settings → Git section
   - Change Production Branch from `main` to `production`
   - Save settings

3. **Test Both Environments** (10 minutes)
   - Deploy to staging branch → Should use staging database (zkqeoppjgdyzarkhhbqc)
   - Deploy to production branch → Should use production database (aogbiuouulzurceewpye)
   - Verify database connections work correctly

4. **Update Documentation** (5 minutes)
   - Mark Phase 2 as completed in this file
   - Document any issues encountered
   - Update team on new workflow

### Files to Reference

- `production-env-variables.txt` - All credentials ready to copy
- `docs/vercel-env-backup-20250718.txt` - Current variable backup
- `docs/migration-progress-20250718.md` - Detailed session notes

### What's Already Done ✅

- Production Supabase project created and configured
- Database schema migrated (9 tables, RLS policies)
- GitHub branches and protection rules set up
- Environment variables prepared and secured
- Documentation updated with progress

### What's Left to Do 🚧

- Manual Vercel environment variable updates
- Set production branch in Vercel settings
- Test deployments to both environments
- Final verification and team communication

## Success Criteria

Migration is complete when:

- ✅ Developers commit to feature branches
- ✅ Staging auto-deploys from `staging` branch
- ✅ Main branch updates don't trigger deployments
- ✅ Production deploys only from `production` branch
- ✅ All environments have correct database connections
- ✅ Team is trained on new workflow
- ✅ Monitoring/alerts configured for all environments