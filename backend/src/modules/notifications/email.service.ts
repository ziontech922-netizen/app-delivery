import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private isConfigured = false;
  private fromEmail = 'noreply@superapp.com.br';
  private fromName = 'SuperApp';

  constructor(private readonly configService: ConfigService) {
    this.initializeSendGrid();
  }

  private initializeSendGrid(): void {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL') || 'noreply@superapp.com.br';
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME') || 'SuperApp';

    if (!apiKey) {
      this.logger.warn('SendGrid not configured - email service disabled');
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      this.isConfigured = true;
      this.logger.log('SendGrid email service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize SendGrid:', error);
    }
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured) {
      this.logger.error('SendGrid not configured');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      await sgMail.send({
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        text: options.text || '',
        html: options.html,
      });

      this.logger.log(`Email sent to ${options.to}`);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send email to ${options.to}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetUrl: string, userName?: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinir Senha - SuperApp</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">SuperApp</h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="background-color: white; padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px; font-weight: 600;">
                      Redefinir sua senha
                    </h2>
                    
                    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                      Olá${userName ? ` ${userName}` : ''},
                    </p>
                    
                    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                      Recebemos uma solicitação para redefinir a senha da sua conta SuperApp. 
                      Clique no botão abaixo para criar uma nova senha:
                    </p>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${resetUrl}" 
                             style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                            Redefinir Senha
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="margin: 20px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                      Este link expira em <strong>1 hora</strong>. Se você não solicitou esta 
                      redefinição de senha, ignore este email.
                    </p>
                    
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e4e4e7;">
                    
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px; line-height: 1.6;">
                      Se o botão não funcionar, copie e cole o link abaixo no seu navegador:
                    </p>
                    <p style="margin: 10px 0 0; color: #6366f1; font-size: 12px; word-break: break-all;">
                      ${resetUrl}
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #fafafa; padding: 30px; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0 0 10px; color: #71717a; font-size: 14px;">
                      © ${new Date().getFullYear()} SuperApp. Todos os direitos reservados.
                    </p>
                    <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                      Você recebeu este email porque solicitou a redefinição de senha.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const text = `
SuperApp - Redefinir Senha

Olá${userName ? ` ${userName}` : ''},

Recebemos uma solicitação para redefinir a senha da sua conta SuperApp.

Clique no link abaixo para criar uma nova senha:
${resetUrl}

Este link expira em 1 hora.

Se você não solicitou esta redefinição de senha, ignore este email.

© ${new Date().getFullYear()} SuperApp. Todos os direitos reservados.
    `;

    return this.sendEmail({
      to: email,
      subject: 'Redefinir sua senha - SuperApp',
      html,
      text,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<{ success: boolean; error?: string }> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
                <tr>
                  <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🎉 SuperApp</h1>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: white; padding: 40px 30px; text-align: center;">
                    <h2 style="margin: 0 0 20px; color: #18181b; font-size: 24px;">
                      Bem-vindo(a), ${userName}!
                    </h2>
                    <p style="margin: 0 0 20px; color: #52525b; font-size: 16px; line-height: 1.6;">
                      Sua conta foi criada com sucesso! Agora você pode aproveitar todos os benefícios do SuperApp.
                    </p>
                    <ul style="text-align: left; color: #52525b; font-size: 16px; line-height: 2;">
                      <li>🍕 Peça comida dos melhores restaurantes</li>
                      <li>🛒 Compre no marketplace</li>
                      <li>🚗 Use nosso transporte</li>
                      <li>💰 Aproveite cupons exclusivos</li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #fafafa; padding: 30px; text-align: center; border-radius: 0 0 16px 16px;">
                    <p style="margin: 0; color: #71717a; font-size: 14px;">
                      © ${new Date().getFullYear()} SuperApp. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Bem-vindo(a) ao SuperApp, ${userName}! 🎉`,
      html,
      text: `Bem-vindo(a) ao SuperApp, ${userName}! Sua conta foi criada com sucesso.`,
    });
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return this.isConfigured;
  }
}
