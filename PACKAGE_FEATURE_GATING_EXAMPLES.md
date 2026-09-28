# Package-Based Feature Gating - Code Examples

This guide shows developers how to implement package-based feature access control throughout the application.

## Basic Module Access Check

### Simple Boolean Check
```typescript
import { hasModuleAccess } from '@/lib/packageModules'

// In any component
const canAccessBills = hasModuleAccess(company.package, 'Bills & Invoices')

if (canAccessBills) {
  // Show Bills & Invoices feature
}
```

## Navigation Component Examples

### Conditional Navigation Items
```typescript
// components/Navigation.tsx
import { hasModuleAccess } from '@/lib/packageModules'
import type { Company } from '@prisma/client'

interface NavigationProps {
  company: Company
}

export default function Navigation({ company }: NavigationProps) {
  return (
    <nav>
      {/* Always available */}
      <NavItem href="/dashboard">Dashboard</NavItem>
      <NavItem href="/transactions">Transactions</NavItem>
      
      {/* Package-dependent */}
      {hasModuleAccess(company.package, 'Bills & Invoices') && (
        <NavItem href="/bills">Bills & Invoices</NavItem>
      )}
      
      {hasModuleAccess(company.package, 'Import Data') && (
        <NavItem href="/import">Import Data</NavItem>
      )}
      
      {hasModuleAccess(company.package, 'BOQ') && (
        <NavItem href="/boq">BOQ</NavItem>
      )}
    </nav>
  )
}
```

### Grouped Feature Sections
```typescript
// Example grouping features by package
const renderNavigationByPackage = (company: Company) => {
  const tier = getPackageTierLevel(company.package)
  
  return (
    <>
      {/* Foundation features - always available */}
      <section>
        <h3>Core Features</h3>
        <NavItem href="/dashboard">Dashboard</NavItem>
        <NavItem href="/transactions">Transactions</NavItem>
        {/* ... */}
      </section>
      
      {/* Structure features - tier 2+ */}
      {tier >= 2 && (
        <section>
          <h3>Advanced Features</h3>
          <NavItem href="/bills">Bills & Invoices</NavItem>
          <NavItem href="/import">Import Data</NavItem>
        </section>
      )}
      
      {/* Landmark features - tier 3 */}
      {tier >= 3 && (
        <section>
          <h3>Enterprise Features</h3>
          <NavItem href="/boq">BOQ</NavItem>
        </section>
      )}
    </>
  )
}
```

## Page-Level Access Control

### Protecting a Page
```typescript
// app/bills/page.tsx
'use client'

import { useAuth } from '@/app/components/AuthProvider'
import { hasModuleAccess } from '@/lib/packageModules'
import UpgradePrompt from '@/app/components/UpgradePrompt'

export default function BillsPage() {
  const { user } = useAuth()
  const company = await getCompany(user?.companyId)
  
  // Check access
  if (!hasModuleAccess(company.package, 'Bills & Invoices')) {
    return <UpgradePrompt 
      feature="Bills & Invoices"
      currentPackage={company.package}
    />
  }
  
  return <BillsInvoicesContent />
}
```

### API Route Protection
```typescript
// app/api/bills/route.ts
import { getCurrentUser } from '@/lib/auth'
import { hasModuleAccess } from '@/lib/packageModules'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()
  const company = await prisma.company.findUnique({
    where: { id: user?.companyId }
  })
  
  // Protect the endpoint
  if (!hasModuleAccess(company.package, 'Bills & Invoices')) {
    return NextResponse.json(
      { error: 'This feature requires Structure package or higher' },
      { status: 403 }
    )
  }
  
  // Process request
  return NextResponse.json({ data: [] })
}
```

## UI Components for Feature Gating

### Upgrade Prompt Component
```typescript
// components/UpgradePrompt.tsx
import { getSuggestedUpgrades, getPackageTierLevel } from '@/lib/packageModules'
import type { CustomerPackage } from '@/lib/packageModules'

interface UpgradePromptProps {
  feature: string
  currentPackage: CustomerPackage
}

export default function UpgradePrompt({ feature, currentPackage }: UpgradePromptProps) {
  const suggested = getSuggestedUpgrades(currentPackage)
  
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
      <h2 className="text-2xl font-bold text-blue-900 mb-2">
        Upgrade to Access {feature}
      </h2>
      <p className="text-blue-700 mb-4">
        The <strong>{feature}</strong> feature is not available in your current plan.
      </p>
      
      <div className="bg-white rounded p-4 mb-4">
        <p className="text-sm text-gray-600">
          Current Package: <strong>{currentPackage}</strong>
        </p>
        <p className="text-sm text-gray-600">
          Suggested Upgrades: <strong>{suggested.join(', ')}</strong>
        </p>
      </div>
      
      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
        Upgrade Now
      </button>
    </div>
  )
}
```

### Feature Badge Component
```typescript
// components/FeatureBadge.tsx
import { getPackageBadgeColor } from '@/lib/packageModules'
import type { CustomerPackage } from '@/lib/packageModules'

interface FeatureBadgeProps {
  package: CustomerPackage
  showLabel?: boolean
}

export default function FeatureBadge({ package: pkg, showLabel = true }: FeatureBadgeProps) {
  const colors = getPackageBadgeColor(pkg)
  
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors}`}>
      {showLabel && `${pkg} Plan`}
      {!showLabel && '🔒'}
    </span>
  )
}
```

### Locked Feature Overlay
```typescript
// components/LockedFeature.tsx
import { hasModuleAccess } from '@/lib/packageModules'
import type { CustomerPackage } from '@/lib/packageModules'

