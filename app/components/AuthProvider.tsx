'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: number
  email: string | null
  name: string | null
  role: 'OWNER' | 'SITE_MANAGER' | 'GUEST'
  companyId: number | null
  siteId: number | null
  company?: {
    id: number
    name: string
  } | null
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
  sessionTimeoutMinutes: number
  remainingSeconds: number | null
  isExpiringSoon: boolean
  resetSessionActivity: () => void
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
  sessionTimeoutMinutes: 15,
  remainingSeconds: null,
  isExpiringSoon: false,
  resetSessionActivity: () => {},
})

const SESSION_TIMEOUT_MS = (parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || '15') || 15) * 60 * 1000
const EXPIRING_SOON_THRESHOLD_SEC = 60 // Show warning when 1 minute or less remains

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  
  const router = useRouter()
  const pathname = usePathname()
  
  const lastActivityRef = useRef<number>(Date.now())
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isAuthenticatedRef = useRef<boolean>(false)
  const authCheckDoneRef = useRef<boolean>(false)

  // 1. FIRST: Define handleSessionTimeout (depends on router)
  const handleSessionTimeout = useCallback(async () => {
    console.log('⏰ [Session] Timeout triggered - logging out')
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    
    setIsAuthenticated(false)
    setUser(null)
    setRemainingSeconds(null)
    setIsExpiringSoon(false)
    isAuthenticatedRef.current = false
    
    // Auto logout
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Error during session timeout logout:', error)
    }
    
    router.push('/login?reason=session_expired')
  }, [router])

  // 2. SECOND: Define resetSessionActivity (depends on handleSessionTimeout)
  const resetSessionActivity = useCallback(() => {
    if (!isAuthenticatedRef.current) return
    
    console.log('🔄 [Session] Activity detected - resetting timer')
    lastActivityRef.current = Date.now()
    
    // Clear existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    
    // Set new logout timeout
    timeoutIdRef.current = setTimeout(() => {
      handleSessionTimeout()
    }, SESSION_TIMEOUT_MS)
  }, [handleSessionTimeout])

  // 3. THIRD: Define startCountdown (depends on handleSessionTimeout)
  const startCountdown = useCallback(() => {
    console.log('⏱️ [Session] Starting countdown - Timeout: ' + SESSION_TIMEOUT_MS / 1000 / 60 + ' mins')
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    countdownIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current
      const remaining = Math.max(0, Math.ceil((SESSION_TIMEOUT_MS - elapsed) / 1000))
      
      setRemainingSeconds(remaining)
      setIsExpiringSoon(remaining <= EXPIRING_SOON_THRESHOLD_SEC && remaining > 0)
      
      // Log every 30 seconds or when close to expiry
      if (remaining % 30 === 0 || remaining <= 5) {
        console.log(`⏳ [Session] Remaining: ${Math.floor(remaining / 60)}:${(remaining % 60).toString().padStart(2, '0')}`)
      }
      
      if (remaining <= 0) {
        handleSessionTimeout()
      }
    }, 1000)
  }, [handleSessionTimeout])

  // 🔒 CRITICAL: Check auth on mount ONLY (not on every route change)
  useEffect(() => {
    if (authCheckDoneRef.current) return
    
    setIsLoading(true)
    checkAuth()
  }, []) // Empty dependency array - run only on mount

  // Handle redirects based on auth state and current pathname (but don't re-check auth)
  useEffect(() => {
    if (!authCheckDoneRef.current || isLoading) return // Wait for initial auth check

    // If authenticated and on login page, redirect to home
    if (isAuthenticatedRef.current && pathname === '/login') {
      console.log('🔄 [Auth] Redirecting authenticated user from /login to /')
      router.replace('/')
    }
    // If not authenticated and not on login page, redirect to login
    else if (!isAuthenticatedRef.current && pathname !== '/login') {
      console.log(`🔄 [Auth] Redirecting unauthenticated user from ${pathname} to /login`)
      router.replace('/login')
    }
  }, [pathname, isLoading, router]) // Trigger on route changes but use existing auth state

  const checkAuth = async () => {
    try {
      console.log('🔐 [Auth] Checking authentication...')
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user || data)
        setIsAuthenticated(true)
        isAuthenticatedRef.current = true
        authCheckDoneRef.current = true
        
        console.log('✅ [Session] User authenticated - starting session timer')
        
        // Start session management
        lastActivityRef.current = Date.now()
        setTimeout(() => {
          resetSessionActivity()
          startCountdown()
        }, 0)
      } else {
        console.log('❌ [Auth] Authentication failed')
        setIsAuthenticated(false)
        setUser(null)
        setRemainingSeconds(null)
        isAuthenticatedRef.current = false
        authCheckDoneRef.current = true
      }
    } catch (error) {
      console.error('🚨 [Auth] Error during auth check:', error)
      setIsAuthenticated(false)
      setUser(null)
      setRemainingSeconds(null)
      isAuthenticatedRef.current = false
      authCheckDoneRef.current = true
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    console.log('🚪 [Session] Manual logout')
    
    // Clear timers
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      })
      setIsAuthenticated(false)
      setUser(null)
      setRemainingSeconds(null)
      setIsExpiringSoon(false)
      isAuthenticatedRef.current = false
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

  // Track user activity to reset session timer
  useEffect(() => {
    if (!isAuthenticated || isLoading) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    
    const handleActivity = () => {
      resetSessionActivity()
    }

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity)
      })
    }
  }, [isAuthenticated, isLoading, resetSessionActivity])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading, 
      user,
      logout,
      canEdit,
      isOwner,
      isSiteManager,
      isGuest,
      sessionTimeoutMinutes: parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT_MINUTES || '15') || 15,
      remainingSeconds,
      isExpiringSoon,
      resetSessionActivity,
    }}>
      {/* 🔒 CRITICAL: Block rendering until auth check completes to prevent unauthorized access */}
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-gray-600">Verifying access...</p>
          </div>
        </div>
      ) : (
        <>
          {children}
        </>
      )}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
