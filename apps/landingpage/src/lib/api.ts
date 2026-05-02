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
    
    // 1. Try to get tenant from subdomain
    if (parts.length >= 2 && parts[0] !== 'localhost' && parts[0] !== 'www') {
      config.headers['x-tenant-id'] = parts[0]
      localStorage.setItem('last_tenant', parts[0])
    } 
    // 2. Fallback to query parameter
    else {
      const urlParams = new URLSearchParams(window.location.search)
      const tenant = urlParams.get('tenant') || localStorage.getItem('last_tenant')
      
      if (tenant) {
        config.headers['x-tenant-id'] = tenant
        localStorage.setItem('last_tenant', tenant)
      }
    }
  }
  return config
})
