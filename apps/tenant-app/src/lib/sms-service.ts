/**
 * SMS Service
 *
 * Provides SMS sending functionality using tenant-specific Twilio credentials
 */

import { prisma } from './prisma';
import { decrypt } from './encryption';

export interface SMSOptions {
  to: string;
  body: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send SMS using tenant's Twilio credentials
 */
export async function sendSMS(
  orgId: string,
  options: SMSOptions
): Promise<SMSResult> {
  try {
    // Get org's SMS configuration
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: {
        smsProvider: true,
        smsApiKey: true,
        smsFromNumber: true,
        smsConfigured: true,
      },
    });

    if (!org || !org.smsConfigured || !org.smsApiKey) {
      return {
        success: false,
        error: 'SMS service not configured for this organization.',
      };
    }

    if (org.smsProvider !== 'twilio') {
      return {
        success: false,
        error: `Unsupported SMS provider: ${org.smsProvider}`,
      };
    }

    // Decrypt API key
    const apiKey = decrypt(org.smsApiKey);

    // Parse Twilio credentials (format: "ACCOUNT_SID:AUTH_TOKEN")
    const [accountSid, authToken] = apiKey.split(':');
    if (!accountSid || !authToken) {
      return {
        success: false,
        error: 'Invalid Twilio credentials format. Expected: ACCOUNT_SID:AUTH_TOKEN',
      };
    }

    // Send SMS via Twilio API
    const result = await sendViaTwilio(
      accountSid,
      authToken,
      org.smsFromNumber!,
      options
    );

    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send SMS via Twilio API
 */
async function sendViaTwilio(
  accountSid: string,
  authToken: string,
  from: string,
  options: SMSOptions
): Promise<SMSResult> {
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: options.to,
        From: from,
        Body: options.body,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || `Twilio API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.sid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send SMS via Twilio',
    };
  }
}

/**
 * SMS Templates
 */

export interface JobStatusSMSData {
  customerName: string;
  jobTitle: string;
  newStatus: string;
  scheduledDate?: Date | any;
}

export function getJobStatusSMSTemplate(data: JobStatusSMSData): string {
  const statusMessages: Record<string, string> = {
    scheduled: 'has been scheduled',
    in_progress: 'is now in progress',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
  };

  const statusMessage = statusMessages[data.newStatus] || `status updated to ${data.newStatus}`;
  
  let message = `Hi ${data.customerName}, your job "${data.jobTitle}" ${statusMessage}.`;
  
  if (data.scheduledDate && data.newStatus === 'scheduled') {
    const dateStr = data.scheduledDate instanceof Date 
      ? data.scheduledDate.toLocaleDateString() 
      : 'soon';
    message += ` Scheduled for ${dateStr}.`;
  }

  return message;
}

export interface AppointmentReminderSMSData {
  customerName: string;
  jobTitle: string;
  scheduledDate: Date;
  scheduledTime?: string;
}

export function getAppointmentReminderSMSTemplate(data: AppointmentReminderSMSData): string {
  const dateStr = data.scheduledDate.toLocaleDateString();
  const timeStr = data.scheduledTime || 'as scheduled';
  
  return `Reminder: Hi ${data.customerName}, you have an appointment for "${data.jobTitle}" on ${dateStr} at ${timeStr}. We look forward to seeing you!`;
}

export interface JobCompletionSMSData {
  customerName: string;
  jobTitle: string;
  invoiceUrl?: string;
}

export function getJobCompletionSMSTemplate(data: JobCompletionSMSData): string {
  let message = `Hi ${data.customerName}, your job "${data.jobTitle}" has been completed. Thank you for your business!`;
  
  if (data.invoiceUrl) {
    message += ` View invoice: ${data.invoiceUrl}`;
  }

  return message;
}

/**
 * Test SMS configuration
 */
export async function testSMSConfiguration(
  provider: string,
  apiKey: string,
  fromNumber: string
): Promise<{ success: boolean; error?: string }> {
  if (provider !== 'twilio') {
    return {
      success: false,
      error: 'Only Twilio is supported at this time',
    };
  }

  // Parse credentials
  const [accountSid, authToken] = apiKey.split(':');
  if (!accountSid || !authToken) {
    return {
      success: false,
      error: 'Invalid credentials format. Expected: ACCOUNT_SID:AUTH_TOKEN',
    };
  }

  // Validate phone number format
  if (!fromNumber.match(/^\+?[1-9]\d{1,14}$/)) {
    return {
      success: false,
      error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)',
    };
  }

  // Test by fetching account info
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`;
    const response = await fetch(url, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'Invalid Twilio credentials',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify Twilio credentials',
    };
  }
}

