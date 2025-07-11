// Mock environment variables using Jest spies
const originalEnv = { ...process.env }

// Mock process.env
const mockEnv = {} as NodeJS.ProcessEnv
Object.defineProperty(process, 'env', {
  value: mockEnv,
  writable: true,
  configurable: true
})

describe('Environment Configuration', () => {
  beforeEach(() => {
    // Reset modules before each test to ensure clean state
    jest.resetModules()
    // Clear mock environment
    Object.keys(mockEnv).forEach(key => {
      delete mockEnv[key]
    })
  })

  afterEach(() => {
    // Clear mock environment
    Object.keys(mockEnv).forEach(key => {
      delete mockEnv[key]
    })
  })

  describe('getEnvironment', () => {
    it('should detect development environment', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('development')
    })

    it('should detect production environment', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('production')
    })

    it('should detect staging environment from VERCEL_ENV', async () => {
      mockEnv.VERCEL_ENV = 'preview'
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('staging')
    })

    it('should detect staging environment from APP_ENV', async () => {
      mockEnv.APP_ENV = 'staging'
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('staging')
    })

    it('should prioritize APP_ENV over VERCEL_ENV', async () => {
      mockEnv.VERCEL_ENV = 'production'
      mockEnv.APP_ENV = 'staging'
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('staging')
    })

    it('should default to development when no environment is set', async () => {
      const { getEnvironment } = await import('../environment')
      
      expect(getEnvironment()).toBe('development')
    })
  })

  describe('getSupabaseConfig', () => {
    it('should return development config for development environment', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      mockEnv.DEV_SUPABASE_URL = 'https://dev.supabase.co'
      mockEnv.DEV_SUPABASE_ANON_KEY = 'dev-anon-key'
      mockEnv.DEV_SUPABASE_SERVICE_ROLE_KEY = 'dev-service-key'
      
      const { getSupabaseConfig } = await import('../environment')
      const config = getSupabaseConfig()
      
      expect(config).toEqual({
        url: 'https://dev.supabase.co',
        anonKey: 'dev-anon-key',
        serviceRoleKey: 'dev-service-key'
      })
    })

    it('should return staging config for staging environment', async () => {
      mockEnv.APP_ENV = 'staging'
      mockEnv.STAGING_SUPABASE_URL = 'https://staging.supabase.co'
      mockEnv.STAGING_SUPABASE_ANON_KEY = 'staging-anon-key'
      mockEnv.STAGING_SUPABASE_SERVICE_ROLE_KEY = 'staging-service-key'
      
      const { getSupabaseConfig } = await import('../environment')
      const config = getSupabaseConfig()
      
      expect(config).toEqual({
        url: 'https://staging.supabase.co',
        anonKey: 'staging-anon-key',
        serviceRoleKey: 'staging-service-key'
      })
    })

    it('should return production config for production environment', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      mockEnv.VERCEL_ENV = 'production'
      mockEnv.PROD_SUPABASE_URL = 'https://prod.supabase.co'
      mockEnv.PROD_SUPABASE_ANON_KEY = 'prod-anon-key'
      mockEnv.PROD_SUPABASE_SERVICE_ROLE_KEY = 'prod-service-key'
      
      const { getSupabaseConfig } = await import('../environment')
      const config = getSupabaseConfig()
      
      expect(config).toEqual({
        url: 'https://prod.supabase.co',
        anonKey: 'prod-anon-key',
        serviceRoleKey: 'prod-service-key'
      })
    })

    it('should fall back to legacy environment variables if environment-specific ones are missing', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      mockEnv.NEXT_PUBLIC_SUPABASE_URL = 'https://legacy.supabase.co'
      mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'legacy-anon-key'
      mockEnv.SUPABASE_SERVICE_ROLE_KEY = 'legacy-service-key'
      
      const { getSupabaseConfig } = await import('../environment')
      const config = getSupabaseConfig()
      
      expect(config).toEqual({
        url: 'https://legacy.supabase.co',
        anonKey: 'legacy-anon-key',
        serviceRoleKey: 'legacy-service-key'
      })
    })

    it('should throw error if required environment variables are missing', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      mockEnv.VERCEL_ENV = 'production'
      
      const { getSupabaseConfig } = await import('../environment')
      
      expect(() => getSupabaseConfig()).toThrow()
    })
  })

  describe('isProduction', () => {
    it('should return true for production environment', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      mockEnv.VERCEL_ENV = 'production'
      const { isProduction } = await import('../environment')
      
      expect(isProduction()).toBe(true)
    })

    it('should return false for staging environment', async () => {
      mockEnv.APP_ENV = 'staging'
      const { isProduction } = await import('../environment')
      
      expect(isProduction()).toBe(false)
    })

    it('should return false for development environment', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      const { isProduction } = await import('../environment')
      
      expect(isProduction()).toBe(false)
    })
  })

  describe('isStaging', () => {
    it('should return true for staging environment', async () => {
      mockEnv.APP_ENV = 'staging'
      const { isStaging } = await import('../environment')
      
      expect(isStaging()).toBe(true)
    })

    it('should return true when VERCEL_ENV is preview', async () => {
      mockEnv.VERCEL_ENV = 'preview'
      const { isStaging } = await import('../environment')
      
      expect(isStaging()).toBe(true)
    })

    it('should return false for production environment', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      const { isStaging } = await import('../environment')
      
      expect(isStaging()).toBe(false)
    })

    it('should return false for development environment', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      const { isDevelopment } = await import('../environment')
      
      expect(isDevelopment()).toBe(true)
    })
  })

  describe('isDevelopment', () => {
    it('should return true for development environment', async () => {
      (mockEnv as any).NODE_ENV = 'development'
      const { isDevelopment } = await import('../environment')
      
      expect(isDevelopment()).toBe(true)
    })

    it('should return true when no environment is set', async () => {
      const { isDevelopment } = await import('../environment')
      
      expect(isDevelopment()).toBe(true)
    })

    it('should return false for production environment', async () => {
      (mockEnv as any).NODE_ENV = 'production'
      const { isDevelopment } = await import('../environment')
      
      expect(isDevelopment()).toBe(false)
    })

    it('should return false for staging environment', async () => {
      mockEnv.APP_ENV = 'staging'
      const { isDevelopment } = await import('../environment')
      
      expect(isDevelopment()).toBe(false)
    })
  })
})

// Restore original process.env after all tests
afterAll(() => {
  Object.defineProperty(process, 'env', {
    value: originalEnv,
    writable: true,
    configurable: true
  })
})