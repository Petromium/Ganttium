
import twilio from 'twilio';
import { logger } from './cloudLogging';

// Initialize Twilio client lazily
let twilioClient: twilio.Twilio | null = null;

/**
 * Get Twilio client instance
 */
function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    logger.warn("[Twilio] Credentials not configured");
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch (error) {
    logger.error("[Twilio] Failed to initialize client", error);
    return null;
  }
}

/**
 * Send SMS notification
 */
export async function sendSms(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!client || !fromNumber) {
    logger.warn("[Twilio] SMS skipped - client or phone number not configured");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to
    });

    logger.info(`[Twilio] SMS sent to ${to}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    logger.error(`[Twilio] Failed to send SMS to ${to}`, error);
    return { success: false, error: error.message };
  }
}

