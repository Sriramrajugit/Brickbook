/**
 * Format number as Indian currency (₹)
 * @param amount - The amount to format
 * @returns Formatted string with Indian Rupee symbol and comma separators
 */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with Indian number system (lakhs, crores)
 * @param amount - The amount to format
 * @returns Formatted string with comma separators
 */
export function formatIndianNumber(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date as DD/MM/YYYY
 * @param date - The date to format (string or Date object)
 * @returns Formatted string in DD/MM/YYYY format
 */
export function formatDateDDMMYYYY(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD for input[type="date"]
 * @param dateString - Date string in DD/MM/YYYY format
 * @returns Formatted string in YYYY-MM-DD format
 */
export function convertDDMMYYYYtoYYYYMMDD(dateString: string): string {
  const [day, month, year] = dateString.split('/');
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted string in DD/MM/YYYY format
 */
export function convertYYYYMMDDtoDDMMYYYY(dateString: string): string {
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and error messages
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
