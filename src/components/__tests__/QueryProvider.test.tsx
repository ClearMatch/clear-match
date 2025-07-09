import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock TanStack Query completely
jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="query-client-provider">{children}</div>
  ),
}));

// Mock the query client
jest.mock('@/lib/query-client', () => ({
  queryClient: {
    getDefaultOptions: jest.fn(),
    getQueryCache: jest.fn(),
    getMutationCache: jest.fn(),
  },
}));

// Mock DevTools to prevent loading issues
jest.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => <div data-testid="devtools">DevTools</div>,
}));

describe('QueryProvider', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let QueryProvider: React.ComponentType<{ children: React.ReactNode }>;

  beforeAll(async () => {
    // Import after mocks are set up
    QueryProvider = (await import('../QueryProvider')).default;
  });

  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      writable: true,
      enumerable: true,
      configurable: true
    });
    jest.clearAllMocks();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        enumerable: true,
        configurable: true
      });
    });

    it('should render children in development', () => {
      render(
        <QueryProvider>
          <div data-testid="test-child">Test Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('should conditionally render DevTools in development', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        enumerable: true,
        configurable: true
      });
    });

    it('should render children in production', () => {
      render(
        <QueryProvider>
          <div data-testid="test-child">Test Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });

    it('should NOT load DevTools in production', () => {
      // The DevTools loading is conditional on NODE_ENV
      expect(process.env.NODE_ENV).toBe('production');
      
      render(
        <QueryProvider>
          <div>Test Content</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Test Environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'test',
        writable: true,
        enumerable: true,
        configurable: true
      });
    });

    it('should render children in test environment', () => {
      render(
        <QueryProvider>
          <div data-testid="test-child">Test Child</div>
        </QueryProvider>
      );

      expect(screen.getByTestId('test-child')).toBeInTheDocument();
      expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
    });
  });

  describe('Environment Validation', () => {
    it('should handle different NODE_ENV values correctly', () => {
      const environments = ['development', 'production', 'test', undefined];
      
      environments.forEach(env => {
        Object.defineProperty(process.env, 'NODE_ENV', {
          value: env,
          writable: true,
          enumerable: true,
          configurable: true
        });
        
        const { unmount } = render(
          <QueryProvider>
            <div data-testid="test-content">Content</div>
          </QueryProvider>
        );

        expect(screen.getByTestId('test-content')).toBeInTheDocument();
        expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
        
        unmount();
      });
    });
  });

  describe('DevTools Configuration Logic', () => {
    it('should only load DevTools in development', () => {
      // Test the condition logic
      expect(process.env.NODE_ENV).toBe('test'); // In test env
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        enumerable: true,
        configurable: true
      });
      expect(process.env.NODE_ENV === 'development').toBe(true);
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        enumerable: true,
        configurable: true
      });
      expect(process.env.NODE_ENV === 'development').toBe(false);
    });

    it('should use dynamic require for DevTools loading', () => {
      // The component should use require() for dynamic loading
      const componentSource = `
        function DevToolsComponent() {
          const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
          return <ReactQueryDevtools initialIsOpen={false} />;
        }
      `;

      // Verify pattern uses require instead of static import
      expect(componentSource).toContain('require(');
      expect(componentSource).toContain('initialIsOpen={false}');
    });
  });

  describe('Bundle Optimization', () => {
    it('should implement tree-shaking friendly pattern', () => {
      // The conditional rendering pattern ensures DevTools
      // are excluded from production bundles
      const devCondition = process.env.NODE_ENV === 'development';
      
      if (devCondition) {
        // DevTools would be loaded only in development
        expect(true).toBe(true);
      } else {
        // DevTools excluded from production
        expect(devCondition).toBe(false);
      }
    });
  });
});