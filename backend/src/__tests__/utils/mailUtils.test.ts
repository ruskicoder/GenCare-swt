import { MailUtils } from '../../utils/mailUtils';

describe('MailUtils', () => {
  describe('sendEmail', () => {
    it('should send email successfully with valid data', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      };

      const result = await MailUtils.sendEmail(emailData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle empty email data', async () => {
      const result = await MailUtils.sendEmail({});
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle null email data', async () => {
      const result = await MailUtils.sendEmail(null);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle undefined email data', async () => {
      const result = await MailUtils.sendEmail(undefined);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle complex email data with attachments', async () => {
      const emailData = {
        to: ['test1@example.com', 'test2@example.com'],
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Complex Email Test',
        body: 'Test body with <b>HTML</b>',
        attachments: [
          { filename: 'test.pdf', content: 'base64content' }
        ]
      };

      const result = await MailUtils.sendEmail(emailData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });

    it('should handle email data with special characters', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test with ñoñó and émojis 🚀',
        body: 'Body with special chars: áéíóú ñ ç €'
      };

      const result = await MailUtils.sendEmail(emailData);
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
    });
  });
});