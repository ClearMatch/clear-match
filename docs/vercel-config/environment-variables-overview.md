# Vercel Environment Variables Overview

Generated: 2025-07-18

## Current Environment Variables Structure

### Production Environment Variables
These variables are currently set for the production environment:

- **POSTGRES_*** - Vercel Postgres integration variables
  - POSTGRES_URL
  - POSTGRES_PRISMA_URL
  - POSTGRES_URL_NON_POOLING
  - POSTGRES_USER
  - POSTGRES_HOST
  - POSTGRES_PASSWORD
  - POSTGRES_DATABASE

- **SUPABASE_*** - Supabase connection variables
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_JWT_SECRET

### Shared Environment Variables (Production, Preview, Development)
These variables are available across all environments:

- **NEXT_PUBLIC_SUPABASE_URL** - Public Supabase URL for client-side access
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Public Supabase anonymous key
- **HUBSPOT_ACCESS_TOKEN** - HubSpot API integration
- **PARAGON_PROJECT_ID** - Paragon integration

### Preview-Only Variables
Branch-specific variables for `add-events-jobs-tables` branch (26 days old).

## Key Observations

1. **Postgres Variables**: Vercel has added Postgres integration variables that aren't used locally
2. **Public vs Private**: The app uses `NEXT_PUBLIC_*` prefixed variables for client-side access
3. **Minimal Local Setup**: Local development only needs:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - HUBSPOT_ACCESS_TOKEN (if using HubSpot features)

## Migration Considerations

When migrating to a three-environment setup:

1. **Keep it Simple**: Don't create complex prefixed variables (DEV_*, STAGING_*, PROD_*)
2. **Use Vercel's Environment System**: Let Vercel manage different values per environment
3. **Focus on Core Variables**: Only migrate the variables actually used by the application