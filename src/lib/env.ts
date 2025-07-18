import { z } from 'zod'

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anonymous key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required').optional(),
  
  // External API keys
  HUBSPOT_API_KEY: z.string().min(1, 'HubSpot API key is required'),
  
  // Security configuration
  SESSION_SECRET: z.string().min(32, 'Session secret must be at least 32 characters'),
  
  // Rate limiting (optional - will use memory fallback if not provided)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Next.js environment
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

/**
 * Validate environment variables
 */
export function validateEnvironment() {
  try {
    const env = envSchema.parse(process.env)
    
    // Additional validation for rate limiting
    if (env.NODE_ENV === 'production') {
      if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
        console.warn('⚠️  Redis configuration missing in production. Using memory-based rate limiting.')
      }
    }
    
    console.log('✅ Environment variables validated successfully')
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