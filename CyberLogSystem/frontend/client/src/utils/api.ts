import { SecureTokenStorage } from './secureStorage'

// Base API URL - comes from environment variable VITE_API_URL or defaults to localhost:8080/api
export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8080/api'

// Generic POST request that sends JSON data to the server
export async function postJson<T>(path: string, data: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include', // Include cookies for httpOnly cookie support
    headers: { 'Content-Type': 'application/json' }, // Tells server we are sending JSON
    body: JSON.stringify(data) // Convert JS object to JSON string
  })

  // Handle non-OK responses
  if (!res.ok) {
    let message = 'Request failed'
    try {
      const err = await res.json() // Try to parse server error response
      message = err.message || JSON.stringify(err)
    } catch {}
    throw new Error(message) // Throw error so caller can catch it
  }

  return res.json() // Return response body as JSON
}

// Helper function for making authenticated requests with httpOnly cookies as primary method
export async function authenticatedRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Always include credentials for httpOnly cookies
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include', // Always include cookies for httpOnly cookie support
    headers: {
      'Content-Type': 'application/json',
      ...options.headers, // Merge with custom headers (if provided)
    },
  })

  // If token expired or invalid → clear all secure storage
  if (response.status === 401) {
    await SecureTokenStorage.clearAll() // Clear all stored tokens securely (including cookies)
    throw new Error('Authentication expired. Please login again.')
  }

  // Handle other errors
  if (!response.ok) {
    let message = 'Request failed'
    try {
      const err = await response.json()
      message = err.message || JSON.stringify(err)
    } catch {}
    throw new Error(message)
  }

  return response.json() // Return successful response data
}

// Export secure storage for use in components
export { SecureTokenStorage }

// Debugging utility → checks if API server is running
export async function checkApiHealth(): Promise<boolean> {
  try {
    // Remove `/api` suffix then call /api/health endpoint
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`)
    return response.ok // Returns true if server responded successfully
  } catch {
    return false // If fetch fails (server down / no internet) return false
  }
}
