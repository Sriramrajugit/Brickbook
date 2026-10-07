/**
 * Demo Access Utility - Unit Tests
 * Tests the core demo logic without database calls
 * Run: npm test -- demoAccess.test.ts
 */

import {
  isDemoAccount,
  isDemoActive,
  isDemoExpired,
  getDemoDaysRemaining,
  getDemoAccessStatus,
  canAccessDemo,
  calculateDemoExpiry,
  shouldShowDemoWarning,
  getDemoWarningMessage,
} from '@/lib/demoAccess'

// Mock Company objects for testing
const mockPaidCompany = {
  id: 1,
  name: 'Paid Company',
  package: 'FOUNDATION',
  isDemoAccount: false,
  demoStartedAt: null,
  demoExpiryDate: null,
} as any

const futureDate = new Date()
futureDate.setDate(futureDate.getDate() + 15) // 15 days from now

const mockActiveDemoCompany = {
  id: 2,
  name: 'Active Demo',
  package: 'DEMO',
  isDemoAccount: true,
  demoStartedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Started 1 day ago
  demoExpiryDate: futureDate,
} as any

const pastDate = new Date()
pastDate.setDate(pastDate.getDate() - 1) // Yesterday

const mockExpiredDemoCompany = {
  id: 3,
  name: 'Expired Demo',
  package: 'DEMO',
  isDemoAccount: true,
  demoStartedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // Started 35 days ago
  demoExpiryDate: pastDate, // Expired yesterday
} as any

