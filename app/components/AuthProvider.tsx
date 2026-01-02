'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: number
  email: string | null
  name: string | null
  role: 'OWNER' | 'SITE_MANAGER' | 'GUEST'
  companyId: number | null
  siteId: number | null
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  logout: () => Promise<void>
  canEdit: () => boolean
  isOwner: () => boolean
  isSiteManager: () => boolean
  isGuest: () => boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  logout: async () => {},
  canEdit: () => false,
  isOwner: () => false,
  isSiteManager: () => false,
  isGuest: () => true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkAuth()
  }, [pathname])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
        // If on login page and authenticated, redirect to home
        if (pathname === '/login') {
          router.replace('/')
        }
      } else {
        setIsAuthenticated(false)
        setUser(null)
        // If not on login page and not authenticated, redirect to login
        if (pathname !== '/login') {
          router.replace('/login')
        }
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
      if (pathname !== '/login') {
        router.replace('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setIsAuthenticated(false)
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const canEdit = () => {
    return user?.role === 'OWNER' || user?.role === 'SITE_MANAGER'
  }

  const isOwner = () => {
    return user?.role === 'OWNER'
  }

  const isSiteManager = () => {
    return user?.role === 'SITE_MANAGER'
  }

  const isGuest = () => {
    return user?.role === 'GUEST'
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user,
      logout,
      canEdit,
      isOwner,
      isSiteManager,
      isGuest
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
