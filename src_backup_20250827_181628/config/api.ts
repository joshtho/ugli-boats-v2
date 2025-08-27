// API configuration for different environments
const isDevelopment = import.meta.env.DEV

// Base URL configuration
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001' // Development: separate backend server
  : '' // Production: same domain (Render will serve both frontend and backend)

// Image base URL for different environments  
export const IMAGE_BASE_URL = isDevelopment
  ? 'http://localhost:3001' // Development: backend serves images
  : '' // Production: same domain

// Utility function to get full image URL
export const getImageUrl = (imagePath: string): string => {
  if (!imagePath) return ''
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http')) return imagePath
  
  // Handle different path formats
  if (imagePath.startsWith('/uploads/') || imagePath.startsWith('/ugli-boats-v2/')) {
    return `${IMAGE_BASE_URL}${imagePath}`
  }
  
  // Default: assume it's in uploads folder
  return `${IMAGE_BASE_URL}/uploads/${imagePath}`
}

// Utility function to get API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  return `${API_BASE_URL}/api/${cleanEndpoint}`
}

export default {
  API_BASE_URL,
  IMAGE_BASE_URL,
  getImageUrl,
  getApiUrl
}
