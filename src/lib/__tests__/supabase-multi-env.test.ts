import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { createBrowserClient } from '@supabase/ssr'

// Mock the @supabase/ssr module
jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn()
}))

const originalEnv = process.env

describe('Supabase Multi-Environment Client', () => {
  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createSupabaseClient', () => {
    it('should create client with development credentials in development', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseClient } = await import('../supabase')
      const client = createSupabaseClient()

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://dev.supabase.co',
        'dev-anon-key'
      )
      expect(client).toBe(mockClient)
    })

    it('should create client with staging credentials in staging', async () => {
      process.env.APP_ENV = 'staging'
      process.env.STAGING_SUPABASE_URL = 'https://staging.supabase.co'
      process.env.STAGING_SUPABASE_ANON_KEY = 'staging-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseClient } = await import('../supabase')
      const client = createSupabaseClient()

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://staging.supabase.co',
        'staging-anon-key'
      )
      expect(client).toBe(mockClient)
    })

    it('should create client with production credentials in production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      process.env.PROD_SUPABASE_URL = 'https://prod.supabase.co'
      process.env.PROD_SUPABASE_ANON_KEY = 'prod-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseClient } = await import('../supabase')
      const client = createSupabaseClient()

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://prod.supabase.co',
        'prod-anon-key'
      )
      expect(client).toBe(mockClient)
    })

    it('should use legacy environment variables as fallback', async () => {
      process.env.NODE_ENV = 'development'
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://legacy.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'legacy-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseClient } = await import('../supabase')
      const client = createSupabaseClient()

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://legacy.supabase.co',
        'legacy-anon-key'
      )
      expect(client).toBe(mockClient)
    })

    it('should throw error when required environment variables are missing', async () => {
      process.env.NODE_ENV = 'production'
      // No environment variables set

      await expect(async () => {
        const { createSupabaseClient } = await import('../supabase')
        createSupabaseClient()
      }).rejects.toThrow('Missing required Supabase configuration')
    })

    it('should create singleton instance', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseClient } = await import('../supabase')
      const client1 = createSupabaseClient()
      const client2 = createSupabaseClient()

      expect(client1).toBe(client2)
      expect(createBrowserClient).toHaveBeenCalledTimes(1)
    })
  })

  describe('getSupabaseClient (export)', () => {
    it('should export configured client', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      const mockClient = { auth: {}, from: jest.fn() }
      ;(createBrowserClient as jest.Mock).mockReturnValue(mockClient)

      const { supabase } = await import('../supabase')
      
      expect(supabase).toBe(mockClient)
      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://dev.supabase.co',
        'dev-anon-key'
      )
    })
  })
})