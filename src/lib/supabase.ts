import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig, getEnvironment, shouldEnableDebugLogging } from './environment'

// Cache the client instance
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

/**
 * Creates a Supabase client configured for the current environment
 * This is a singleton - the same instance is returned on subsequent calls
 */
export function createSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  const config = getSupabaseConfig()
  
  if (shouldEnableDebugLogging()) {
    console.log(`[Supabase] Using ${getEnvironment()} environment`)
  }
  
  supabaseClient = createBrowserClient(config.url, config.anonKey)
  
  return supabaseClient
}

// Export a pre-configured client for backward compatibility
export const supabase = createSupabaseClient()