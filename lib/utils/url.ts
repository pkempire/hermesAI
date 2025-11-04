import { headers } from 'next/headers'

/**
 * Helper function to get base URL from headers
 * Extracts URL information from Next.js request headers
 */
export async function getBaseUrlFromHeaders(): Promise<URL> {
  const headersList = await headers()
  const baseUrl = headersList.get('x-base-url')
  const url = headersList.get('x-url')
  const host = headersList.get('x-host')
  const forwardedHost = headersList.get('x-forwarded-host')
  const protocol = headersList.get('x-protocol') || 'https:'

  try {
    // Try to use the pre-constructed base URL if available
    if (baseUrl) {
      return new URL(baseUrl)
    } else if (url) {
      return new URL(url)
    } else if (forwardedHost) {
      // Use forwarded host in production (Vercel)
      const constructedUrl = `https://${forwardedHost}`
      return new URL(constructedUrl)
    } else if (host) {
      const constructedUrl = `${protocol}${
        protocol.endsWith(':') ? '//' : '://'
      }${host}`
      return new URL(constructedUrl)
    } else {
      // Only use localhost in development
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        return new URL('http://localhost:3000')
      }
      // In production, try to construct from vercel URL
      const vercelUrl = process.env.VERCEL_URL
      if (vercelUrl) {
        return new URL(`https://${vercelUrl}`)
      }
      // Last resort: throw error instead of localhost
      throw new Error('Unable to determine base URL')
    }
  } catch (urlError) {
    // Only fallback to localhost in development
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      return new URL('http://localhost:3000')
    }
    // In production, throw error to prevent localhost redirects
    throw new Error('Unable to determine base URL in production')
  }
}

/**
 * Resolves the base URL using environment variables or headers
 * Centralizes the base URL resolution logic used across the application
 * @returns A URL object representing the base URL
 */
export async function getBaseUrl(): Promise<URL> {
  // Check for environment variables first
  const baseUrlEnv = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL
  
  if (baseUrlEnv) {
    try {
      const baseUrlObj = new URL(baseUrlEnv)
      console.log('Using BASE_URL environment variable:', baseUrlEnv)
      return baseUrlObj
    } catch (error) {
      console.warn(
        'Invalid BASE_URL environment variable, falling back to headers'
      )
      // Fall back to headers if the environment variable is invalid
    }
  }
  
  // If no valid environment variable is available, use headers
  return await getBaseUrlFromHeaders()
}

/**
 * Gets the base URL as a string
 * Convenience wrapper around getBaseUrl that returns a string
 * @returns A string representation of the base URL
 */
export async function getBaseUrlString(): Promise<string> {
  const baseUrlObj = await getBaseUrl()
  return baseUrlObj.toString()
}