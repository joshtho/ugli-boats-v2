// src/lib/auth.ts
const TOKEN_KEY = 'admin_token'

// Dynamic API base URL for development and production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URL in production (same domain)
  : 'http://localhost:3001' // Development server

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token)
export const removeToken = () => localStorage.removeItem(TOKEN_KEY)

// Logout function that calls the server endpoint
export const logout = async () => {
  const token = getToken()
  
  if (token) {
    try {
      // Call server logout endpoint to invalidate session
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Logout request failed:', error)
      // Continue with local logout even if server request fails
    }
  }
  
  // Remove token locally
  removeToken()
}

// API utility with authentication
export const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken()
  
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  
  // Only add Content-Type if not already set and not FormData
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })
  
  if (response.status === 401) {
    // Token expired or invalid, redirect to login
    removeToken()
    window.location.reload()
    throw new Error('Authentication required')
  }
  
  return response
}

// Helper for common API operations
export const api = {
  get: (endpoint: string) => authenticatedFetch(endpoint),
  
  post: (endpoint: string, data?: any) => 
    authenticatedFetch(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
    
  put: (endpoint: string, data?: any) => 
    authenticatedFetch(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),
    
  delete: (endpoint: string) => 
    authenticatedFetch(endpoint, {
      method: 'DELETE',
    }),
}
