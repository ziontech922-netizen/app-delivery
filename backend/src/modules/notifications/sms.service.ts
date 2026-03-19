import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const twilio = require('twilio');

export interface SmsOptions {
  to: string;
  body: string;
}

export interface WhatsAppOptions {
  to: string;
  body: string;
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: ReturnType<typeof twilio> | null = null;
  private twilioPhoneNumber = '';
  private twilioWhatsAppNumber = '';
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeTwilio();
  }

  private initializeTwilio(): void {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    this.twilioPhoneNumber = this.configService.get<string>('TWILIO_PHONE_NUMBER') || '';
    this.twilioWhatsAppNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || '';

    if (!accountSid || !authToken) {
      this.logger.warn('Twilio not configured - SMS notifications disabled');
      return;
    }

    try {
      this.client = twilio.default(accountSid, authToken);
      this.isConfigured = true;
      this.logger.log('Twilio SMS service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Twilio:', error);
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(options: SmsOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.client) {
      this.logger.error('Twilio not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    // Format phone number to E.164 format (Brazil)
    const formattedPhone = this.formatPhoneNumber(options.to);

    try {
      const message = await this.client.messages.create({
        body: options.body,
        from: this.twilioPhoneNumber,
        to: formattedPhone,
      });

      this.logger.log(`SMS sent to ${formattedPhone}: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send SMS to ${formattedPhone}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send WhatsApp message via Twilio
   */
  async sendWhatsApp(options: WhatsAppOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.isConfigured || !this.client) {
      this.logger.error('Twilio not configured');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    const formattedPhone = this.formatPhoneNumber(options.to);

    try {
      const message = await this.client.messages.create({
        body: options.body,
        from: `whatsapp:${this.twilioWhatsAppNumber}`,
        to: `whatsapp:${formattedPhone}`,
      });

      this.logger.log(`WhatsApp sent to ${formattedPhone}: ${message.sid}`);
      return { success: true, messageId: message.sid };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send WhatsApp to ${formattedPhone}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send OTP code via SMS or WhatsApp
   */
  async sendOtp(phone: string, code: string, type: 'sms' | 'whatsapp' = 'sms'): Promise<{ success: boolean; error?: string }> {
    const message = `SuperApp: Seu código de verificação é ${code}. Válido por 5 minutos. Não compartilhe com ninguém.`;

    if (type === 'whatsapp') {
      return this.sendWhatsApp({ to: phone, body: message });
    }

    return this.sendSms({ to: phone, body: message });
  }

  /**
   * Format phone number to E.164 format for Brazil
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // If already has country code
    if (digits.startsWith('55') && digits.length >= 12) {
      return `+${digits}`;
    }

    // Add Brazil country code
    if (digits.length === 10 || digits.length === 11) {
      return `+55${digits}`;
    }

    // Return as-is with + prefix
    return `+${digits}`;
  }

  /**
   * Check if SMS service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }
}
