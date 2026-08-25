/**
 * Safe FormData Parsing Utility
 * Provides type-safe extraction of values from FormData
 */

export interface FormDataSchema {
  [key: string]: 'string' | 'number' | 'boolean' | 'date';
}

/**
 * Safely extract and validate FormData values
 * @param formData FormData object
 * @param schema Schema defining expected fields and types
 * @returns Typed object with validated values
 */
export function parseFormData<T extends FormDataSchema>(
  formData: FormData,
  schema: T
): Partial<Record<keyof T, any>> {
  const result: any = {};

  for (const [key, type] of Object.entries(schema)) {
    const value = formData.get(key);

    if (value === null) {
      result[key] = null;
      continue;
    }

    const stringValue = value.toString();

    switch (type) {
      case 'string':
        result[key] = stringValue;
        break;
      case 'number':
        const numValue = parseFloat(stringValue);
        result[key] = isNaN(numValue) ? null : numValue;
        break;
      case 'boolean':
        result[key] = stringValue === 'true' || stringValue === '1' || stringValue === 'on';
        break;
      case 'date':
        result[key] = new Date(stringValue);
        break;
      default:
        result[key] = stringValue;
    }
  }

  return result;
}

/**
 * Validate that required fields are present and valid
 */
export function validateFormData(
  data: Partial<Record<string, any>>,
  requiredFields: string[]
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const field of requiredFields) {
    const value = data[field];
    if (value === null || value === undefined || value === '') {
      errors[field] = `${field} is required`;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Safe number parser with default fallback
 */
export function safeParseNumber(value: any, defaultValue: number = 0): number {
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Safe integer parser
 */
export function safeParseInt(value: any, defaultValue: number = 0): number {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
}
