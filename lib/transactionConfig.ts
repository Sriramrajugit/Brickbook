/**
 * Transaction Category Configuration
 * Centralized configuration for category behaviors and rules
 * Eliminates hardcoded category checks throughout the application
 */

export interface CategoryConfig {
  name: string;
  transactionType: 'Cash-In' | 'Cash-Out';
  requiresEmployee: boolean;
  createsAdvanceRecord: boolean;
  employeeFilter?: 'Employee' | 'Contractor' | 'All';
}

// Map of all category configurations
export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  'Capital': {
    name: 'Capital',
    transactionType: 'Cash-In',
    requiresEmployee: false,
    createsAdvanceRecord: false,
  },
  'Income': {
    name: 'Income',
    transactionType: 'Cash-In',
    requiresEmployee: false,
    createsAdvanceRecord: false,
  },
  'Salary Advance': {
    name: 'Salary Advance',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: true,
    employeeFilter: 'Employee',
  },
  'Salary': {
    name: 'Salary',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: true,
    employeeFilter: 'Employee',
  },
  'To Contractor': {
    name: 'To Contractor',
    transactionType: 'Cash-Out',
    requiresEmployee: true,
    createsAdvanceRecord: false,
    employeeFilter: 'Contractor',
  },
};

/**
 * Get transaction type for a category
 */
export function getTransactionType(categoryName: string): 'Cash-In' | 'Cash-Out' {
  const config = CATEGORY_CONFIG[categoryName];
  return config?.transactionType || 'Cash-Out';
}

/**
 * Check if category requires employee selection
 */
export function requiresEmployee(categoryName: string): boolean {
  const config = CATEGORY_CONFIG[categoryName];
  return config?.requiresEmployee || false;
}

/**
 * Check if category creates advance records
 */
export function createsAdvanceRecord(categoryName: string): boolean {
  const config = CATEGORY_CONFIG[categoryName];
  return config?.createsAdvanceRecord || false;
}

/**
 * Get employee filter for category
 */
export function getEmployeeFilter(categoryName: string): 'Employee' | 'Contractor' | 'All' {
  const config = CATEGORY_CONFIG[categoryName];
  return config?.employeeFilter || 'All';
}

/**
 * Get all categories that require employee selection
 */
export function getCategoriesRequiringEmployee(): string[] {
  return Object.values(CATEGORY_CONFIG)
    .filter((config) => config.requiresEmployee)
    .map((config) => config.name);
}

/**
 * Get all categories that create advance records
 */
export function getCategoriesCreatingAdvance(): string[] {
  return Object.values(CATEGORY_CONFIG)
    .filter((config) => config.createsAdvanceRecord)
    .map((config) => config.name);
}
