const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/src/lib/__tests__/setup.ts'
  ],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock problematic ES modules  
    '^isows$': '<rootDir>/src/__mocks__/isows.js',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.config.{js,ts}',
    '!src/app/**/*.tsx', // Exclude all app router pages
    '!src/middleware.ts', // Exclude middleware
    '!src/**/__tests__/**', // Exclude test files
    '!src/**/*.test.{js,jsx,ts,tsx}', // Exclude test files
    '!src/**/*.spec.{js,jsx,ts,tsx}', // Exclude spec files
    '!src/test-utils.tsx',
    '!src/components/ui/**', // Exclude UI library components
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 1.5,
      functions: 2,
      lines: 1.5,
      statements: 1.4,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/middleware.*test.ts',
    '/lib/__tests__/api-utils.test.ts',
    '/lib/__tests__/setup.ts',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(.pnpm/(@upstash|@supabase|isows|ws|uncrypto)|(@upstash|@supabase|isows|ws|uncrypto)))'
  ],
  testTimeout: 10000,
  maxWorkers: '50%',
  cache: true,
  verbose: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)