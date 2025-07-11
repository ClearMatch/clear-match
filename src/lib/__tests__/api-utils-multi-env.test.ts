import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// Mock Next.js modules
jest.mock('next/headers', () => ({
  cookies: jest.fn()
}))

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn()
}))

const originalEnv = process.env

describe('Supabase Server Client Multi-Environment', () => {
  let mockCookieStore: any

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()
    process.env = { ...originalEnv }

    // Setup mock cookie store
    mockCookieStore = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn()
    }
    ;(cookies as jest.Mock).mockReturnValue(mockCookieStore)
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('createSupabaseServerClient with multi-environment support', () => {
    it('should create server client with development credentials', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      const client = createSupabaseServerClient()

      expect(createServerClient).toHaveBeenCalledWith(
        'https://dev.supabase.co',
        'dev-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function)
          })
        })
      )
      expect(client).toBe(mockClient)
    })

    it('should create server client with staging credentials', async () => {
      process.env.APP_ENV = 'staging'
      process.env.STAGING_SUPABASE_URL = 'https://staging.supabase.co'
      process.env.STAGING_SUPABASE_ANON_KEY = 'staging-anon-key'

      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      const client = createSupabaseServerClient()

      expect(createServerClient).toHaveBeenCalledWith(
        'https://staging.supabase.co',
        'staging-anon-key',
        expect.any(Object)
      )
      expect(client).toBe(mockClient)
    })

    it('should create server client with production credentials', async () => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      process.env.PROD_SUPABASE_URL = 'https://prod.supabase.co'
      process.env.PROD_SUPABASE_ANON_KEY = 'prod-anon-key'

      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      const client = createSupabaseServerClient()

      expect(createServerClient).toHaveBeenCalledWith(
        'https://prod.supabase.co',
        'prod-anon-key',
        expect.any(Object)
      )
      expect(client).toBe(mockClient)
    })

    it('should handle cookie operations correctly', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      let cookieHandlers: any
      ;(createServerClient as jest.Mock).mockImplementation((url, key, options) => {
        cookieHandlers = options.cookies
        return { auth: { getUser: jest.fn() } }
      })

      const { createSupabaseServerClient } = await import('../api-utils')
      createSupabaseServerClient()

      // Test cookie get
      mockCookieStore.get.mockReturnValue({ value: 'test-value' })
      expect(cookieHandlers.get('test-cookie')).toBe('test-value')
      expect(mockCookieStore.get).toHaveBeenCalledWith('test-cookie')

      // Test cookie set
      cookieHandlers.set('test-cookie', 'new-value', { maxAge: 3600 })
      expect(mockCookieStore.set).toHaveBeenCalledWith('test-cookie', 'new-value', { maxAge: 3600 })

      // Test cookie remove
      cookieHandlers.remove('test-cookie', { path: '/' })
      expect(mockCookieStore.set).toHaveBeenCalledWith('test-cookie', '', { 
        maxAge: 0,
        path: '/'
      })
    })

    it('should use service role key when provided', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_SERVICE_ROLE_KEY = 'dev-service-key'

      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      const client = createSupabaseServerClient(true)

      expect(createServerClient).toHaveBeenCalledWith(
        'https://dev.supabase.co',
        'dev-service-key',
        expect.any(Object)
      )
    })

    it('should throw error when service role key is missing but requested', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'
      // No service role key set

      await expect(async () => {
        const { createSupabaseServerClient } = await import('../api-utils')
        createSupabaseServerClient(true)
      }).rejects.toThrow('Service role key is required')
    })
  })

  describe('Environment logging', () => {
    it('should log current environment in development', async () => {
      process.env.NODE_ENV = 'development'
      process.env.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      process.env.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      createSupabaseServerClient()

      expect(consoleSpy).toHaveBeenCalledWith('[Supabase] Using development environment')
      
      consoleSpy.mockRestore()
    })

    it('should not log in production', async () => {
      process.env.NODE_ENV = 'production'
      process.env.VERCEL_ENV = 'production'
      process.env.PROD_SUPABASE_URL = 'https://prod.supabase.co'
      process.env.PROD_SUPABASE_ANON_KEY = 'prod-anon-key'

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      
      const mockClient = { auth: { getUser: jest.fn() } }
      ;(createServerClient as jest.Mock).mockReturnValue(mockClient)

      const { createSupabaseServerClient } = await import('../api-utils')
      createSupabaseServerClient()

      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })
})