/**
 * Jest setup for Next.js environment and security tests
 */

// Mock Next.js server modules first
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    public url: string
    public method: string
    public headers: Map<string, string>
    public nextUrl: { pathname: string }
    public cookies: Map<string, { value: string }>

    constructor(url: string, init: any = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map()
      this.cookies = new Map()
      
      // Parse URL for pathname
      const urlObj = new URL(url)
      this.nextUrl = { pathname: urlObj.pathname }
      
      // Set headers from init
      if (init.headers) {
        Object.entries(init.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value as string)
          
          // Parse cookies from Cookie header
          if (key.toLowerCase() === 'cookie') {
            const cookies = (value as string).split(';')
            cookies.forEach(cookie => {
              const [name, val] = cookie.trim().split('=')
              if (name && val) {
                this.cookies.set(name, { value: val })
              }
            })
          }
        })
      }
    }

    get(name: string) {
      return this.cookies.get(name)
    }
  },
  NextResponse: {
    next: () => ({
      headers: new Map(),
      cookies: {
        set: jest.fn(),
        get: jest.fn(),
        delete: jest.fn()
      }
    }),
    json: (data: any, init: any = {}) => ({
      json: () => Promise.resolve(data),
      status: init.status || 200,
      headers: new Map(Object.entries(init.headers || {}))
    }),
    redirect: (url: string) => ({
      url,
      status: 302
    })
  }
}))

// Mock Next.js server components
;(global as any).NextRequest = class MockNextRequest {
  public url: string
  public method: string
  public headers: Map<string, string>
  public nextUrl: { pathname: string }
  public cookies: Map<string, { value: string }>

  constructor(url: string, init: any = {}) {
    this.url = url
    this.method = init.method || 'GET'
    this.headers = new Map()
    this.cookies = new Map()
    
    // Parse URL for pathname
    const urlObj = new URL(url)
    this.nextUrl = { pathname: urlObj.pathname }
    
    // Set headers from init
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value as string)
        
        // Parse cookies from Cookie header
        if (key.toLowerCase() === 'cookie') {
          const cookies = (value as string).split(';')
          cookies.forEach(cookie => {
            const [name, val] = cookie.trim().split('=')
            if (name && val) {
              this.cookies.set(name, { value: val })
            }
          })
        }
      })
    }
  }

  get(name: string) {
    return this.cookies.get(name)
  }
}

;(global as any).NextResponse = {
  next: () => ({
    headers: new Map(),
    cookies: {
      set: jest.fn(),
      get: jest.fn(),
      delete: jest.fn()
    }
  }),
  json: (data: any, init: any = {}) => ({
    json: () => Promise.resolve(data),
    status: init.status || 200,
    headers: new Map(Object.entries(init.headers || {}))
  }),
  redirect: (url: string) => ({
    url,
    status: 302
  })
}

// Mock Web Crypto API for tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    },
    randomUUID: () => '12345678-1234-1234-1234-123456789012'
  },
  writable: true
})

// Mock btoa/atob for base64 operations
global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64')
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary')

// Mock File API for file upload tests
global.File = class MockFile {
  public name: string
  public size: number
  public type: string
  public lastModified: number

  constructor(content: any[], filename: string, options: any = {}) {
    this.name = filename
    this.type = options.type || 'text/plain'
    this.size = JSON.stringify(content).length
    this.lastModified = Date.now()
  }
} as any

// Suppress console warnings for tests
const originalWarn = console.warn
console.warn = (...args: any[]) => {
  // Suppress specific warnings that are expected in tests
  if (args[0]?.includes?.('Redis configuration missing')) return
  if (args[0]?.includes?.('Rate limit exceeded')) return
  if (args[0]?.includes?.('CSRF validation failed')) return
  originalWarn(...args)
}

// Mock Upstash packages
jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn().mockResolvedValue({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000
    })
  }))
}))

jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn()
  }))
}))

// Mock environment variables for tests
Object.assign(process.env, {
  NODE_ENV: 'test',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
  HUBSPOT_API_KEY: 'test-hubspot-key',
  SESSION_SECRET: 'test-session-secret-12345678901234567890'
})