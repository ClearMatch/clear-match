'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';

interface QueryProviderProps {
  children: React.ReactNode;
}

export default function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && <DevToolsComponent />}
    </QueryClientProvider>
  );
}

// Lazy load DevTools to ensure they're excluded from production bundle
function DevToolsComponent() {
  const { ReactQueryDevtools } = require('@tanstack/react-query-devtools');
  return <ReactQueryDevtools initialIsOpen={false} />;
}