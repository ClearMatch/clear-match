# Clear Match Environment Setup Guide

This guide covers the setup for staging and production environments with a specific branch strategy where `main` is the golden source, `staging` deploys to staging environment, and `production` deploys to production.

## Table of Contents
1. [Branch Strategy Overview](#branch-strategy-overview)
2. [Converting Current Setup to Staging](#converting-current-setup-to-staging)
3. [Production Environment Setup](#production-environment-setup)
4. [GitHub Actions Configuration](#github-actions-configuration)
5. [Environment Variables](#environment-variables)
6. [Monitoring Setup](#monitoring-setup)
7. [Deployment Workflow](#deployment-workflow)

## Branch Strategy Overview

```
feature branches → staging (auto-deploy) → main (golden) → production (manual reset & deploy)
```

- **Feature branches**: Development work
- **staging**: Testing environment (auto-deploys)
- **main**: Golden source code (no deployments)
- **production**: Production deployments (manual reset from main)

## Converting Current Setup to Staging

Your existing Supabase project will become the staging environment. Here's how to reconfigure:

### 1. Update Vercel Deployment Settings

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Git**
3. Change the **Production Branch** from `main` to `production`
4. Configure branch deployments:
   - Remove any deployment trigger from `main`
   - Ensure `staging` branch creates preview deployments

### 2. Create Staging Branch

```bash
# Create staging branch from current main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### 3. Update Environment Variables in Vercel

Since your current Supabase project is becoming staging, update the environment variables:

1. Go to **Settings → Environment Variables**
2. Add/update for **Preview** environment (staging):

```bash
# Your current Supabase becomes staging
STAGING_SUPABASE_URL=https://zkqeoppjgdyzarkhhbqc.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Get service role key from Supabase dashboard
STAGING_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# HubSpot (shared across environments)
HUBSPOT_ACCESS_TOKEN=na2-6ec4-e94c-4e62-a10a-814d6c210c02
```

## Production Environment Setup

### 1. Create New Supabase Project for Production

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project:
   - Name: `clear-match-production`
   - Password: Generate and save securely
   - Region: Same as staging for consistency

### 2. Migrate Schema to Production

```bash
# Using Supabase CLI
# First, pull schema from staging
supabase db pull --db-url "postgresql://postgres:[staging-password]@db.zkqeoppjgdyzarkhhbqc.supabase.co:5432/postgres"

# Link to production project
supabase link --project-ref your-production-project-ref

# Push schema to production
supabase db push
```

### 3. Set Production Environment Variables in Vercel

For **Production** environment only:

```bash
PROD_SUPABASE_URL=https://your-production-project.supabase.co
PROD_SUPABASE_ANON_KEY=your-production-anon-key
PROD_SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# HubSpot
HUBSPOT_ACCESS_TOKEN=na2-6ec4-e94c-4e62-a10a-814d6c210c02
```

### 4. Create Production Branch

```bash
# Create production branch from main
git checkout main
git checkout -b production
git push -u origin production
```

## GitHub Actions Configuration

Create `.github/workflows/staging-ci.yml`:

```yaml
name: Staging CI/CD

on:
  push:
    branches: [staging]
  pull_request:
    branches: [staging]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Enable Corepack
        run: corepack enable
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linting
        run: pnpm lint
        
      - name: Type check
        run: pnpm exec tsc --noEmit
        
      - name: Run tests
        run: pnpm test
        env:
          NODE_ENV: test

  deploy-check:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - name: Deployment Status
        run: echo "Tests passed! Vercel will auto-deploy to staging."
```

Create `.github/workflows/production-deploy.yml`:

```yaml
name: Production Deployment

on:
  push:
    branches: [production]

jobs:
  deploy-notification:
    runs-on: ubuntu-latest
    steps:
      - name: Deployment Started
        run: |
          echo "🚀 Production deployment initiated"
          echo "Branch: ${{ github.ref_name }}"
          echo "Commit: ${{ github.sha }}"
```

## Environment Variables

### Update .env.local

Remove Twilio and update for new structure:

```bash
# =============================================================================
# LOCAL DEVELOPMENT
# =============================================================================
# For local development, connect to staging database
STAGING_SUPABASE_URL=https://zkqeoppjgdyzarkhhbqc.supabase.co
STAGING_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Get from Supabase dashboard → Settings → API → Service Role Key
STAGING_SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key

# Force staging environment locally (since devs use staging DB)
APP_ENV=staging

# =============================================================================
# PRODUCTION (for reference - these go in Vercel)
# =============================================================================
# PROD_SUPABASE_URL=https://your-production-project.supabase.co
# PROD_SUPABASE_ANON_KEY=your-production-anon-key
# PROD_SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# =============================================================================
# EXTERNAL SERVICES
# =============================================================================
HUBSPOT_ACCESS_TOKEN=na2-6ec4-e94c-4e62-a10a-814d6c210c02
```

### Update .env.example

Remove Twilio references and update structure to match.

## Monitoring Setup

### Sentry (Recommended - Easy Setup)

1. **Create Sentry Account**
   - Sign up at [sentry.io](https://sentry.io)
   - Create two projects: `clear-match-staging` and `clear-match-production`

2. **Install Sentry**
   ```bash
   pnpm add @sentry/nextjs
   ```

3. **Run Setup Wizard**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

4. **Configure for Multiple Environments**

   Update `sentry.client.config.ts`:
   ```typescript
   import * as Sentry from "@sentry/nextjs";
   import { getEnvironment } from "@/lib/environment";

   const env = getEnvironment();
   const dsn = env === 'production' 
     ? process.env.NEXT_PUBLIC_SENTRY_DSN_PRODUCTION
     : process.env.NEXT_PUBLIC_SENTRY_DSN_STAGING;

   Sentry.init({
     dsn,
     environment: env,
     tracesSampleRate: env === 'production' ? 0.1 : 1.0,
     debug: false,
     replaysOnErrorSampleRate: 1.0,
     replaysSessionSampleRate: env === 'production' ? 0.1 : 0.5,
   });
   ```

5. **Add Environment Variables**

   In Vercel:
   - Preview (Staging): `NEXT_PUBLIC_SENTRY_DSN_STAGING=your-staging-dsn`
   - Production: `NEXT_PUBLIC_SENTRY_DSN_PRODUCTION=your-production-dsn`

### Alternative: LogRocket (User Session Recording)

If you want session replay capabilities:
1. Sign up at [logrocket.com](https://logrocket.com)
2. Install: `pnpm add logrocket`
3. Initialize in `app/layout.tsx`

## Deployment Workflow

### 1. Feature Development
```bash
# Create feature branch from staging
git checkout staging
git pull origin staging
git checkout -b feature/add-new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"
git push origin feature/add-new-feature
```

### 2. Deploy to Staging
```bash
# Create PR to staging branch
# After review, merge PR
# Staging auto-deploys via Vercel
```

### 3. Promote to Main (Golden)
```bash
# After QA passes in staging
# Create PR from staging to main
# Merge after approval (no deployment happens)
```

### 4. Deploy to Production
```bash
# When ready to deploy to production
git checkout production
git pull origin production
git reset --hard origin/main
git push --force origin production
```

**Note**: Use `--force` carefully. Consider using `--force-with-lease` for safety.

### 5. Hotfix Process
```bash
# For urgent production fixes
git checkout -b hotfix/fix-issue origin/production
# Make fix
git push origin hotfix/fix-issue

# PR to production for immediate fix
# Then backport to main and staging
```

## Branch Protection Rules

### For `main` branch:
- Require pull request reviews (2 reviewers)
- Dismiss stale PR approvals
- Require status checks (CI/CD)
- Require up-to-date branches
- Include administrators

### For `staging` branch:
- Require pull request reviews (1 reviewer)
- Require status checks (CI/CD)
- Allow force pushes (for resetting from main if needed)

### For `production` branch:
- Require pull request reviews (2 reviewers)
- Restrict who can push (deployment team only)
- Allow force pushes (for reset from main)

## Quick Reference Commands

```bash
# Check current branch
git branch --show-current

# Deploy to staging
# Just merge PR to staging branch

# Deploy to production
git checkout production
git reset --hard origin/main
git push --force-with-lease origin production

# Check deployment status
# Visit Vercel dashboard or check GitHub Actions

# Rollback production
git checkout production
git reset --hard <previous-good-commit>
git push --force-with-lease origin production
```

## Troubleshooting

### Issue: Developers can't connect to staging DB locally
**Solution**: Ensure `APP_ENV=staging` is set in `.env.local`

### Issue: Production deployment not triggering
**Solution**: Check Vercel's production branch setting is set to `production`

### Issue: Wrong environment detected
**Solution**: Add debug endpoint temporarily:
```typescript
// app/api/debug/env/route.ts
import { NextResponse } from 'next/server'
import { getEnvironment } from '@/lib/environment'

export async function GET() {
  return NextResponse.json({
    environment: getEnvironment(),
    vercelEnv: process.env.VERCEL_ENV,
    appEnv: process.env.APP_ENV,
  })
}
```

## Next Steps

1. Set up Sentry for error monitoring
2. Configure alerts for deployment failures
3. Document production deployment approval process
4. Create runbook for common issues
5. Set up database backups for production