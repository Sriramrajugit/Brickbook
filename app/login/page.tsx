'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Submitting login...', { userId, password: '***' })

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
        credentials: 'include', // Important: include cookies
      })

      console.log('Login response:', response.status, response.ok)

      if (response.ok) {
        console.log('Login successful, redirecting...')
        // Force a complete page reload with cookies
        window.location.replace('/')
      } else {
        const data = await response.json()
        console.log('Login failed:', data)
        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An error occurred. Please try again. Check console for details.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center overflow-hidden relative bg-cover bg-center">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/login-bg.png"
          alt="Background"
          fill
          priority
          //className="object-cover"
          className="object-contain md:object-cover"
          quality={100}
        />
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-400/30 via-blue-300/20 to-cyan-300/30"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen px-4 py-8 pt-20">
       
        {/* Middle Section - Circular Form Container */}
        <div className="flex items-center justify-center w-full mt-32">
          <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl p-10 sm:p-12 w-80 sm:w-96 h-80 sm:h-96 flex flex-col items-center justify-center border border-white/40 relative">
            
                      
            <form onSubmit={handleSubmit} className="w-full space-y-4 flex flex-col items-center">
              
              {/* Email Input */}
              <div className="w-full relative">
                <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-full focus-within:ring-2 focus-within:ring-blue-500 transition">
                  {/* Envelope Icon */}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="bg-transparent flex-1 outline-none text-gray-700 placeholder-gray-400 font-medium text-sm"
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="w-full relative">
                <div className="flex items-center gap-3 bg-gray-50 px-5 py-3 rounded-full focus-within:ring-2 focus-within:ring-blue-500 transition">
                  {/* Lock Icon */}
                  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-6 0v4a3 3 0 006 0z" />
                  </svg>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-transparent flex-1 outline-none text-gray-700 placeholder-gray-400 font-medium text-sm"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs font-medium w-full text-center">
                  {error}
                </div>
              )}

              {/* Log In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-bold py-2 px-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  'Log In'
                )}
              </button>



            </form>
          </div>
        </div>
      </div>
    </div>
  )
}