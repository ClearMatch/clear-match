/**
 * Client-side phone number utilities
 * These functions can be safely used in both client and server components
 */

/**
 * Validate phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if it's a valid US/international number
  // US: 10 digits, International: 11-15 digits
  if (cleanPhone.length === 10) {
    return true; // US number without country code
  }
  if (cleanPhone.length >= 11 && cleanPhone.length <= 15) {
    return true; // International number
  }
  
  return false;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // US format: (123) 456-7890
    return `(${cleanPhone.slice(0, 3)}) ${cleanPhone.slice(3, 6)}-${cleanPhone.slice(6)}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    // US with country code: +1 (123) 456-7890
    return `+1 (${cleanPhone.slice(1, 4)}) ${cleanPhone.slice(4, 7)}-${cleanPhone.slice(7)}`;
  }
  
  // International format: +XX XXXXXXXXXX
  return `+${cleanPhone}`;
}

/**
 * Format phone number for Twilio (E.164 format)
 */
export function formatPhoneForTwilio(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  
  if (cleanPhone.length === 10) {
    // Add US country code
    return `+1${cleanPhone}`;
  }
  
  if (cleanPhone.length >= 11 && !cleanPhone.startsWith('1')) {
    // Add + for international numbers
    return `+${cleanPhone}`;
  }
  
  if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
    // US number with country code
    return `+${cleanPhone}`;
  }
  
  // Default: add + if not present
  return phone.startsWith('+') ? phone : `+${cleanPhone}`;
}