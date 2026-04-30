import { headers } from 'next/headers'
import { HomeContent } from '@/components/home-content'
import { Product } from '@/hooks/use-products'
import axios from 'axios'

async function getProducts(tenantId: string): Promise<Product[]> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const { data } = await axios.get(`${API_URL}/public/product`, {
      headers: {
        'x-tenant-id': tenantId
      }
    })
    return data
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return []
  }
}

async function getSettings(tenantId: string): Promise<Record<string, string>> {
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const { data } = await axios.get(`${API_URL}/public/settings`, {
      headers: {
        'x-tenant-id': tenantId
      }
    })
    return data
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return {}
  }
}

export default async function Home() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // Extract tenantId (subdomain)
  let tenantId = ''
  const parts = host.split('.')
  if (parts.length >= 2) {
    const subdomain = parts[0]
    if (subdomain !== 'www' && subdomain !== 'localhost' && subdomain !== '127') {
      tenantId = subdomain
    }
  }

  // Fallback for development if no subdomain
  if (!tenantId && process.env.NODE_ENV === 'development') {
    // In dev, we might want a way to test different tenants
    // For now, let's just use the first part if it's not localhost
  }

  // If no tenantId, the component will handle the empty state
  const products = tenantId ? await getProducts(tenantId) : []
  const settings = tenantId ? await getSettings(tenantId) : {}

  return <HomeContent initialProducts={products} tenantId={tenantId} settings={settings} />
}
