import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/l/$code')({
  component: () => <div className="flex h-screen items-center justify-center font-mono">Redirecting...</div>,
  beforeLoad: async ({ params: { code } }) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      const res = await fetch(`${apiUrl}/public/short-url/${code}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data && data.target_url) {
          window.location.href = data.target_url
        }
      } else {
        console.error('Failed to resolve short URL, response not ok')
      }
    } catch (error) {
      console.error('Failed to resolve short URL', error)
    }
  }
})
