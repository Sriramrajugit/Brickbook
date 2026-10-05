/**
 * Account Status Configuration
 * Centralized configuration for account project statuses
 */

export interface StatusConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
}

// Map of all account status configurations
export const ACCOUNT_STATUS_CONFIG: Record<string, StatusConfig> = {
  'Yet to start': {
    value: 'Yet to start',
    label: '● Yet to start',
    color: 'text-gray-800',
    bgColor: 'bg-gray-100',
  },
  'In-progress': {
    value: 'In-progress',
    label: '● In-progress',
    color: 'text-blue-800',
    bgColor: 'bg-blue-100',
  },
  'Completed': {
    value: 'Completed',
    label: '● Completed',
    color: 'text-green-800',
    bgColor: 'bg-green-100',
  },
};

/**
 * Get all available statuses
 */
export function getAvailableStatuses(): string[] {
  return Object.keys(ACCOUNT_STATUS_CONFIG);
}

/**
 * Get status display config
 */
export function getStatusDisplay(status: string | null | undefined): StatusConfig {
  return ACCOUNT_STATUS_CONFIG[status as string] || ACCOUNT_STATUS_CONFIG['Yet to start'];
}

/**
 * Get CSS class for status badge
 */
export function getStatusBadgeClass(status: string | null | undefined): string {
  const config = getStatusDisplay(status);
  return `inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`;
}
