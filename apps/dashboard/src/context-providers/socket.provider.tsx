import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './auth.provider'
import { API_URL } from '@/dashboard/constants/api-url.cont'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
})

export const useSocket = () => useContext(SocketContext)

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
      let baseUrl = API_URL;
      if (baseUrl.endsWith('/api')) {
        baseUrl = baseUrl.slice(0, -4);
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
    } else {
      setSocket(null)
      setIsConnected(false)
    }
  }, [auth.tenant?.accessToken])

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  )
}
