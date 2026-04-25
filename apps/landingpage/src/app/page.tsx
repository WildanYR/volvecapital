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

export default async function Home() {
  const headersList = await headers()
  const host = headersList.get('host') || ''
  
  // Extract tenantId (subdomain)
  let tenantId = ''
  const parts = host.split('.')
  if (parts.length >= 2) {
    const subdomain = parts[0]
    if (subdomain !== 'www' && subdomain !== 'localhost') {
      tenantId = subdomain
    }
  }

  // If no tenantId, the component will handle the empty state
  const products = tenantId ? await getProducts(tenantId) : []

  return <HomeContent initialProducts={products} tenantId={tenantId} />
}
