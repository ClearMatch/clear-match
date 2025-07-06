/**
 * Server-side SMS service using Twilio
 * This file should only be imported in API routes or server components
 */

// Re-export phone utilities for convenience
export { validatePhoneNumber, formatPhoneNumber, formatPhoneForTwilio } from './phone-utils';

// Environment variables for Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Lazy load Twilio only on server side
async function getTwilioClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Twilio client can only be used on server side');
  }
  
  const Twilio = (await import('twilio')).default;
  
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  
  return new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export interface SMSMessage {
  to: string;
  from: string;
  body: string;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

/**
 * Send SMS message using Twilio
 */
export async function sendSMS(message: SMSMessage): Promise<SMSResponse> {
  try {
    const client = await getTwilioClient();
    
    if (!TWILIO_PHONE_NUMBER) {
      throw new Error('Twilio phone number not configured');
    }

    const result = await client.messages.create({
      body: message.body,
      from: TWILIO_PHONE_NUMBER,
      to: message.to
    });

    return {
      success: true,
      messageId: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Check if Twilio is configured
 */
export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

/**
 * Get Twilio configuration status
 */
export function getTwilioConfig() {
  return {
    configured: isTwilioConfigured(),
    phoneNumber: TWILIO_PHONE_NUMBER || null,
    accountSid: TWILIO_ACCOUNT_SID ? `${TWILIO_ACCOUNT_SID.slice(0, 8)}...` : null
  };
}