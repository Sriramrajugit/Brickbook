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
