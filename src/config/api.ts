// API configuration for different environments
const isDevelopment = import.meta.env.DEV
const isGitHubPages = import.meta.env.PROD && window.location.hostname.includes('github.io')

// Base URL configuration
export const API_BASE_URL = isDevelopment
  ? 'http://localhost:3001'
  : isGitHubPages
  ? 'https://your-api-server.com' // Replace with your actual API server for production
  : 'http://localhost:3001'

// For GitHub Pages, we'll serve static JSON files instead of API calls
export const USE_STATIC_DATA = isGitHubPages

// Static data URLs for GitHub Pages
export const STATIC_DATA_URLS = {
  builds: '/ugli-boats-v2/data/builds.json',
  submissions: '/ugli-boats-v2/data/submissions.json'
}

// Image base URL for different environments
export const IMAGE_BASE_URL = isDevelopment
  ? 'http://localhost:3001'
  : '/ugli-boats-v2'

export default {
  API_BASE_URL,
  USE_STATIC_DATA,
  STATIC_DATA_URLS,
  IMAGE_BASE_URL
}
