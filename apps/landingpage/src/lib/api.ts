import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add interceptor to automatically add the x-tenant-id header
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const parts = hostname.split('.')
    if (parts.length >= 2) {
      // e.g. papapremium.localhost -> papapremium
      config.headers['x-tenant-id'] = parts[0]
    }
  }
  return config
})
