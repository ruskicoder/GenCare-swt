import { EmailNotificationService } from '../../services/emailNotificationService';
import { MailUtils } from '../../utils/mailUtils';

// Mock the MailUtils
jest.mock('../../utils/mailUtils');
const mockMailUtils = MailUtils as jest.Mocked<typeof MailUtils>;

describe('EmailNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMailUtils.sendEmail.mockResolvedValue({ success: true });
  });

  describe('sendNotification', () => {
    it('should send notification successfully with valid parameters', async () => {
      const result = await EmailNotificationService.sendNotification(
        'test@example.com',
        'Test Subject',
        'Test Message'
      );

      expect(result.success).toBe(true);
      expect(result.messageId).toBeDefined();
      expect(mockMailUtils.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Message',
        priority: 'normal',
        template: undefined
      });
    });

    it('should format subject with type prefix', async () => {
      await EmailNotificationService.sendNotification(
        'test@example.com',
        'Test Subject',
        'Test Message',
        { type: 'error' }
      );

      expect(mockMailUtils.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '[ERROR] Test Subject',
        body: '<div style="color: #cc0000;">Test Message</div>',
        priority: 'normal',
        template: undefined
      });
    });

    it('should handle high priority notifications', async () => {
      await EmailNotificationService.sendNotification(
        'test@example.com',
        'Urgent Message',
        'This is urgent',
        { type: 'warning', priority: 'high' }
      );

      expect(mockMailUtils.sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: '[WARNING] Urgent Message',
        body: '<div style="color: #ff9900;">This is urgent</div>',
        priority: 'high',
        template: undefined
      });
    });

    it('should return error for missing recipient', async () => {
      const result = await EmailNotificationService.sendNotification(
        '',
        'Test Subject',
        'Test Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: recipient, subject, or message');
      expect(mockMailUtils.sendEmail).not.toHaveBeenCalled();
    });

    it('should return error for missing subject', async () => {
      const result = await EmailNotificationService.sendNotification(
        'test@example.com',
        '',
        'Test Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: recipient, subject, or message');
    });

    it('should return error for missing message', async () => {
      const result = await EmailNotificationService.sendNotification(
        'test@example.com',
        'Test Subject',
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: recipient, subject, or message');
    });

    it('should return error for invalid email format', async () => {
      const result = await EmailNotificationService.sendNotification(
        'invalid-email',
        'Test Subject',
        'Test Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should handle MailUtils errors', async () => {
      mockMailUtils.sendEmail.mockRejectedValue(new Error('Mail service error'));

      const result = await EmailNotificationService.sendNotification(
        'test@example.com',
        'Test Subject',
        'Test Message'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send notification: Mail service error');
    });

    it('should handle all notification types', async () => {
      const types = ['info', 'warning', 'error', 'success'] as const;
      
      for (const type of types) {
        await EmailNotificationService.sendNotification(
          'test@example.com',
          'Test',
          'Message',
          { type }
        );
      }

      expect(mockMailUtils.sendEmail).toHaveBeenCalledTimes(4);
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send bulk notifications successfully', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      
      const result = await EmailNotificationService.sendBulkNotifications(
        recipients,
        'Bulk Subject',
        'Bulk Message'
      );

      expect(result.success).toBe(true);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(mockMailUtils.sendEmail).toHaveBeenCalledTimes(3);
    });

    it('should handle empty recipients array', async () => {
      const result = await EmailNotificationService.sendBulkNotifications(
        [],
        'Subject',
        'Message'
      );

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle batch processing', async () => {
      const recipients = Array.from({ length: 25 }, (_, i) => `user${i + 1}@example.com`);
      
      const result = await EmailNotificationService.sendBulkNotifications(
        recipients,
        'Bulk Subject',
        'Bulk Message',
        { batchSize: 5 }
      );

      expect(result.success).toBe(true);
      expect(result.sent).toBe(25);
      expect(result.failed).toBe(0);
      expect(mockMailUtils.sendEmail).toHaveBeenCalledTimes(25);
    });

    it('should handle mixed success and failure', async () => {
      mockMailUtils.sendEmail
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ success: true });

      const recipients = ['valid@example.com', 'invalid', 'another@example.com'];
      
      const result = await EmailNotificationService.sendBulkNotifications(
        recipients,
        'Subject',
        'Message'
      );

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
      expect(result.results).toHaveLength(3);
    });

    it('should handle bulk send errors', async () => {
      // Simulate an error in the bulk process
      jest.spyOn(EmailNotificationService, 'sendNotification').mockRejectedValue(new Error('Bulk error'));

      const recipients = ['user1@example.com', 'user2@example.com'];
      
      const result = await EmailNotificationService.sendBulkNotifications(
        recipients,
        'Subject',
        'Message'
      );

      expect(result.success).toBe(false);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(2);
    });
  });

  describe('sendAppointmentReminder', () => {
    it('should send appointment reminder with all details', async () => {
      const appointmentDetails = {
        date: '2024-12-25',
        time: '10:00 AM',
        doctor: 'Dr. Smith',
        location: 'Main Clinic'
      };

      const result = await EmailNotificationService.sendAppointmentReminder(
        'patient@example.com',
        appointmentDetails
      );

      expect(result.success).toBe(true);
      expect(mockMailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'patient@example.com',
          subject: '[INFO] Appointment Reminder - GenCare',
          priority: 'high'
        })
      );
    });

    it('should send appointment reminder without location', async () => {
      const appointmentDetails = {
        date: '2024-12-25',
        time: '10:00 AM',
        doctor: 'Dr. Smith'
      };

      const result = await EmailNotificationService.sendAppointmentReminder(
        'patient@example.com',
        appointmentDetails
      );

      expect(result.success).toBe(true);
      expect(mockMailUtils.sendEmail).toHaveBeenCalled();
    });

    it('should handle invalid email in appointment reminder', async () => {
      const appointmentDetails = {
        date: '2024-12-25',
        time: '10:00 AM',
        doctor: 'Dr. Smith'
      };

      const result = await EmailNotificationService.sendAppointmentReminder(
        'invalid-email',
        appointmentDetails
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email successfully', async () => {
      const result = await EmailNotificationService.sendWelcomeEmail(
        'newuser@example.com',
        'John Doe'
      );

      expect(result.success).toBe(true);
      expect(mockMailUtils.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: '[SUCCESS] Welcome to GenCare!',
          priority: 'normal'
        })
      );
    });

    it('should handle invalid email in welcome email', async () => {
      const result = await EmailNotificationService.sendWelcomeEmail(
        'invalid-email',
        'John Doe'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email format');
    });

    it('should include user name in welcome message', async () => {
      await EmailNotificationService.sendWelcomeEmail(
        'user@example.com',
        'Jane Smith'
      );

      const call = mockMailUtils.sendEmail.mock.calls[0][0];
      expect(call.body).toContain('Jane Smith');
    });
  });

  describe('private methods', () => {
    it('should generate unique message IDs', async () => {
      const result1 = await EmailNotificationService.sendNotification(
        'test@example.com',
        'Subject',
        'Message'
      );
      
      const result2 = await EmailNotificationService.sendNotification(
        'test@example.com',
        'Subject',
        'Message'
      );

      expect(result1.messageId).toBeDefined();
      expect(result2.messageId).toBeDefined();
      expect(result1.messageId).not.toBe(result2.messageId);
    });
  });
});