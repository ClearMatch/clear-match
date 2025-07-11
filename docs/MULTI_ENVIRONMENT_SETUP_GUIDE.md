# Complete Multi-Environment Setup Guide

This comprehensive guide covers all aspects of setting up multi-environment database separation for Clear Match outside of the application code.

## Overview

This setup creates complete data isolation between development, staging, and production environments, ensuring test data never appears in production and providing safe spaces for development and testing.

## 1. Prerequisites and Local Development Setup

### Development Environment Prerequisites

Before setting up cloud environments, ensure your local development environment is properly configured.

#### Required Software

1. **Docker Desktop**
   - Download from [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - Install and start Docker Desktop
   - Verify installation: `docker --version`

2. **Supabase CLI**
   ```bash
   # Install via npm
   npm install -g supabase@latest
   
   # Or via homebrew (macOS)
   brew install supabase/tap/supabase
   
   # Verify installation
   supabase --version
   ```

3. **Node.js & Package Manager**
   ```bash
   # Node.js 18.17.0 or later
   node --version
   
   # Enable corepack for pnpm
   corepack enable
   pnpm --version
   ```

#### Local Supabase Setup

1. **Initialize Supabase in Project**
   ```bash
   cd clear-match
   supabase init
   ```

2. **Start Local Supabase Stack**
   ```bash
   supabase start
   ```
   
   This will:
   - Pull required Docker images
   - Start PostgreSQL database on port 54322
   - Start Supabase API on port 54321
   - Start Supabase Studio on port 54323
   - Generate local API keys

3. **Expected Output**
   ```
   Started supabase local development setup.
   
           API URL: http://localhost:54321
       GraphQL URL: http://localhost:54321/graphql/v1
            DB URL: postgresql://postgres:postgres@localhost:54322/postgres
        Studio URL: http://localhost:54323
      Inbucket URL: http://localhost:54324
        JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
         anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Apply Database Migrations**
   ```bash
   # Reset and apply all migrations
   supabase db reset
   
   # Or apply migrations incrementally
   supabase db push
   ```

5. **Verify Local Setup**
   - Open Supabase Studio: http://localhost:54323
   - Check that tables and RLS policies are applied
   - Test authentication flow

#### Local Environment Configuration

Create `.env.local` with local Supabase credentials:

```bash
# Development uses local Supabase (Docker)
DEV_SUPABASE_URL=http://localhost:54321
DEV_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DEV_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Other required variables
HUBSPOT_API_KEY=your-hubspot-api-key
SESSION_SECRET=your-32-character-secret-here-abcdefghijklmnop
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: The above keys are standard Supabase local development keys and are safe to use.

#### Local Development Workflow

```bash
# Start local Supabase (if not already running)
supabase start

# Install dependencies
pnpm install

# Start development server
pnpm dev

# In another terminal, open Supabase Studio
open http://localhost:54323

# Stop Supabase when done
supabase stop
```

#### Troubleshooting Local Setup

**Docker Issues**
```bash
# Check Docker is running
docker ps

# Clean up if needed
docker system prune -a

# Restart Supabase
supabase stop
supabase start
```

**Port Conflicts**
```bash
# Check what's using ports
lsof -i :54321
lsof -i :54322
lsof -i :54323

# Kill processes if needed
kill -9 <PID>
```

**Database Reset**
```bash
# Complete reset of local database
supabase db reset

# Or just apply new migrations
supabase db push
```

## 2. Cloud Supabase Project Setup

### Create Two Cloud Supabase Projects

You only need cloud projects for staging and production. Development uses your local Docker setup.

#### Staging Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Name: `clear-match-staging`
4. Choose region closest to your team
5. Set strong database password
6. Save project URL and keys

#### Production Project
1. Create another project: `clear-match-prod`
2. Use same region as staging
3. Strong, unique database password
4. Save project URL and keys

### Configure Each Project

For each Supabase project:

#### Database Schema
```bash
# Apply migrations to each environment
supabase db push --db-url "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"
```

#### Row Level Security (RLS)
- Ensure RLS policies are identical across all environments
- Test policies in development first
- Apply to staging, then production

#### Storage Buckets
- Create same bucket structure in all environments
- Configure identical policies
- Set appropriate CORS settings

## 3. Environment Variable Configuration

### Local Development (.env.local)

Development uses local Supabase via Docker, so use these standard local keys:

```bash
# Development Environment (Local Supabase)
DEV_SUPABASE_URL=http://localhost:54321
DEV_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
DEV_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Other required variables
HUBSPOT_API_KEY=your-hubspot-api-key
SESSION_SECRET=your-32-character-secret-here-abcdefghijklmnop
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Note**: These are the standard Supabase local development keys that work with `supabase start`.

### Vercel Environment Variables

#### For Preview/Staging Environment:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add variables for "Preview" environment:

```
STAGING_SUPABASE_URL = https://your-staging-project-id.supabase.co
STAGING_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STAGING_SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### For Production Environment:
Add variables for "Production" environment:

```
PROD_SUPABASE_URL = https://your-prod-project-id.supabase.co
PROD_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PROD_SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Shared Variables (All Environments):
```
HUBSPOT_API_KEY = your-hubspot-api-key
SESSION_SECRET = your-32-character-secret-here-abcdefghijklmnop
NEXT_PUBLIC_APP_URL = https://your-domain.com
```

## 4. Database Migration Strategy

### Step 1: Set Up Local Development Database

Local development uses Supabase's local stack with Docker:

```bash
# Start local Supabase (if not already running)
supabase start

# Apply all migrations to local database
supabase db reset

# Verify tables were created
supabase db diff
```

### Step 2: Export Schema from Local Development
```bash
# Export current schema for cloud environments
supabase db dump --local > current_schema.sql

# Or if migrating from existing production
supabase db dump --db-url "postgresql://postgres:[PROD_PASSWORD]@[PROD_HOST]:5432/postgres" > schema.sql
```

### Step 3: Apply Schema to Cloud Environments
```bash
# Staging
psql "postgresql://postgres:[STAGING_PASSWORD]@[STAGING_HOST]:5432/postgres" < current_schema.sql

# Production (if new setup)
psql "postgresql://postgres:[PROD_PASSWORD]@[PROD_HOST]:5432/postgres" < current_schema.sql
```

### Step 4: Seed Development Data

Create test data for local development:

```bash
# Create development seed data
cat > supabase/seed.sql << 'EOF'
-- Insert test organizations
INSERT INTO organizations (id, name, domain) VALUES 
  ('dev-org-1', 'Development Org', 'dev.example.com'),
  ('dev-org-2', 'Test Company', 'test.example.com');

-- Insert test users
INSERT INTO profiles (id, organization_id, email, first_name, last_name) VALUES
  ('dev-user-1', 'dev-org-1', 'dev@example.com', 'Dev', 'User'),
  ('test-user-1', 'dev-org-2', 'test@example.com', 'Test', 'User');

-- Insert test candidates
INSERT INTO candidates (organization_id, first_name, last_name, email, status) VALUES
  ('dev-org-1', 'John', 'Doe', 'john.doe@example.com', 'active'),
  ('dev-org-1', 'Jane', 'Smith', 'jane.smith@example.com', 'active'),
  ('dev-org-2', 'Bob', 'Johnson', 'bob.johnson@example.com', 'active');
EOF

# Apply seed data to local development
supabase db reset
```

**Note**: The `supabase/seed.sql` file will be automatically applied when running `supabase db reset`.

## 5. CI/CD Pipeline Configuration

### GitHub Actions (.github/workflows/deploy.yml)

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      # Use development environment for testing
      DEV_SUPABASE_URL: ${{ secrets.DEV_SUPABASE_URL }}
      DEV_SUPABASE_ANON_KEY: ${{ secrets.DEV_SUPABASE_ANON_KEY }}
      DEV_SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.DEV_SUPABASE_SERVICE_ROLE_KEY }}
      HUBSPOT_API_KEY: ${{ secrets.HUBSPOT_API_KEY }}
      SESSION_SECRET: ${{ secrets.SESSION_SECRET }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - name: Deploy to Vercel Preview
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Required GitHub Secrets:
```
DEV_SUPABASE_URL
DEV_SUPABASE_ANON_KEY
DEV_SUPABASE_SERVICE_ROLE_KEY
HUBSPOT_API_KEY
SESSION_SECRET
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 6. Testing Your Setup

### Verification Checklist

#### Local Development
```bash
# Start local Supabase
supabase start

# Start development server
pnpm dev

# Check logs for environment detection
# Should see: "[Supabase] Using development environment"

# Open Supabase Studio to verify local database
open http://localhost:54323

# Create test data and verify it doesn't appear in cloud environments
```

#### Staging Environment
```bash
# Deploy preview branch
git checkout -b test-staging
git push origin test-staging

# Check Vercel preview deployment
# Should see: "[Supabase] Using staging environment"
```

#### Production Environment
```bash
# Deploy to main
git checkout main
git push origin main

# Check production deployment
# Should see no debug logs (production mode)
```

### Database Verification Script

```javascript
// test-environments.js
async function testEnvironmentSeparation() {
  const environments = [
    { name: 'dev', url: 'http://localhost:54321' }, // Local development
    { name: 'staging', url: process.env.STAGING_SUPABASE_URL },
    { name: 'prod', url: process.env.PROD_SUPABASE_URL }
  ];
  
  for (const env of environments) {
    try {
      const apiKey = env.name === 'dev' 
        ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
        : process.env[`${env.name.toUpperCase()}_SUPABASE_ANON_KEY`];
        
      const response = await fetch(`${env.url}/rest/v1/candidates?select=count`, {
        headers: { 'apikey': apiKey }
      });
      const data = await response.json();
      console.log(`${env.name}: ${data.length || 0} candidates`);
    } catch (error) {
      console.error(`${env.name}: Error -`, error.message);
    }
  }
}

testEnvironmentSeparation();
```

## 7. Security Considerations

### Access Control

#### Development (Local)
- Full team access via local Docker setup
- No cloud credentials needed for development
- Permissive RLS for testing
- Debug logging enabled
- Local data only - completely isolated

#### Staging
- Limited access (leads + QA)
- Production-like RLS policies
- Some debug logging
- Cloud-hosted for team collaboration

#### Production
- Minimal access (ops team only)
- Strict RLS policies
- No debug logging
- Regular backups
- Highest security measures

### Key Rotation Schedule

```bash
# Monthly rotation for development
# Quarterly rotation for staging
# Bi-annual rotation for production

# Script for key rotation
#!/bin/bash
ENV=$1
echo "Rotating keys for $ENV environment..."

# Generate new keys in Supabase dashboard
# Update environment variables in Vercel
# Update local .env files
# Test deployment

echo "Key rotation complete for $ENV"
```

## 8. Monitoring and Maintenance

### Database Monitoring

```sql
-- Monitor database usage per environment
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins DESC;
```

### Performance Monitoring

```javascript
// Add to middleware for tracking
const perfStart = Date.now();
// ... supabase operations
const perfEnd = Date.now();
console.log(`[${env}] Database operation took ${perfEnd - perfStart}ms`);
```

## 9. Troubleshooting Guide

### Common Issues

#### Wrong Environment Detection

```bash
# Check current environment
NODE_ENV=production VERCEL_ENV=preview node -e "
  const { getEnvironment } = require('./src/lib/environment');
  console.log('Detected environment:', getEnvironment());
"
```

#### Database Connection Issues

```bash
# Test connection
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -c "SELECT version();"
```

#### Missing Environment Variables

```bash
# Verify all required variables are set
node -e "
  const { validateEnvironment } = require('./src/lib/env');
  try {
    validateEnvironment();
    console.log('✅ All environment variables valid');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
  }
"
```

### Environment Detection Issues

If the wrong environment is being detected:

1. **Check Variable Precedence**
   - `APP_ENV` has highest priority
   - `VERCEL_ENV` is second
   - `NODE_ENV` is fallback

2. **Verify Deployment Settings**
   - Ensure Vercel sets `VERCEL_ENV` correctly
   - Check preview vs production deployment settings

3. **Debug Environment Detection**
   ```javascript
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('VERCEL_ENV:', process.env.VERCEL_ENV);
   console.log('APP_ENV:', process.env.APP_ENV);
   ```

### Database Migration Issues

If migrations fail on specific environments:

1. **Check Database Permissions**
   ```sql
   SELECT current_user, session_user, current_database();
   ```

2. **Verify Schema Compatibility**
   ```bash
   # Compare schemas between environments
   pg_dump --schema-only "postgresql://..." > env1_schema.sql
   pg_dump --schema-only "postgresql://..." > env2_schema.sql
   diff env1_schema.sql env2_schema.sql
   ```

3. **Test Migration in Isolation**
   ```bash
   # Test on development first
   supabase db reset --local
   supabase db push --local
   ```

## 10. Best Practices

### Development Workflow

1. **Always start with development environment**
2. **Test thoroughly in staging before production**
3. **Use feature flags for risky changes**
4. **Maintain identical schema across environments**

### Data Management

1. **Never copy production data to other environments**
2. **Use synthetic test data in development/staging**
3. **Regularly clean up test data**
4. **Backup production data separately**

### Security

1. **Rotate keys regularly**
2. **Use different passwords for each environment**
3. **Limit access to production credentials**
4. **Monitor access logs regularly**

## 11. Quick Reference

### Environment Variables by Environment

| Variable | Development (Local) | Staging | Production |
|----------|---------------------|---------|------------|
| Supabase URL | `http://localhost:54321` | `STAGING_SUPABASE_URL` | `PROD_SUPABASE_URL` |
| Anon Key | Standard local key | `STAGING_SUPABASE_ANON_KEY` | `PROD_SUPABASE_ANON_KEY` |
| Service Key | Standard local key | `STAGING_SUPABASE_SERVICE_ROLE_KEY` | `PROD_SUPABASE_SERVICE_ROLE_KEY` |
| Database | Local Docker | Cloud hosted | Cloud hosted |

### Environment Detection Logic

```
APP_ENV=staging → staging
VERCEL_ENV=preview → staging
VERCEL_ENV=production → production
NODE_ENV=production → production
Default → development
```

### Useful Commands

```bash
# Local Development
supabase start              # Start local Supabase
supabase stop               # Stop local Supabase
supabase db reset           # Reset local database with migrations
supabase status             # Check local services status

# Development workflow
pnpm dev                    # Start Next.js development server
pnpm build                  # Build for production
pnpm test                   # Run tests

# Database operations
supabase db dump --local    # Export local database schema
supabase db diff            # Show pending migrations
supabase migration new      # Create new migration

# Environment checking
node -e "console.log(require('./src/lib/environment').getEnvironment())"
```

This guide provides everything needed to set up and maintain the multi-environment database separation for Clear Match.