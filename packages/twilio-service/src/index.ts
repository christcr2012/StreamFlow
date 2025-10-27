/**
 * @cortiware/twilio-service
 *
 * Runtime Twilio integration for Cortiware applications.
 * Provides SMS, voice, and messaging operations.
 *
 * Phase 1: Stub implementations with logging
 * Phase 2: Real Twilio API integration
 * Dependencies: [service] Twilio
 */

import type { Twilio } from "twilio";

export interface SendSMSInput {
  to: string;
  from?: string;
  body: string;
  mediaUrl?: string[];
}

export interface MakeCallInput {
  to: string;
  from?: string;
  url: string; // TwiML URL
}

/**
 * Twilio Service for Cortiware
 * Handles SMS, voice calls, and messaging for Type 2 communications
 */
export class TwilioService {
  private client: Twilio | null = null;
  private fromNumber?: string;

  constructor(accountSid?: string, authToken?: string, fromNumber?: string) {
    this.fromNumber = fromNumber;

    // Phase 1: Don't initialize real Twilio client yet
    if (accountSid && authToken && process.env.NODE_ENV !== "test") {
      console.log("[STUB][TwilioService] Would initialize Twilio client");
    }
  }

  /**
   * Send an SMS message
   * Phase 2: Returns stub data until integration is enabled (blocked by Twilio)
   * Phase 2: Sends real SMS via Twilio
   */
  async sendSMS(
    data: SendSMSInput,
  ): Promise<{ sid: string; status: string; [key: string]: any }> {
    console.log("[STUB][TwilioService] sendSMS:", data);

    // TODO Phase 2: Real implementation
    // const message = await this.client!.messages.create({
    //   body: data.body,
    //   from: data.from || this.fromNumber,
    //   to: data.to,
    //   mediaUrl: data.mediaUrl
    // });
    // return message;

    return {
      sid: `SM_stub_${Date.now()}`,
      status: "sent",
      to: data.to,
      from: data.from || this.fromNumber || "+15555555555",
      body: data.body,
      dateCreated: new Date(),
    };
  }

  /**
   * Make an outbound call
   * Phase 2: Returns stub data until integration is enabled (blocked by Twilio)
   * Phase 2: Initiates real call via Twilio
   */
  async makeCall(
    data: MakeCallInput,
  ): Promise<{ sid: string; status: string; [key: string]: any }> {
    console.log("[STUB][TwilioService] makeCall:", data);

    // TODO Phase 2: Real implementation
    // const call = await this.client!.calls.create({
    //   url: data.url,
    //   to: data.to,
    //   from: data.from || this.fromNumber
    // });
    // return call;

    return {
      sid: `CA_stub_${Date.now()}`,
      status: "initiated",
      to: data.to,
      from: data.from || this.fromNumber || "+15555555555",
      dateCreated: new Date(),
    };
  }

  /**
   * Get message status
   * Phase 2: Returns stub data until integration is enabled (blocked by Twilio)
   * Phase 2: Fetches real message from Twilio
   */
  async getMessageStatus(
    messageSid: string,
  ): Promise<{ sid: string; status: string; [key: string]: any }> {
    console.log("[STUB][TwilioService] getMessageStatus:", messageSid);

    // TODO Phase 2: Real implementation
    // const message = await this.client!.messages(messageSid).fetch();
    // return message;

    return {
      sid: messageSid,
      status: "delivered",
      dateCreated: new Date(),
      dateSent: new Date(),
    };
  }
}

export default TwilioService;
