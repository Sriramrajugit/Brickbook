'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function Login() {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setError('')

    console.log('Submitting login...', {
      userId,
      password: '***',
    })

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, password }),
        credentials: 'include',
      })

      console.log('Login response:', response.status, response.ok)

      if (response.ok) {
        console.log('Login successful, redirecting...')
        window.location.replace('/')
      } else {
        const data = await response.json()

        console.log('Login failed:', data)

        setError(data.error || 'Login failed')
      }
    } catch (err) {
      console.error('Login error:', err)

      setError(
        'An error occurred. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#dceef7] overflow-hidden">

      {/* =========================================================
          MAIN LOGIN LAYOUT
      ========================================================= */}
      <div className="min-h-screen w-full flex">

        {/* =======================================================
            LEFT SIDE - CONSTRUCTION IMAGE
        ======================================================= */}
        <div className="hidden lg:block lg:w-[66%] xl:w-[68%] relative overflow-hidden">

          <Image
            src="/login-bg-web.png"
            alt="BrickBook construction management"
            fill
            priority
            quality={100}
            className="object-cover"
            sizes="68vw"
          />

          {/* Soft overlay to blend image into login panel */}
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#dceef7]/40 to-transparent pointer-events-none" />

        </div>


        {/* =======================================================
            RIGHT SIDE
        ======================================================= */}
        <div
          className="
            w-full
            lg:w-[34%]
            xl:w-[32%]
            min-h-screen
            flex
            items-center
            justify-center
            px-5
            py-8
            bg-gradient-to-br
            from-[#e8f5fb]
            via-[#d9edf6]
            to-[#cfe6f1]
          "
        >

          {/* =====================================================
              LOGIN PANEL
          ===================================================== */}
          <div
            className="
              w-full
              max-w-[470px]
              min-h-[680px]
              rounded-[28px]
              border
              border-[#91b9cb]
              bg-white/20
              backdrop-blur-[2px]
              shadow-[0_8px_35px_rgba(61,100,120,0.12)]
              px-8
              py-10
              sm:px-10
              flex
              flex-col
            "
          >

            {/* =================================================
                BRICKBOOK BRANDING
            ================================================= */}
            <div className="flex flex-col items-center mt-2 mb-10">

              <div className="flex items-center gap-3 justify-center w-full">

                {/* BrickBook Logo Image */}
                <img
                  src="/brickbook-logo.png"
                  alt="BrickBook Logo"
                  className="w-[220px] h-auto object-contain"
                />

              </div>

            </div>


            {/* =================================================
                LOGIN FORM
            ================================================= */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col flex-1"
            >

              {/* =================================================
                  USERNAME
              ================================================= */}
              <div className="mb-7">

                <label
                  htmlFor="userId"
                  className="
                    block
                    mb-2.5
                    text-[15px]
                    font-semibold
                    text-[#182c36]
                  "
                >
                  Username
                </label>

                <div className="relative">

                  {/* User Icon */}
                  <div
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-[#7d8d96]
                      pointer-events-none
                    "
                  >
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
                    </svg>
                  </div>

                  <input
                    type="text"
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="owner@brickbook.in"
                    autoComplete="username"
                    required
                    className="
                      w-full
                      h-[64px]
                      pl-12
                      pr-4
                      rounded-[13px]
                      border
                      border-[#b9cbd4]
                      bg-white/95
                      text-[16px]
                      text-[#1b252b]
                      placeholder:text-[#8997a0]
                      shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]
                      outline-none
                      transition-all
                      duration-200
                      focus:border-[#9b4329]
                      focus:ring-2
                      focus:ring-[#b85a3b]/20
                    "
                  />

                </div>

              </div>


              {/* =================================================
                  PASSWORD
              ================================================= */}
              <div className="mb-6">

                <label
                  htmlFor="password"
                  className="
                    block
                    mb-2.5
                    text-[15px]
                    font-semibold
                    text-[#182c36]
                  "
                >
                  Password
                </label>

                <div className="relative">

                  {/* Lock Icon */}
                  <div
                    className="
                      absolute
                      left-4
                      top-1/2
                      -translate-y-1/2
                      text-[#7d8d96]
                      pointer-events-none
                    "
                  >
                    <svg
                      width="21"
                      height="21"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect
                        x="4"
                        y="10"
                        width="16"
                        height="11"
                        rx="2"
                      />

                      <path d="M8 10V7a4 4 0 0 1 8 0v3" />

                    </svg>
                  </div>

                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                    className="
                      w-full
                      h-[64px]
                      pl-12
                      pr-4
                      rounded-[13px]
                      border
                      border-[#b9cbd4]
                      bg-white/95
                      text-[16px]
                      text-[#1b252b]
                      placeholder:text-[#8997a0]
                      shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]
                      outline-none
                      transition-all
                      duration-200
                      focus:border-[#9b4329]
                      focus:ring-2
                      focus:ring-[#b85a3b]/20
                    "
                  />

                </div>

              </div>


              {/* =================================================
                  ERROR
              ================================================= */}
              {error && (
                <div
                  className="
                    mb-5
                    rounded-xl
                    border
                    border-red-200
                    bg-red-50
                    px-4
                    py-3
                    text-center
                    text-sm
                    font-medium
                    text-red-600
                  "
                >
                  {error}
                </div>
              )}


              {/* =================================================
                  LOGIN BUTTON
              ================================================= */}
              <button
                type="submit"
                disabled={loading}
                className="
                  relative
                  w-full
                  h-[62px]
                  rounded-[32px]
                  overflow-hidden
                  border-[2px]
                  border-[#70301d]
                  bg-[#914021]
                  shadow-[0_5px_10px_rgba(65,40,30,0.35)]
                  transition-all
                  duration-200
                  hover:brightness-110
                  hover:-translate-y-[1px]
                  active:translate-y-[1px]
                  disabled:opacity-70
                  disabled:cursor-not-allowed
                  disabled:hover:translate-y-0
                "
              >

                {/* Brick pattern */}
                <div
                  className="
                    absolute
                    inset-0
                    opacity-90
                    pointer-events-none
                  "
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        to right,
                        transparent 0,
                        transparent 49%,
                        rgba(91,35,20,0.55) 50%,
                        transparent 51%
                      ),
                      linear-gradient(
                        to bottom,
                        transparent 0,
                        transparent 47%,
                        rgba(91,35,20,0.55) 48%,
                        rgba(91,35,20,0.55) 52%,
                        transparent 53%
                      )
                    `,
                    backgroundSize: '92px 31px',
                  }}
                />

                {/* Highlight */}
                <div
                  className="
                    absolute
                    inset-x-0
                    top-0
                    h-[3px]
                    bg-white/15
                  "
                />

                <span
                  className="
                    relative
                    z-10
                    text-[20px]
                    font-semibold
                    text-white
                    drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]
                  "
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </span>

              </button>


              {/* =================================================
                  FORGOT PASSWORD
              ================================================= */}
              <div className="flex justify-center mt-8">

                <button
                  type="button"
                  onClick={() => {
                    alert('Forgot password feature coming soon')
                  }}
                  className="
                    relative
                    h-[49px]
                    min-w-[210px]
                    px-7
                    rounded-[25px]
                    border-[2px]
                    border-[#71311f]
                    bg-[#914021]
                    text-[16px]
                    font-semibold
                    text-white
                    shadow-[0_4px_8px_rgba(65,40,30,0.3)]
                    transition-all
                    duration-200
                    hover:brightness-110
                    hover:-translate-y-[1px]
                    active:translate-y-[1px]
                  "
                >

                  {/* Small brick pattern */}
                  <span
                    className="
                      absolute
                      inset-0
                      rounded-[25px]
                      opacity-50
                      pointer-events-none
                    "
                    style={{
                      backgroundImage: `
                        linear-gradient(
                          to right,
                          transparent 0,
                          transparent 48%,
                          rgba(91,35,20,0.45) 50%,
                          transparent 52%
                        )
                      `,
                      backgroundSize: '70px 100%',
                    }}
                  />

                  <span className="relative z-10">
                    Forgot Password?
                  </span>

                </button>

              </div>


              {/* =================================================
                  BOTTOM SPACE / DECORATION
              ================================================= */}
              <div className="flex-1 min-h-[70px] relative">

                <div
                  className="
                    absolute
                    bottom-1
                    right-0
                    text-[#ffffff]/80
                  "
                >
                  <svg
                    width="42"
                    height="42"
                    viewBox="0 0 42 42"
                    fill="none"
                  >
                    <path
                      d="M21 0L25 15L42 21L25 27L21 42L17 27L0 21L17 15L21 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>

              </div>

            </form>

          </div>

        </div>

      </div>

    </div>
  )
}