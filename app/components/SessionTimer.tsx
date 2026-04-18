'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './AuthProvider'

export default function SessionTimer() {
  const { sessionTimeoutMinutes, remainingSeconds, isExpiringSoon } = useAuth()
  const [displayTime, setDisplayTime] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (remainingSeconds === null) {
      setIsVisible(false)
      return
    }

    setIsVisible(true)
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    setDisplayTime(`${minutes}:${seconds.toString().padStart(2, '0')}`)
  }, [remainingSeconds])

  if (!isVisible) {
    return null
  }

  const warningColor = isExpiringSoon ? 'text-red-600' : 'text-gray-600'
  const bgColor = isExpiringSoon ? 'bg-red-50' : 'bg-gray-50'

  return (
    <div className={`${bgColor} px-3 py-1 rounded-md border border-gray-200`}>
      <div className="text-xs text-gray-500 font-medium">Session</div>
      <div className={`text-sm font-mono font-bold ${warningColor}`}>
        {displayTime}
      </div>
      {isExpiringSoon && (
        <div className="text-xs text-red-600 font-semibold">Expiring soon!</div>
      )}
    </div>
  )
}
