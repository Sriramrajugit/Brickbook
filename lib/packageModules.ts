/**
 * Package Module Access Control
 * Defines which modules are available for each customer package tier
 */

export type CustomerPackage = 'FOUNDATION' | 'STRUCTURE' | 'LANDMARK'

export interface PackageModules {
  foundation: string[]
  structure: string[]
  landmark: string[]
}

/**
 * Module definitions for each package
 */
export const PACKAGE_MODULES: Record<CustomerPackage, string[]> = {
  FOUNDATION: [
    // Core Features
    'Dashboard',
    'Transactions',
    'Attendance',
    'Payroll',
    'Reports',
    // Masters
    'Accounts',
    'Categories',
    'Employees',
    'Partners',
    'Users',
  ],
  STRUCTURE: [
    // Everything in Foundation
    'Dashboard',
    'Transactions',
    'Attendance',
    'Payroll',
    'Reports',
    'Accounts',
    'Categories',
    'Employees',
    'Partners',
    'Users',
    // Additional modules
    'Bills & Invoices',
    'Import Data',
  ],
  LANDMARK: [
    // Everything in Structure
    'Dashboard',
    'Transactions',
    'Attendance',
    'Payroll',
    'Reports',
    'Accounts',
    'Categories',
    'Employees',
    'Partners',
    'Users',
    'Bills & Invoices',
    'Import Data',
    // Additional modules
    'BOQ',
    'Future Modules',
  ],
}

/**
 * Detailed package descriptions
 */
export const PACKAGE_DESCRIPTIONS: Record<CustomerPackage, string> = {
  FOUNDATION: 'Dashboard, Transactions, Attendance, Payroll, Reports, Masters (Accounts, Categories, Employees & Partners, Users)',
  STRUCTURE: 'Foundation + Bills & Invoices, Import Data',
  LANDMARK: 'Structure + BOQ and upcoming modules',
}

/**
 * Check if a module is available in a package
 */
export function hasModuleAccess(packageName: CustomerPackage, moduleName: string): boolean {
  const modules = PACKAGE_MODULES[packageName]
  return modules.includes(moduleName)
}

/**
 * Get all modules for a package
 */
export function getPackageModules(packageName: CustomerPackage): string[] {
  return PACKAGE_MODULES[packageName]
}

/**
 * Get package tier level (for display/comparison)
 */
export function getPackageTierLevel(packageName: CustomerPackage): number {
  const tiers: Record<CustomerPackage, number> = {
    FOUNDATION: 1,
    STRUCTURE: 2,
    LANDMARK: 3,
  }
  return tiers[packageName]
}

/**
 * Get package badge color for UI display
 */
export function getPackageBadgeColor(packageName: CustomerPackage): string {
  const colors: Record<CustomerPackage, string> = {
    FOUNDATION: 'bg-blue-100 text-blue-800',
    STRUCTURE: 'bg-green-100 text-green-800',
    LANDMARK: 'bg-purple-100 text-purple-800',
  }
  return colors[packageName]
}

/**
 * Upgrade path suggestions
 */
export function getSuggestedUpgrades(currentPackage: CustomerPackage): CustomerPackage[] {
  const upgrades: Record<CustomerPackage, CustomerPackage[]> = {
    FOUNDATION: ['STRUCTURE', 'LANDMARK'],
    STRUCTURE: ['LANDMARK'],
    LANDMARK: [],
  }
  return upgrades[currentPackage]
}
