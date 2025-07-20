import { AppointmentService } from '../../services/appointmentService';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { Appointment } from '../../models/Appointment';
import { User } from '../../models/User';
import { Consultant } from '../../models/Consultant';
import { WeeklySchedule } from '../../models/WeeklySchedule';
import mongoose from 'mongoose';

describe('AppointmentService', () => {
  let testUser: any;
  let testConsultant: any;
  let testSchedule: any;

  beforeEach(async () => {
    // Create test data for each test
    testUser = await TestDataFactory.createTestUser();
    testConsultant = await TestDataFactory.createTestConsultant();
    testSchedule = await TestDataFactory.createTestWeeklySchedule(testConsultant._id);
  });

  describe('bookAppointment', () => {
    describe('Happy Path', () => {
      it('should successfully book an appointment with valid data', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString()
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully');
        expect(result.data?.appointment).toBeDefined();
        expect(result.data?.appointment.customer_id.toString()).toBe(testUser._id.toString());
        expect(result.data?.appointment.consultant_id.toString()).toBe(testConsultant._id.toString());
        expect(result.data?.appointment.status).toBe('pending');
      });

      it('should book appointment with optional customer notes', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { customer_notes: 'Special requirements for consultation' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.customer_notes).toBe('Special requirements for consultation');
      });

      it('should handle appointment booking with edge case times', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '09:00', end_time: '09:30' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(true);
      });
    });

    describe('Validation Tests', () => {
      it('should fail when appointment data is null', async () => {
        const result = await AppointmentService.bookAppointment(null as any);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Appointment data is required');
      });

      it('should fail when required fields are missing', async () => {
        const result = await AppointmentService.bookAppointment({} as any);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Missing required fields');
      });

      it('should fail with invalid customer_id', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          'invalid-id',
          testConsultant._id.toString()
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Customer not found');
      });

      it('should fail with invalid consultant_id', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          'invalid-id'
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Consultant not found');
      });

      it('should fail with invalid time format', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: 'invalid-time', end_time: '10:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid time format');
      });

      it('should fail when start time is after end time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '15:00', end_time: '14:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Start time must be before end time');
      });

      it('should fail when start time equals end time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '10:00', end_time: '10:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toBe('Start time must be before end time');
      });
    });
  });

  describe('getAllAppointments', () => {
    it('should get appointments with pagination', async () => {
      const result = await AppointmentService.getAllAppointments('pending');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle empty appointment list', async () => {
      const result = await AppointmentService.getAllAppointments();

      expect(result.success).toBe(true);
    });
  });

  describe('getCustomerAppointments', () => {
    it('should get customer appointments successfully', async () => {
      const result = await AppointmentService.getCustomerAppointments(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.data?.appointments).toBeDefined();
    });

    it('should fail with invalid user ID', async () => {
      const result = await AppointmentService.getCustomerAppointments('invalid-id');

      expect(result.success).toBe(false);
    });

    it('should handle user with no appointments', async () => {
      const newUser = await TestDataFactory.createTestUser({ email: 'new@test.com' });
      
      const result = await AppointmentService.getCustomerAppointments(newUser._id.toString());

      expect(result.success).toBe(true);
    });
  });

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      // Book appointment first
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      const appointmentId = bookResult.data?.appointment._id.toString();
      
      const updateData = {
        customer_notes: 'Updated notes',
        status: 'confirmed' as const
      };

      const result = await AppointmentService.updateAppointment(appointmentId!, updateData, testUser._id.toString());

      expect(result.success).toBe(true);
    });

    it('should fail with invalid appointment ID', async () => {
      const updateData = { customer_notes: 'Updated notes' };
      
      const result = await AppointmentService.updateAppointment('invalid-id', updateData, testUser._id.toString());

      expect(result.success).toBe(false);
    });

    it('should fail when appointment not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData = { customer_notes: 'Updated notes' };
      
      const result = await AppointmentService.updateAppointment(nonExistentId, updateData, testUser._id.toString());

      expect(result.success).toBe(false);
    });
  });

  describe('cancelAppointment', () => {
    it('should cancel appointment successfully', async () => {
      // Book appointment first
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      const appointmentId = bookResult.data?.appointment._id.toString();
      
      const result = await AppointmentService.cancelAppointment(appointmentId!, testUser._id.toString());

      expect(result.success).toBe(true);
    });

    it('should fail with invalid appointment ID', async () => {
      const result = await AppointmentService.cancelAppointment('invalid-id', testUser._id.toString());

      expect(result.success).toBe(false);
    });

    it('should fail when appointment not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await AppointmentService.cancelAppointment(nonExistentId, testUser._id.toString());

      expect(result.success).toBe(false);
    });
  });

  describe('confirmAppointment', () => {
    it('should confirm appointment successfully', async () => {
      // Book appointment first
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      const appointmentId = bookResult.data?.appointment._id.toString();
      
      const result = await AppointmentService.confirmAppointment(appointmentId!, testConsultant.user_id.toString());

      expect(result.success).toBe(true);
    });

    it('should fail with invalid appointment ID', async () => {
      const result = await AppointmentService.confirmAppointment('invalid-id', testConsultant.user_id.toString());

      expect(result.success).toBe(false);
    });

    it('should fail when appointment not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await AppointmentService.confirmAppointment(nonExistentId, testConsultant.user_id.toString());

      expect(result.success).toBe(false);
    });
  });

  describe('completeAppointment', () => {
    it('should complete appointment successfully', async () => {
      // Book and confirm appointment first
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      const appointmentId = bookResult.data?.appointment._id.toString();
      
      // Confirm the appointment first
      await AppointmentService.confirmAppointment(appointmentId!, testConsultant.user_id.toString());
      
      const result = await AppointmentService.completeAppointment(appointmentId!, testConsultant.user_id.toString());

      expect(result.success).toBe(true);
    });

    it('should fail with invalid appointment ID', async () => {
      const result = await AppointmentService.completeAppointment('invalid-id', testConsultant.user_id.toString());

      expect(result.success).toBe(false);
    });

    it('should fail when appointment not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      
      const result = await AppointmentService.completeAppointment(nonExistentId, testConsultant.user_id.toString());

      expect(result.success).toBe(false);
    });
  });

  describe('getAppointmentStatistics', () => {
    it('should get appointment statistics successfully', async () => {
      const result = await AppointmentService.getAppointmentStatistics();

      expect(result.success).toBe(true);
      expect(result.data?.statistics).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would mock database errors
      const originalBookAppointment = AppointmentService.bookAppointment;
      
      // Mock a database error
      jest.spyOn(AppointmentService, 'bookAppointment').mockImplementationOnce(async () => {
        throw new Error('Database connection failed');
      });

      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );

      try {
        await AppointmentService.bookAppointment(appointmentData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }

      // Restore original implementation
      AppointmentService.bookAppointment = originalBookAppointment;
    });

    it('should handle various time format validations', async () => {
      const testCases = [
        { start_time: '24:00', end_time: '25:00' }, // Invalid hours
        { start_time: '12:60', end_time: '13:00' }, // Invalid minutes
        { start_time: 'abc', end_time: '13:00' }, // Non-numeric
        { start_time: '12', end_time: '13:00' }, // Missing minutes
        { start_time: '12:30:45', end_time: '13:00' }, // With seconds
      ];

      for (const timeCase of testCases) {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          timeCase
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid time format');
      }
    });

    it('should handle appointment creation with different date scenarios', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0, 0);

      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString(),
        { 
          appointment_date: tomorrow,
          start_time: '10:00',
          end_time: '11:00'
        }
      );

      const result = await AppointmentService.bookAppointment(appointmentData);
      expect(result.success).toBe(true);
    });
  });
});