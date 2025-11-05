'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react'

interface ErrorMessageProps {
  title?: string
  message?: string
  error?: Error | string | null
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'destructive' | 'warning' | 'info'
}

/**
 * Reusable error message component with retry and dismiss actions
 */
export function ErrorMessage({
  title,
  message,
  error,
  onRetry,
  onDismiss,
  variant = 'destructive'
}: ErrorMessageProps) {
  // Extract error message
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : typeof error === 'string' ? error : 'An unexpected error occurred')

  // Default title based on variant
  const errorTitle = title || (variant === 'destructive' ? 'Error' : variant === 'warning' ? 'Warning' : 'Notice')

  // Icon based on variant
  const Icon = variant === 'destructive' ? XCircle : AlertCircle

  return (
    <Alert variant={variant} className="my-4">
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-semibold">{errorTitle}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm leading-relaxed">{errorMessage}</p>

        {/* Action buttons */}
        {(onRetry || onDismiss) && (
          <div className="flex gap-2 mt-4">
            {onRetry && (
              <Button onClick={onRetry} variant="outline" size="sm">
                <RefreshCw className="w-3 h-3 mr-2" />
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button onClick={onDismiss} variant="ghost" size="sm">
                Dismiss
              </Button>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

/**
 * Extract user-friendly error messages from common API errors
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for common error types
    if (error.message.includes('Rate limit')) {
      return 'You have exceeded the rate limit. Please wait a moment and try again.'
    }
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      return 'Your session has expired. Please log in again.'
    }
    if (error.message.includes('403') || error.message.includes('Forbidden')) {
      return 'You do not have permission to perform this action.'
    }
    if (error.message.includes('404') || error.message.includes('Not found')) {
      return 'The requested resource was not found.'
    }
    if (error.message.includes('500') || error.message.includes('Internal server')) {
      return 'A server error occurred. Please try again later.'
    }
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.'
    }
    if (error.message.includes('API key')) {
      return 'Invalid API configuration. Please contact support.'
    }
    if (error.message.includes('quota') || error.message.includes('limit exceeded')) {
      return 'API quota exceeded. Please upgrade your plan or wait for the quota to reset.'
    }

    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorHandler<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
) {
  return function WithErrorHandler(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Simple error boundary for catching React errors
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; reset: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback
        return <Fallback error={this.state.error} reset={() => this.setState({ hasError: false, error: null })} />
      }

      return (
        <ErrorMessage
          title="Something went wrong"
          message={getErrorMessage(this.state.error)}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      )
    }

    return this.props.children
  }
}

import React from 'react'
