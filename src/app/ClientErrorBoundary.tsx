"use client";

import ErrorBoundary from "@/components/ui/ErrorBoundary/ErrorBoundary";
import { ReactNode } from "react";

interface ClientErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ReactNode | ((resetError: () => void) => React.ReactNode);
}

export default function ClientErrorBoundary({
  children,
  fallback,
}: ClientErrorBoundaryProps) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
