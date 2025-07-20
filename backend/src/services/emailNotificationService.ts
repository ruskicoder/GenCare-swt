import { MailUtils } from '../utils/mailUtils';

export class EmailNotificationService {
  public static async sendNotification(
    recipient: string,
    subject: string,
    message: string,
    options?: {
      type?: 'info' | 'warning' | 'error' | 'success';
      priority?: 'low' | 'normal' | 'high';
      template?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!recipient || !subject || !message) {
        return {
          success: false,
          error: 'Missing required parameters: recipient, subject, or message'
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipient)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      const emailData = {
        to: recipient,
        subject: this.formatSubject(subject, options?.type),
        body: this.formatMessage(message, options?.type),
        priority: options?.priority || 'normal',
        template: options?.template
      };

      const result = await MailUtils.sendEmail(emailData);
      
      return {
        success: result.success,
        messageId: this.generateMessageId()
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async sendBulkNotifications(
    recipients: string[],
    subject: string,
    message: string,
    options?: {
      type?: 'info' | 'warning' | 'error' | 'success';
      priority?: 'low' | 'normal' | 'high';
      batchSize?: number;
    }
  ): Promise<{ 
    success: boolean; 
    sent: number; 
    failed: number; 
    results: Array<{ recipient: string; success: boolean; error?: string }> 
  }> {
    try {
      if (!recipients || recipients.length === 0) {
        return {
          success: false,
          sent: 0,
          failed: 0,
          results: []
        };
      }

      const batchSize = options?.batchSize || 10;
      const results: Array<{ recipient: string; success: boolean; error?: string }> = [];
      let sent = 0;
      let failed = 0;

      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        const batchPromises = batch.map(async (recipient) => {
          const result = await this.sendNotification(recipient, subject, message, options);
          const recipientResult = {
            recipient,
            success: result.success,
            error: result.error
          };
          
          if (result.success) {
            sent++;
          } else {
            failed++;
          }
          
          return recipientResult;
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return {
        success: sent > 0,
        sent,
        failed,
        results
      };
    } catch (error) {
      return {
        success: false,
        sent: 0,
        failed: recipients.length,
        results: recipients.map(recipient => ({
          recipient,
          success: false,
          error: `Bulk send failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }))
      };
    }
  }

  private static formatSubject(subject: string, type?: string): string {
    const prefixes = {
      info: '[INFO]',
      warning: '[WARNING]',
      error: '[ERROR]',
      success: '[SUCCESS]'
    };

    const prefix = type && prefixes[type as keyof typeof prefixes] ? prefixes[type as keyof typeof prefixes] : '';
    return prefix ? `${prefix} ${subject}` : subject;
  }

  private static formatMessage(message: string, type?: string): string {
    const templates = {
      info: `<div style="color: #0066cc;">${message}</div>`,
      warning: `<div style="color: #ff9900;">${message}</div>`,
      error: `<div style="color: #cc0000;">${message}</div>`,
      success: `<div style="color: #00cc00;">${message}</div>`
    };

    return type && templates[type as keyof typeof templates] 
      ? templates[type as keyof typeof templates] 
      : message;
  }

  private static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public static async sendAppointmentReminder(
    userEmail: string,
    appointmentDetails: {
      date: string;
      time: string;
      doctor: string;
      location?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Appointment Reminder - GenCare';
    const message = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Appointment Reminder</h2>
        <p>This is a reminder about your upcoming appointment:</p>
        <ul>
          <li><strong>Date:</strong> ${appointmentDetails.date}</li>
          <li><strong>Time:</strong> ${appointmentDetails.time}</li>
          <li><strong>Doctor:</strong> ${appointmentDetails.doctor}</li>
          ${appointmentDetails.location ? `<li><strong>Location:</strong> ${appointmentDetails.location}</li>` : ''}
        </ul>
        <p>Please arrive 15 minutes early for check-in.</p>
        <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
      </div>
    `;

    return this.sendNotification(userEmail, subject, message, { type: 'info', priority: 'high' });
  }

  public static async sendWelcomeEmail(
    userEmail: string,
    userName: string
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Welcome to GenCare!';
    const message = `
      <div style="font-family: Arial, sans-serif;">
        <h1>Welcome to GenCare, ${userName}!</h1>
        <p>Thank you for joining our platform. We're excited to help you with your healthcare journey.</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Schedule your first appointment</li>
          <li>Explore our health resources</li>
        </ul>
        <p>If you have any questions, don't hesitate to reach out to our support team.</p>
        <p>Best regards,<br>The GenCare Team</p>
      </div>
    `;

    return this.sendNotification(userEmail, subject, message, { type: 'success', priority: 'normal' });
  }
}