'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground max-w-md">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={this.handleReset} variant="default">
                Try again
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline">
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Async Error Boundary Hook
 * For handling async errors in functional components
 */
export function useErrorHandler(): (error: Error) => void {
  const [, setError] = React.useState<Error>();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}
