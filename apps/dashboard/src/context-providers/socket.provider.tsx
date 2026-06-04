import type { ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { createContext, use, useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from '@/dashboard/constants/api-url.cont'
import { useAuth } from './auth.provider'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => use(SocketContext)

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const auth = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (auth.tenant?.accessToken) {
      // Try to build socket URL properly
      let baseUrl = API_URL
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4)
      }

      const newSocket = io(baseUrl, {
        auth: {
          token: auth.tenant.accessToken,
        },
        query: {
          connection_name: 'Dashboard-Admin',
          connection_type: 'DASHBOARD',
        },
        reconnection: true,
      })

      newSocket.on('connect', () => {
        setIsConnected(true)
        console.log('Socket connected')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        console.log('Socket disconnected')
      })

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err)
        // toast.error('Koneksi Real-time terputus. Beberapa fitur mungkin tidak berjalan.')
      })

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
    else {
      setSocket(null)
      setIsConnected(false)
    }
  }, [auth.tenant?.accessToken])

  return (
    <SocketContext value={{ socket, isConnected }}>
      {children}
    </SocketContext>
  )
}
