import { ReactNode } from "react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ReactNode | ((resetError: () => void) => React.ReactNode);
}

export interface ErrorBoundaryState {
  hasError: boolean;
}
