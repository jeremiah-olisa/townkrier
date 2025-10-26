/**
 * Generate a unique reference for notifications
 * @param prefix - Prefix for the reference (e.g., 'EMAIL', 'SMS')
 * @returns Unique reference string
 */
export function generateReference(prefix: string = 'NOTIF'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Sanitize metadata to remove undefined/null values
 * @param metadata - Raw metadata object
 * @returns Sanitized metadata
 */
export function sanitizeMetadata(
  metadata?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  return Object.entries(metadata).reduce(
    (acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, unknown>,
  );
}

/**
 * Validate email address format
 * @param email - Email address to validate
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 * @param phone - Phone number to validate
 * @returns True if valid
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation - numbers, +, -, spaces, parentheses
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Normalize phone number (remove non-digit characters except +)
 * @param phone - Phone number to normalize
 * @returns Normalized phone number
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Format name from first and last name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Formatted full name
 */
export function formatName(firstName?: string, lastName?: string): string | undefined {
  if (!firstName && !lastName) return undefined;
  return [firstName, lastName].filter(Boolean).join(' ');
}

/**
 * Truncate text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param ellipsis - Ellipsis to append (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}
