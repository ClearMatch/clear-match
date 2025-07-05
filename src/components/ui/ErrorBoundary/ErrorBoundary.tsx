"use client";

import React from "react";
import ErrorPage from "../ErrorPage";
import { ErrorBoundaryProps, ErrorBoundaryState } from "./Types";

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, this should be sent to a logging service
    if (process.env.NODE_ENV === 'development') {
      console.error("Uncaught error:", error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      const { fallback } = this.props;

      if (typeof fallback === "function") {
        return fallback(this.resetError);
      }

      return (
        fallback || (
          <ErrorPage
            title="Something went wrong"
            description="An unexpected error occurred."
            errorDescription="Please try again or return to the home page."
            buttonLabel="Go to Home Page"
            onButtonClick={() => {
              this.resetError();
              window.location.href = "/";
            }}
          />
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
