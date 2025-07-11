/**
 * Environment configuration and detection for Clear Match
 * Supports development, staging, and production environments
 */

export type Environment = 'development' | 'staging' | 'production'

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

/**
 * Detects the current environment based on environment variables
 * Priority order:
 * 1. APP_ENV (explicit environment override)
 * 2. VERCEL_ENV (Vercel deployment environment)
 * 3. NODE_ENV (Node.js environment)
 */
export function getEnvironment(): Environment {
  // Check for explicit environment override
  if (process.env.APP_ENV === 'staging') {
    return 'staging'
  }
  
  // Check Vercel environment
  if (process.env.VERCEL_ENV === 'preview') {
    return 'staging'
  }
  
  if (process.env.VERCEL_ENV === 'production') {
    return 'production'
  }
  
  // Check NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return 'production'
  }
  
  if (process.env.NODE_ENV === 'test') {
    // Test environment maps to development for database purposes
    return 'development'
  }
  
  // Default to development
  return 'development'
}

/**
 * Gets the Supabase configuration for the current environment
 * Supports environment-specific variables with fallback to legacy variables
 */
export function getSupabaseConfig(): SupabaseConfig {
  const env = getEnvironment()
  
  let url: string | undefined
  let anonKey: string | undefined
  let serviceRoleKey: string | undefined
  
  switch (env) {
    case 'development':
      url = process.env.DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      anonKey = process.env.DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      serviceRoleKey = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      break
      
    case 'staging':
      url = process.env.STAGING_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      anonKey = process.env.STAGING_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      serviceRoleKey = process.env.STAGING_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      break
      
    case 'production':
      url = process.env.PROD_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      anonKey = process.env.PROD_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      serviceRoleKey = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      break
  }
  
  if (!url || !anonKey) {
    throw new Error(
      `Missing required Supabase configuration for ${env} environment. ` +
      `Please set ${env.toUpperCase()}_SUPABASE_URL and ${env.toUpperCase()}_SUPABASE_ANON_KEY ` +
      `or the legacy NEXT_PUBLIC_SUPABASE_* variables.`
    )
  }
  
  return {
    url,
    anonKey,
    serviceRoleKey
  }
}

/**
 * Helper functions to check current environment
 */
export function isProduction(): boolean {
  return getEnvironment() === 'production'
}

export function isStaging(): boolean {
  return getEnvironment() === 'staging'
}

export function isDevelopment(): boolean {
  return getEnvironment() === 'development'
}

/**
 * Get a human-readable environment name for logging
 */
export function getEnvironmentName(): string {
  const env = getEnvironment()
  return env.charAt(0).toUpperCase() + env.slice(1)
}

/**
 * Check if we should enable debug logging
 */
export function shouldEnableDebugLogging(): boolean {
  return !isProduction()
}