describe('Demo Access Utility', () => {
  describe('isDemoAccount', () => {
    it('returns false for paid accounts', () => {
      expect(isDemoAccount(mockPaidCompany)).toBe(false)
    })

    it('returns true for demo accounts', () => {
      expect(isDemoAccount(mockActiveDemoCompany)).toBe(true)
      expect(isDemoAccount(mockExpiredDemoCompany)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isDemoAccount(null)).toBe(false)
    })
  })

  describe('isDemoActive', () => {
    it('returns false for paid accounts', () => {
      expect(isDemoActive(mockPaidCompany)).toBe(false)
    })

    it('returns true for active demo (not expired)', () => {
      expect(isDemoActive(mockActiveDemoCompany)).toBe(true)
    })

    it('returns false for expired demo', () => {
      expect(isDemoActive(mockExpiredDemoCompany)).toBe(false)
    })

    it('returns false for null', () => {
      expect(isDemoActive(null)).toBe(false)
    })
  })

  describe('isDemoExpired', () => {
    it('returns false for paid accounts', () => {
      expect(isDemoExpired(mockPaidCompany)).toBe(false)
    })

    it('returns false for active demo', () => {
      expect(isDemoExpired(mockActiveDemoCompany)).toBe(false)
    })

    it('returns true for expired demo', () => {
      expect(isDemoExpired(mockExpiredDemoCompany)).toBe(true)
    })

    it('returns false for null', () => {
      expect(isDemoExpired(null)).toBe(false)
    })
  })

  describe('getDemoDaysRemaining', () => {
    it('returns null for paid accounts', () => {
      expect(getDemoDaysRemaining(mockPaidCompany)).toBeNull()
    })

    it('returns positive days for active demo', () => {
      const days = getDemoDaysRemaining(mockActiveDemoCompany)
      expect(days).toBeGreaterThan(0)
      expect(days).toBeLessThanOrEqual(15)
    })

    it('returns 0 for expired demo', () => {
      expect(getDemoDaysRemaining(mockExpiredDemoCompany)).toBe(0)
    })

    it('returns null for null company', () => {
      expect(getDemoDaysRemaining(null)).toBeNull()
    })
  })

  describe('getDemoAccessStatus', () => {
    it('returns correct status for paid account', () => {
      const status = getDemoAccessStatus(mockPaidCompany)
      expect(status.isDemo).toBe(false)
      expect(status.isActive).toBe(false)
      expect(status.isExpired).toBe(false)
      expect(status.daysRemaining).toBeNull()
    })

    it('returns correct status for active demo', () => {
      const status = getDemoAccessStatus(mockActiveDemoCompany)
      expect(status.isDemo).toBe(true)
      expect(status.isActive).toBe(true)
      expect(status.isExpired).toBe(false)
      expect(status.daysRemaining).toBeGreaterThan(0)
    })

    it('returns correct status for expired demo', () => {
      const status = getDemoAccessStatus(mockExpiredDemoCompany)
      expect(status.isDemo).toBe(true)
      expect(status.isActive).toBe(false)
      expect(status.isExpired).toBe(true)
      expect(status.daysRemaining).toBe(0)
    })
  })

  describe('canAccessDemo', () => {
    it('returns true for paid accounts', () => {
      const result = canAccessDemo(mockPaidCompany)
      expect(result.canAccess).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('returns true for active demo', () => {
      const result = canAccessDemo(mockActiveDemoCompany)
      expect(result.canAccess).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('returns false for expired demo with reason', () => {
      const result = canAccessDemo(mockExpiredDemoCompany)
      expect(result.canAccess).toBe(false)
      expect(result.reason).toBe('DEMO_EXPIRED')
    })

    it('returns false for null company', () => {
      const result = canAccessDemo(null)
      expect(result.canAccess).toBe(false)
      expect(result.reason).toBe('NO_COMPANY')
    })
  })

  describe('calculateDemoExpiry', () => {
    it('calculates 30 days from now by default', () => {
      const expiry = calculateDemoExpiry()
      const now = new Date()
      const diffMs = expiry.getTime() - now.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      // Should be 29 or 30 depending on exact timing
      expect(diffDays).toBeGreaterThanOrEqual(29)
      expect(diffDays).toBeLessThanOrEqual(30)
    })

    it('calculates custom days from now', () => {
      const expiry = calculateDemoExpiry(7)
      const now = new Date()
      const diffMs = expiry.getTime() - now.getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      expect(diffDays).toBeGreaterThanOrEqual(6)
      expect(diffDays).toBeLessThanOrEqual(7)
    })
  })

  describe('shouldShowDemoWarning', () => {
    it('returns false for paid accounts', () => {
      expect(shouldShowDemoWarning(mockPaidCompany)).toBe(false)
    })

    it('returns false for demo with > 7 days remaining', () => {
      expect(shouldShowDemoWarning(mockActiveDemoCompany)).toBe(false) // Has 15 days
    })

    it('returns true for demo with <= 7 days remaining', () => {
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 5) // 5 days left
      
      const companyNearExpiry = {
        ...mockActiveDemoCompany,
        demoExpiryDate: warningDate,
      }
      expect(shouldShowDemoWarning(companyNearExpiry)).toBe(true)
    })

    it('returns false for expired demo', () => {
      expect(shouldShowDemoWarning(mockExpiredDemoCompany)).toBe(false)
    })
  })

  describe('getDemoWarningMessage', () => {
    it('returns null for paid accounts', () => {
      expect(getDemoWarningMessage(mockPaidCompany)).toBeNull()
    })

    it('returns "expires today" message', () => {
      const todayExpiry = new Date()
      const companyExpiringToday = {
        ...mockActiveDemoCompany,
        demoExpiryDate: todayExpiry,
      }
      const message = getDemoWarningMessage(companyExpiringToday)
      expect(message).toContain('expires today')
    })

    it('returns "expires tomorrow" message', () => {
      const tomorrowExpiry = new Date()
      tomorrowExpiry.setDate(tomorrowExpiry.getDate() + 1)
      const companyExpiringTomorrow = {
        ...mockActiveDemoCompany,
        demoExpiryDate: tomorrowExpiry,
      }
      const message = getDemoWarningMessage(companyExpiringTomorrow)
      expect(message).toContain('expires tomorrow')
    })

    it('returns days remaining message', () => {
      const companyExpiring = {
        ...mockActiveDemoCompany,
        demoExpiryDate: futureDate,
      }
      const message = getDemoWarningMessage(companyExpiring)
      expect(message).toContain('expires in')
      expect(message).toContain('days')
    })
  })
})

// Example usage for manual testing:
// Uncomment to run manually:
/*
console.log('=== Demo Access Utility Test ===')
console.log('Paid Account:', getDemoAccessStatus(mockPaidCompany))
console.log('Active Demo:', getDemoAccessStatus(mockActiveDemoCompany))
console.log('Expired Demo:', getDemoAccessStatus(mockExpiredDemoCompany))
console.log('Can Access - Paid:', canAccessDemo(mockPaidCompany))
console.log('Can Access - Active:', canAccessDemo(mockActiveDemoCompany))
console.log('Can Access - Expired:', canAccessDemo(mockExpiredDemoCompany))
console.log('Show Warning - Active:', shouldShowDemoWarning(mockActiveDemoCompany))
console.log('Warning Message - Active:', getDemoWarningMessage(mockActiveDemoCompany))
console.log('Demo Expiry (30 days):', calculateDemoExpiry())
*/
