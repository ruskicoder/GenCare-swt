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

      it('should book appointment for different time slots', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { 
            start_time: '14:00',
            end_time: '15:00'
          }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.start_time).toBe('14:00');
        expect(result.data?.appointment.end_time).toBe('15:00');
      });
    });

    describe('Business Rule Violations', () => {
      it('should reject booking when customer has pending appointment', async () => {
        // Book first appointment
        const firstAppointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString()
        );
        await AppointmentService.bookAppointment(firstAppointmentData);

        // Try to book second appointment
        const secondAppointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '16:00', end_time: '17:00' }
        );

        const result = await AppointmentService.bookAppointment(secondAppointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('already have a pending appointment');
      });

      it('should reject booking less than 2 hours in advance', async () => {
        const now = new Date();
        const oneAndHalfHoursFromNow = new Date(now.getTime() + 1.5 * 60 * 60 * 1000); // 1.5 hours 
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { 
            appointment_date: oneAndHalfHoursFromNow,
            start_time: '10:00',
            end_time: '11:00'
          }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('at least 2 hours in advance');
      });

      it('should reject booking in the past', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { 
            appointment_date: yesterday,
            start_time: '10:00',
            end_time: '11:00'
          }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('cannot be in the past');
      });

      it('should reject overlapping appointments for same consultant', async () => {
        // Book first appointment
        const firstAppointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString()
        );
        await AppointmentService.bookAppointment(firstAppointmentData);

        // Create second user
        const secondUser = await TestDataFactory.createTestUser({ email: 'test2@example.com' });

        // Try to book overlapping appointment for different customer but same consultant
        const overlappingAppointmentData = TestDataFactory.createTestAppointmentData(
          secondUser._id.toString(),
          testConsultant._id.toString(),
          { 
            appointment_date: firstAppointmentData.appointment_date,
            start_time: firstAppointmentData.start_time,
            end_time: firstAppointmentData.end_time
          }
        );

        const result = await AppointmentService.bookAppointment(overlappingAppointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('time conflict');
      });
    });

    describe('Validation Tests', () => {
      it('should reject invalid customer ID', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          'invalid-id',
          testConsultant._id.toString()
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid customer ID format');
      });

      it('should reject invalid consultant ID', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          'invalid-id'
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid consultant ID format');
      });

      it('should reject invalid time format', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '24:00', end_time: '25:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid time format');
      });

      it('should reject when end time is before start time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '12:00', end_time: '11:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('End time must be after start time');
      });

      it('should reject when start time equals end time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '12:00', end_time: '12:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('End time must be after start time');
      });

      it('should reject missing required fields', async () => {
        const result = await AppointmentService.bookAppointment({} as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid input data');
      });

      it('should reject non-existent customer ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const appointmentData = TestDataFactory.createTestAppointmentData(
          nonExistentId,
          testConsultant._id.toString()
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Customer not found');
      });

      it('should reject non-existent consultant ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          nonExistentId
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Consultant not found');
      });
    });

    describe('Edge Cases', () => {
      it('should handle appointment at exact 2-hour boundary', async () => {
        const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { appointment_date: twoHoursFromNow }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
      });

      it('should handle very long customer notes', async () => {
        const longNotes = 'A'.repeat(1000);
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { customer_notes: longNotes }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.customer_notes).toBe(longNotes);
      });

      it('should handle empty customer notes', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { customer_notes: '' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.customer_notes).toBe('');
      });

      it('should handle null customer notes', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { customer_notes: null }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
      });

      it('should handle timezone considerations', async () => {
        const utcDate = new Date('2025-01-15T10:00:00.000Z');
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { appointment_date: utcDate }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed ObjectId', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { 
            appointment_date: new Date('invalid'),
            start_time: 'invalid',
            end_time: 'invalid'
          }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
      });

      it('should handle null/undefined parameters', async () => {
        const result = await AppointmentService.bookAppointment(null as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid input data');
      });

      it('should handle empty object parameters', async () => {
        const result = await AppointmentService.bookAppointment({} as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Invalid input data');
      });
    });
  });

  describe('confirmAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
    });

    it('should successfully confirm pending appointment', async () => {
      const result = await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('confirmed successfully');
      expect(result.data?.appointment.status).toBe('confirmed');
      expect(result.data?.meetingDetails).toBeDefined();
    });

    it('should reject confirmation by non-consultant', async () => {
      const result = await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testUser._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });

    it('should reject confirmation of non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.confirmAppointment(
        nonExistentId,
        testConsultant.user_id._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle invalid appointment ID format', async () => {
      const result = await AppointmentService.confirmAppointment(
        'invalid-id',
        testConsultant.user_id._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid appointment ID format');
    });

    it('should handle invalid consultant ID format', async () => {
      const result = await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        'invalid-id'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid consultant user ID format');
    });

    it('should handle missing parameters', async () => {
      const result = await AppointmentService.confirmAppointment('', '');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid appointment ID format');
    });
  });

  describe('cancelAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
    });

    it('should successfully cancel appointment by customer', async () => {
      const result = await AppointmentService.cancelAppointment(
        testAppointment._id.toString(),
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled successfully');
    });

    it('should successfully cancel appointment by consultant', async () => {
      const result = await AppointmentService.cancelAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString(),
        'consultant'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('cancelled successfully');
    });

    it('should reject cancellation by unauthorized user', async () => {
      const unauthorizedUser = await TestDataFactory.createTestUser({ email: 'unauthorized@example.com' });
      
      const result = await AppointmentService.cancelAppointment(
        testAppointment._id.toString(),
        unauthorizedUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.cancelAppointment(
        nonExistentId,
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('should handle invalid user role', async () => {
      const result = await AppointmentService.cancelAppointment(
        testAppointment._id.toString(),
        testUser._id.toString(),
        'invalid-role'
      );

      expect(result.success).toBe(false);
    });
  });

  describe('getCustomerAppointments', () => {
    beforeEach(async () => {
      // Create a test appointment
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      await AppointmentService.bookAppointment(appointmentData);
    });

    it('should retrieve customer appointments successfully', async () => {
      const result = await AppointmentService.getCustomerAppointments(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.appointments)).toBe(true);
      expect(result.data?.appointments?.length).toBeGreaterThan(0);
    });

    it('should filter appointments by status', async () => {
      const result = await AppointmentService.getCustomerAppointments(
        testUser._id.toString(),
        'pending'
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.appointments)).toBe(true);
    });

    it('should return empty array for customer with no appointments', async () => {
      const newUser = await TestDataFactory.createTestUser({ email: 'new@example.com' });
      const result = await AppointmentService.getCustomerAppointments(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.appointments)).toBe(true);
      expect(result.data?.appointments?.length).toBe(0);
    });

    it('should handle invalid customer ID', async () => {
      const result = await AppointmentService.getCustomerAppointments('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('server error');
    });

    it('should handle date filtering', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const result = await AppointmentService.getCustomerAppointments(
        testUser._id.toString(),
        undefined,
        futureDate,
        futureDate
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('updateAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
    });

    it('should successfully update appointment customer notes', async () => {
      const updateData = {
        customer_notes: 'Updated notes'
      };

      const result = await AppointmentService.updateAppointment(
        testAppointment._id.toString(),
        updateData,
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointment.customer_notes).toBe('Updated notes');
    });

    it('should reject update by unauthorized user', async () => {
      const unauthorizedUser = await TestDataFactory.createTestUser({ email: 'unauthorized@example.com' });
      const updateData = { customer_notes: 'Unauthorized update' };

      const result = await AppointmentService.updateAppointment(
        testAppointment._id.toString(),
        updateData,
        unauthorizedUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const updateData = { customer_notes: 'Test' };

      const result = await AppointmentService.updateAppointment(
        nonExistentId,
        updateData,
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getConsultantAppointments', () => {
    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      await AppointmentService.bookAppointment(appointmentData);
    });

    it('should retrieve consultant appointments successfully', async () => {
      const result = await AppointmentService.getConsultantAppointments(testConsultant._id.toString());

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.appointments)).toBe(true);
      expect(result.data?.appointments?.length).toBeGreaterThan(0);
    });

    it('should filter appointments by status', async () => {
      const result = await AppointmentService.getConsultantAppointments(
        testConsultant._id.toString(),
        'pending'
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data?.appointments)).toBe(true);
    });

    it('should handle date filtering', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      
      const result = await AppointmentService.getConsultantAppointments(
        testConsultant._id.toString(),
        undefined,
        futureDate,
        futureDate
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('completeAppointment', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
      
      // Confirm the appointment first
      await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString()
      );
    });

    it('should successfully complete appointment by consultant', async () => {
      const result = await AppointmentService.completeAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString(),
        'Consultation completed successfully'
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('completed successfully');
    });

    it('should reject completion by non-consultant', async () => {
      const result = await AppointmentService.completeAppointment(
        testAppointment._id.toString(),
        testUser._id.toString(),
        'Trying to complete'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.completeAppointment(
        nonExistentId,
        testConsultant.user_id._id.toString(),
        'Notes'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('submitFeedback', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
      
      // Complete the appointment to allow feedback
      await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString()
      );
      await AppointmentService.completeAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString(),
        'Completed'
      );
    });

    it('should successfully submit feedback', async () => {
      const feedbackData = {
        rating: 5,
        comment: 'Excellent consultation',
        communication_rating: 5,
        professionalism_rating: 5,
        helpfulness_rating: 5,
        recommendation: true
      };

      const result = await AppointmentService.submitFeedback(
        testAppointment._id.toString(),
        testUser._id.toString(),
        feedbackData
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('submitted successfully');
    });

    it('should reject feedback from unauthorized user', async () => {
      const unauthorizedUser = await TestDataFactory.createTestUser({ email: 'unauthorized@example.com' });
      const feedbackData = {
        rating: 5,
        comment: 'Unauthorized feedback'
      };

      const result = await AppointmentService.submitFeedback(
        testAppointment._id.toString(),
        unauthorizedUser._id.toString(),
        feedbackData
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not authorized');
    });

    it('should handle invalid rating values', async () => {
      const feedbackData = {
        rating: 6, // Invalid rating (should be 1-5)
        comment: 'Invalid rating'
      };

      const result = await AppointmentService.submitFeedback(
        testAppointment._id.toString(),
        testUser._id.toString(),
        feedbackData
      );

      expect(result.success).toBe(false);
    });
  });

  describe('getAppointmentFeedback', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
    });

    it('should retrieve appointment feedback successfully', async () => {
      const result = await AppointmentService.getAppointmentFeedback(testAppointment._id.toString(), testUser._id.toString(), 'customer');

      expect(result.success).toBe(true);
      // May be null if no feedback exists yet
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.getAppointmentFeedback(nonExistentId, testUser._id.toString(), 'customer');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getConsultantFeedbackStats', () => {
    it('should retrieve consultant feedback statistics', async () => {
      const result = await AppointmentService.getConsultantFeedbackStats(testConsultant._id.toString(), testUser._id.toString(), 'customer');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(typeof result.data?.total_feedbacks).toBe('number');
      expect(typeof result.data?.average_rating).toBe('number');
    });

    it('should handle non-existent consultant', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.getConsultantFeedbackStats(nonExistentId, testUser._id.toString(), 'customer');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('getAppointmentsWithPagination', () => {
    beforeEach(async () => {
      // Create multiple test appointments
      for (let i = 0; i < 3; i++) {
        const user = await TestDataFactory.createTestUser({ email: `test${i}@example.com` });
        const appointmentData = TestDataFactory.createTestAppointmentData(
          user._id.toString(),
          testConsultant._id.toString()
        );
        await AppointmentService.bookAppointment(appointmentData);
      }
    });

    it('should retrieve appointments with pagination', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'appointment_date',
        sortOrder: 'desc' as const
      };

      const result = await AppointmentService.getAppointmentsWithPagination(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.appointments)).toBe(true);
      expect(typeof result.data?.pagination?.total_items).toBe('number');
      expect(typeof result.data?.pagination?.total_pages).toBe('number');
    });

    it('should handle filtering by status', async () => {
      const query = {
        page: 1,
        limit: 10,
        status: 'pending' as const
      };

      const result = await AppointmentService.getAppointmentsWithPagination(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should handle date range filtering', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const query = {
        page: 1,
        limit: 10,
        startDate,
        endDate
      };

      const result = await AppointmentService.getAppointmentsWithPagination(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });

  describe('sendMeetingReminder', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
      
      await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString()
      );
    });

    it('should successfully send meeting reminder', async () => {
      const result = await AppointmentService.sendMeetingReminder(testAppointment._id.toString());

      expect(result.success).toBe(true);
      expect(result.message).toContain('reminder sent');
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.sendMeetingReminder(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('startMeeting', () => {
    let testAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      testAppointment = bookResult.data?.appointment;
      
      await AppointmentService.confirmAppointment(
        testAppointment._id.toString(),
        testConsultant.user_id._id.toString()
      );
    });

    it('should successfully start meeting', async () => {
      const result = await AppointmentService.startMeeting(
        testAppointment._id.toString(),
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.data?.meetingDetails).toBeDefined();
    });

    it('should handle non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.startMeeting(
        nonExistentId,
        testUser._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete appointment lifecycle', async () => {
      // 1. Book appointment
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      expect(bookResult.success).toBe(true);

      const appointmentId = bookResult.data?.appointment._id.toString();

      // 2. Confirm appointment
      const confirmResult = await AppointmentService.confirmAppointment(
        appointmentId!,
        testConsultant.user_id._id.toString()
      );
      expect(confirmResult.success).toBe(true);

      // 3. Complete appointment
      const completeResult = await AppointmentService.completeAppointment(
        appointmentId!,
        testConsultant.user_id._id.toString(),
        'Consultation completed'
      );
      expect(completeResult.success).toBe(true);

      // 4. Submit feedback
      const feedbackData = {
        rating: 5,
        comment: 'Great consultation'
      };
      const feedbackResult = await AppointmentService.submitFeedback(
        appointmentId!,
        testUser._id.toString(),
        feedbackData
      );
      expect(feedbackResult.success).toBe(true);
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle database errors gracefully', async () => {
      // This test covers error handling paths
      const result = await AppointmentService.bookAppointment({
        customer_id: '',
        consultant_id: '',
        appointment_date: new Date(),
        start_time: '',
        end_time: ''
      });

      expect(result.success).toBe(false);
    });

    it('should handle various time format validations', async () => {
      const timeFormats = ['24:00', '12:60', 'abc', '12', '12:30:45'];
      
      for (const time of timeFormats) {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: time, end_time: '13:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);
        expect(result.success).toBe(false);
      }
    });

    it('should handle appointment creation with different date scenarios', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString(),
        { appointment_date: futureDate }
      );

      const result = await AppointmentService.bookAppointment(appointmentData);

      expect(result.success).toBe(true);
    });
  });
});