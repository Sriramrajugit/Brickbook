/**
 * Demo Access Utility
 * Central place for all demo-related access decisions
 * This is the single source of truth for demo logic
 */

import { Company } from '@prisma/client'

/**
 * Demo access status type
 */
export type DemoAccessStatus = {
  isDemo: boolean
  isActive: boolean
  isExpired: boolean
  demoStartedAt: Date | null
  demoExpiresAt: Date | null
  daysRemaining: number | null
}

/**
 * Check if account is a demo account
 */
export function isDemoAccount(company: Company | null): boolean {
  if (!company) return false
  return (company as any).isDemoAccount === true
}

/**
 * Check if demo is currently active (not yet expired)
 */
export function isDemoActive(company: Company | null): boolean {
  if (!company || !isDemoAccount(company)) return false
  
  const demoExpiryDate = (company as any).demoExpiryDate
  if (!demoExpiryDate) return false
  
  const now = new Date()
  return now < new Date(demoExpiryDate)
}

/**
 * Check if demo has expired
 */
export function isDemoExpired(company: Company | null): boolean {
  if (!company || !isDemoAccount(company)) return false
  
  const demoExpiryDate = (company as any).demoExpiryDate
  if (!demoExpiryDate) return false
  
  const now = new Date()
  return now >= new Date(demoExpiryDate)
}

/**
 * Calculate days remaining in demo
 * Returns null if not a demo or if expired
 */
export function getDemoDaysRemaining(company: Company | null): number | null {
  if (!company || !isDemoAccount(company)) return null
  
  const demoExpiryDate = (company as any).demoExpiryDate
  if (!demoExpiryDate) return null
  
  const now = new Date()
  const expiry = new Date(demoExpiryDate)
  
  if (now >= expiry) {
    return 0
  }
  
  // Calculate exact days remaining
  const diffTime = expiry.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Get complete demo access status
 * This is the main function to use for getting demo status
 */
export function getDemoAccessStatus(company: Company | null): DemoAccessStatus {
  const isDemo = isDemoAccount(company)
  const isActive = isDemoActive(company)
  const isExpired = isDemoExpired(company)
  const daysRemaining = getDemoDaysRemaining(company)
  
  const demoStartedAt = company ? (company as any).demoStartedAt ?? null : null
  const demoExpiresAt = company ? (company as any).demoExpiryDate ?? null : null
  
  return {
    isDemo,
    isActive,
    isExpired,
    demoStartedAt: demoStartedAt ? new Date(demoStartedAt) : null,
    demoExpiresAt: demoExpiresAt ? new Date(demoExpiresAt) : null,
    daysRemaining,
  }
}

/**
 * Check if user can access the application
 * Based on demo status only (not package access)
 * Used as a pre-check before package access
 */
export function canAccessDemo(company: Company | null): {
  canAccess: boolean
  reason?: string
} {
  if (!company) {
    return { canAccess: false, reason: 'NO_COMPANY' }
  }
  
  // If not a demo account, demo access rules don't apply
  if (!isDemoAccount(company)) {
    return { canAccess: true }
  }
  
  // Demo account - check expiry
  if (isDemoExpired(company)) {
    return {
      canAccess: false,
      reason: 'DEMO_EXPIRED',
    }
  }
  
  // Demo is active
  return { canAccess: true }
}

/**
 * Calculate demo expiry date from now
 * Default: 30 days from now
 */
export function calculateDemoExpiry(days: number = 30): Date {
  const expiryDate = new Date()
  expiryDate.setDate(expiryDate.getDate() + days)
  return expiryDate
}

/**
 * Format demo status for API responses
 */
export function formatDemoStatusForAPI(company: Company | null) {
  const status = getDemoAccessStatus(company)
  
  return {
    isDemo: status.isDemo,
    isActive: status.isActive,
    isExpired: status.isExpired,
    demoStartedAt: status.demoStartedAt?.toISOString() ?? null,
    demoExpiresAt: status.demoExpiresAt?.toISOString() ?? null,
    daysRemaining: status.daysRemaining,
  }
}

/**
 * Check if demo warning should be shown
 * Warning appears when 7 days or less remain
 */
export function shouldShowDemoWarning(company: Company | null): boolean {
  if (!isDemoAccount(company)) return false
  if (isDemoExpired(company)) return false
  
  const daysRemaining = getDemoDaysRemaining(company)
  if (daysRemaining === null) return false
  
  return daysRemaining <= 7
}

/**
 * Get warning message for demo countdown
 */
export function getDemoWarningMessage(company: Company | null): string | null {
  if (!shouldShowDemoWarning(company)) return null
  
  const daysRemaining = getDemoDaysRemaining(company)
  
  if (daysRemaining === 0) {
    return 'Your BrickBook demo expires today!'
  }
  
  if (daysRemaining === 1) {
    return 'Your BrickBook demo expires tomorrow!'
  }
  
  return `Your BrickBook demo expires in ${daysRemaining} days.`
}