interface LockedFeatureProps {
  module: string
  package: CustomerPackage
  children: React.ReactNode
}

export default function LockedFeature({ 
  module, 
  package: pkg, 
  children 
}: LockedFeatureProps) {
  const hasAccess = hasModuleAccess(pkg, module)
  
  if (hasAccess) {
    return <>{children}</>
  }
  
  return (
    <div className="relative opacity-50 pointer-events-none">
      {children}
      <div className="absolute inset-0 bg-gray-400 bg-opacity-50 rounded flex items-center justify-center">
        <div className="bg-white px-4 py-2 rounded shadow">
          <p className="text-sm font-semibold">🔒 {module}</p>
          <p className="text-xs text-gray-600">Upgrade to unlock</p>
        </div>
      </div>
    </div>
  )
}

// Usage
<LockedFeature module="BOQ" package={company.package}>
  <BOQComponent />
</LockedFeature>
```

## Hook for Package Access

### Custom Hook
```typescript
// hooks/usePackageAccess.ts
import { useAuth } from '@/app/components/AuthProvider'
import { hasModuleAccess } from '@/lib/packageModules'

/**
 * Hook to check package access for current user's company
 */
export function usePackageAccess() {
  const { user } = useAuth()
  const [company, setCompany] = useState(null)
  
  useEffect(() => {
    if (user?.companyId) {
      fetch(`/api/admin/companies/${user.companyId}`)
        .then(res => res.json())
        .then(data => setCompany(data.data))
    }
  }, [user?.companyId])
  
  const canAccess = (module: string) => {
    if (!company) return false
    return hasModuleAccess(company.package, module)
  }
  
  return { company, canAccess, package: company?.package }
}

// Usage in component
export function MyComponent() {
  const { canAccess, package: pkg } = usePackageAccess()
  
  if (!canAccess('Bills & Invoices')) {
    return <UpgradePrompt feature="Bills & Invoices" currentPackage={pkg} />
  }
  
  return <BillsContent />
}
```

## Advanced: Detailed Feature Requirements

```typescript
// lib/featureRequirements.ts
import type { CustomerPackage } from './packageModules'

export interface FeatureRequirement {
  module: string
  requiredPackage: CustomerPackage
  description: string
  icon: string
}

export const FEATURE_REQUIREMENTS: FeatureRequirement[] = [
  {
    module: 'Bills & Invoices',
    requiredPackage: 'STRUCTURE',
    description: 'Create and manage vendor bills and customer invoices',
    icon: '📋'
  },
  {
    module: 'Import Data',
    requiredPackage: 'STRUCTURE',
    description: 'Import transactions from CSV or other sources',
    icon: '📥'
  },
  {
    module: 'BOQ',
    requiredPackage: 'LANDMARK',
    description: 'Manage Bill of Quantities for projects',
    icon: '📊'
  },
]

export function getFeatureRequirement(module: string): FeatureRequirement | undefined {
  return FEATURE_REQUIREMENTS.find(f => f.module === module)
}

export function canAccessFeature(currentPackage: CustomerPackage, module: string): boolean {
  const requirement = getFeatureRequirement(module)
  if (!requirement) return false
  
  return hasModuleAccess(currentPackage, module)
}
```

## Testing Examples

```typescript
// __tests__/packageModules.test.ts
import { hasModuleAccess, getPackageModules, getPackageTierLevel } from '@/lib/packageModules'

describe('Package Module Access', () => {
  it('should allow Foundation modules for all packages', () => {
    expect(hasModuleAccess('FOUNDATION', 'Dashboard')).toBe(true)
    expect(hasModuleAccess('STRUCTURE', 'Dashboard')).toBe(true)
    expect(hasModuleAccess('LANDMARK', 'Dashboard')).toBe(true)
  })
  
  it('should restrict Bills & Invoices to Structure and above', () => {
    expect(hasModuleAccess('FOUNDATION', 'Bills & Invoices')).toBe(false)
    expect(hasModuleAccess('STRUCTURE', 'Bills & Invoices')).toBe(true)
    expect(hasModuleAccess('LANDMARK', 'Bills & Invoices')).toBe(true)
  })
  
  it('should restrict BOQ to Landmark only', () => {
    expect(hasModuleAccess('FOUNDATION', 'BOQ')).toBe(false)
    expect(hasModuleAccess('STRUCTURE', 'BOQ')).toBe(false)
    expect(hasModuleAccess('LANDMARK', 'BOQ')).toBe(true)
  })
  
  it('should return correct tier levels', () => {
    expect(getPackageTierLevel('FOUNDATION')).toBe(1)
    expect(getPackageTierLevel('STRUCTURE')).toBe(2)
    expect(getPackageTierLevel('LANDMARK')).toBe(3)
  })
})
```

## Best Practices

1. **Always check on both client and server**
   - Never rely solely on client-side checks
   - Always validate package access in API routes

2. **Use consistent terminology**
   - Use exact module names as defined in `PACKAGE_MODULES`
   - Case-sensitive matching

3. **Provide good UX when features are locked**
   - Show clear upgrade prompts
   - Explain what the user gains by upgrading
   - Make it easy to contact support

4. **Log access attempts**
   - Track when users try to access features they don't have
   - Can help identify high-demand features for lower tiers

5. **Cache company package data**
   - Avoid repeated API calls for the same company
   - Use React Context or hooks for caching

---

For more information, see [PACKAGE_SELECTION_GUIDE.md](./PACKAGE_SELECTION_GUIDE.md)
