# Vercel CLI Reference for Clear Match

## Installation & Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Switch to team account
vercel switch clear-match

# Link to existing project
vercel link
```

## Environment Variables Management

### Viewing Environment Variables
```bash
# List all environment variables
vercel env ls

# Export variables to file
vercel env ls > env-backup.txt

# Pull environment variables to .env file
vercel env pull .env.production  # Pull production vars
vercel env pull .env.preview     # Pull preview vars
```

### Adding Environment Variables
```bash
# Add a variable for specific environments
vercel env add VARIABLE_NAME

# Add for production only
vercel env add VARIABLE_NAME production

# Add for preview only  
vercel env add VARIABLE_NAME preview

# Add for all environments
vercel env add VARIABLE_NAME production preview development
```

### Removing Environment Variables
```bash
# Remove a variable
vercel env rm VARIABLE_NAME

# Remove from specific environment
vercel env rm VARIABLE_NAME production
```

## Deployment Commands

### Basic Deployment
```bash
# Deploy to preview (default for non-main branches)
vercel

# Deploy to production
vercel --prod

# Deploy to specific environment
vercel deploy --target=production
vercel deploy --target=preview
```

### Branch-Specific Deployment
```bash
# Deploy current branch
vercel

# Force production deployment from any branch
vercel --prod
```

## Project Configuration

### Viewing Project Info
```bash
# Inspect project details
vercel project inspect clear-match

# List all projects
vercel projects list
```

### Updating Production Branch
```bash
# This must be done in Vercel dashboard:
# Settings > Git > Production Branch
# Change from "main" to "production"
```

## Useful Commands for Migration

### Backup Current State
```bash
# Export all environment variables
vercel env ls > docs/vercel-env-backup-$(date +%Y%m%d).txt

# Check current deployments
vercel list

# View deployment URLs
vercel list --meta
```

### Testing Deployments
```bash
# Deploy without aliasing (safe testing)
vercel --no-alias

# Deploy to specific URL
vercel --name=staging-test
```

## Debugging

### View Logs
```bash
# View build logs
vercel logs [deployment-url]

# View function logs
vercel logs [deployment-url] --source=lambda
```

### Check Configuration
```bash
# View current team/scope
vercel whoami

# Check linked project
cat .vercel/project.json
```

## Best Practices

1. **Always backup before changes**: `vercel env ls > backup.txt`
2. **Test with preview first**: Deploy to preview before production
3. **Use environment-specific values**: Don't use prefixed variable names
4. **Verify after changes**: `vercel env ls` to confirm updates

## Common Issues

### Wrong Team/Account
```bash
vercel logout
vercel login
vercel switch clear-match
```

### Environment Variable Not Working
- Check if variable is set for correct environment
- Verify variable name matches exactly (case-sensitive)
- Restart development server after changes

### Deployment to Wrong Environment
- Check current branch: `git branch --show-current`
- Verify production branch setting in Vercel dashboard
- Use explicit targeting: `vercel deploy --target=production`