# Environment Setup Guide for Clear Match

This guide explains how to set up and configure multiple environments (development, staging, production) for Clear Match.

## Overview

Clear Match now supports multiple database environments to separate test data from production data. Each environment has its own Supabase project, ensuring complete data isolation between environments.

## Environment Detection

The application automatically detects the current environment using the following priority:

1. **`APP_ENV`** - Explicit environment override (highest priority)
2. **`VERCEL_ENV`** - Automatically set by Vercel deployments
3. **`NODE_ENV`** - Standard Node.js environment variable (fallback)

### Environment Mapping

- `APP_ENV=staging` → Staging environment
- `VERCEL_ENV=preview` → Staging environment  
- `VERCEL_ENV=production` → Production environment
- `NODE_ENV=production` → Production environment
- Default (none set) → Development environment

## Configuration Steps

### 1. Create Supabase Projects

Create three separate Supabase projects:

1. **Development** - For local development
2. **Staging** - For preview deployments and testing
3. **Production** - For live production data

### 2. Configure Environment Variables

#### Local Development (.env.local)

```bash
# Development environment
DEV_SUPABASE_URL=https://your-dev-project.supabase.co
DEV_SUPABASE_ANON_KEY=your-dev-anon-key
DEV_SUPABASE_SERVICE_ROLE_KEY=your-dev-service-role-key

# Other required variables
HUBSPOT_API_KEY=your-hubspot-api-key
SESSION_SECRET=your-32-character-secret
```

#### Vercel Environment Variables

Configure the following in your Vercel project settings:

**Preview Environment (Staging):**
```
STAGING_SUPABASE_URL=https://your-staging-project.supabase.co
STAGING_SUPABASE_ANON_KEY=your-staging-anon-key
STAGING_SUPABASE_SERVICE_ROLE_KEY=your-staging-service-role-key
```

**Production Environment:**
```
PROD_SUPABASE_URL=https://your-prod-project.supabase.co
PROD_SUPABASE_ANON_KEY=your-prod-anon-key
PROD_SUPABASE_SERVICE_ROLE_KEY=your-prod-service-role-key
```

### 3. Database Setup

Run migrations on each Supabase project:

```bash
# Development
supabase db push --db-url "postgresql://postgres:[password]@[host]:5432/postgres"

# Staging
supabase db push --db-url "postgresql://postgres:[password]@[staging-host]:5432/postgres"

# Production
supabase db push --db-url "postgresql://postgres:[password]@[prod-host]:5432/postgres"
```

## Testing Your Setup

### Verify Environment Detection

The application logs the current environment during startup:

```
[Supabase] Using development environment
✅ Environment variables validated successfully for development environment
```

### Check Database Connection

Each environment connects to its own database. You can verify this by:

1. Creating test data in development
2. Deploying to staging and verifying the test data doesn't appear
3. Confirming production remains clean

## Migration Guide

### For Existing Projects

If you're migrating from a single-database setup:

1. **Keep Legacy Variables** - The system falls back to `NEXT_PUBLIC_SUPABASE_*` variables if environment-specific ones aren't found
2. **Gradual Migration** - Start by setting up development environment variables, then staging, then production
3. **Test Thoroughly** - Verify each environment connects to the correct database before removing legacy variables

### Example Migration Steps

1. Set up development variables first:
   ```bash
   DEV_SUPABASE_URL=https://dev.supabase.co
   DEV_SUPABASE_ANON_KEY=dev-key
   ```

2. Test locally to ensure it works

3. Set up staging variables in Vercel

4. Deploy a preview branch and verify

5. Finally, set up production variables

6. Remove legacy `NEXT_PUBLIC_SUPABASE_*` variables once all environments are configured

## Troubleshooting

### Common Issues

**"Missing Supabase configuration" error**
- Ensure environment-specific variables are set for the current environment
- Check that variable names match the pattern: `{ENV}_SUPABASE_*`

**Wrong database in staging/preview**
- Verify `VERCEL_ENV` is being detected correctly
- Ensure staging variables are set in Vercel's Preview environment settings

**Local development using production data**
- Check that `NODE_ENV` is not set to `production` locally
- Ensure `DEV_SUPABASE_*` variables are set in `.env.local`

### Debug Mode

Enable debug logging to see which environment is being used:

```typescript
// The application automatically logs in non-production environments
// Look for: [Supabase] Using {environment} environment
```

## Security Best Practices

1. **Never commit `.env.local`** - Keep it in `.gitignore`
2. **Use different service role keys** - Each environment should have its own keys
3. **Restrict production access** - Limit who can access production environment variables
4. **Regular key rotation** - Rotate keys periodically, especially for production

## CI/CD Considerations

### GitHub Actions

Set environment-specific secrets:

```yaml
env:
  STAGING_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
  STAGING_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
```

### Vercel Deployments

Vercel automatically sets `VERCEL_ENV`:
- Production deployments: `VERCEL_ENV=production`
- Preview deployments: `VERCEL_ENV=preview`
- Development: `VERCEL_ENV=development`

This integrates seamlessly with our environment detection.