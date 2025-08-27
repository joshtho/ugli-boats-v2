// src/lib/auth.ts
import { API_BASE_URL } from '@/config/api'

const TOKEN_KEY = 'admin_token'

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

  // Don't add Content-Type for FormData (let browser set it with boundary)
  const isFormData = options.body instanceof FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Clean endpoint and build full URL
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/api/${cleanEndpoint}`
  
  const config: RequestInit = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)
    
    // Handle 401 responses by removing invalid token
    if (response.status === 401) {
      removeToken()
      window.location.reload()
      return response
    }
    
    return response
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}// Helper for common API operations
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
