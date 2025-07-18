import { z } from 'zod'

/**
 * Environment variable validation schema
 * Supports multiple environments: development, staging, production
 */
const envSchema = z.object({
  // Legacy Supabase configuration (for backward compatibility)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Development environment Supabase configuration
  DEV_SUPABASE_URL: z.string().url('Invalid development Supabase URL').optional(),
  DEV_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  DEV_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Staging environment Supabase configuration
  STAGING_SUPABASE_URL: z.string().url('Invalid staging Supabase URL').optional(),
  STAGING_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  STAGING_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // Production environment Supabase configuration
  PROD_SUPABASE_URL: z.string().url('Invalid production Supabase URL').optional(),
  PROD_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  PROD_SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  
  // External API keys
  HUBSPOT_API_KEY: z.string().min(1, 'HubSpot API key is required'),
  
  // Security configuration
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // Rate limiting (optional - will use memory fallback if not provided)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Environment detection
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['development', 'staging', 'production']).optional(),
  VERCEL_ENV: z.enum(['development', 'preview', 'production']).optional(),
  
  // Next.js environment
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

/**
 * Detect the current environment for validation purposes
 */
function detectEnvironment(): 'development' | 'staging' | 'production' {
  if (process.env.APP_ENV === 'staging') return 'staging'
  if (process.env.VERCEL_ENV === 'preview') return 'staging'
  if (process.env.VERCEL_ENV === 'production') return 'production'
  if (process.env.NODE_ENV === 'production') return 'production'
  return 'development'
}

/**
 * Validate that required Supabase configuration exists for the current environment
 */
function validateSupabaseConfig(env: z.infer<typeof envSchema>) {
  const currentEnv = detectEnvironment()
  
  // Check for environment-specific configuration
  let hasConfig = false
  switch (currentEnv) {
    case 'development':
      hasConfig = !!(env.DEV_SUPABASE_URL && env.DEV_SUPABASE_ANON_KEY)
      break
    case 'staging':
      hasConfig = !!(env.STAGING_SUPABASE_URL && env.STAGING_SUPABASE_ANON_KEY)
      break
    case 'production':
      hasConfig = !!(env.PROD_SUPABASE_URL && env.PROD_SUPABASE_ANON_KEY)
      break
  }
  
  // Check for legacy configuration as fallback
  const hasLegacyConfig = !!(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  if (!hasConfig && !hasLegacyConfig) {
    throw new Error(
      `Missing Supabase configuration for ${currentEnv} environment. ` +
      `Please set ${currentEnv.toUpperCase()}_SUPABASE_URL and ${currentEnv.toUpperCase()}_SUPABASE_ANON_KEY ` +
      `or the legacy NEXT_PUBLIC_SUPABASE_* variables.`
    )
  }
}

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env)
    
    // Validate Supabase configuration
    validateSupabaseConfig(env)
    
    // Additional validation for rate limiting
    if (env.NODE_ENV === 'production') {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('⚠️  Redis configuration missing in production. Using memory-based rate limiting.')
      }
    }
    
    const currentEnv = detectEnvironment()
    console.log(`✅ Environment variables validated successfully for ${currentEnv} environment`)
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:')
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`)
      })
    } else {
      console.error('❌ Environment validation error:', error)
    }
    
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
    
    throw error
  }
}

/**
 * Get validated environment variables
 */
export const env = validateEnvironment()

/**
 * Environment variable types
 */
export type Environment = z.infer<typeof envSchema>