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
          { start_time: '14:00', end_time: '15:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.start_time).toBe('14:00');
        expect(result.data?.appointment.end_time).toBe('15:00');
      });
    });

    describe('Business Rule Violations', () => {
      it('should reject booking when customer has pending appointment', async () => {
        // Create a pending appointment first
        const firstAppointment = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString()
        );
        await AppointmentService.bookAppointment(firstAppointment);

        // Try to book another appointment
        const secondAppointment = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '15:00', end_time: '16:00' }
        );

        const result = await AppointmentService.bookAppointment(secondAppointment);

        expect(result.success).toBe(false);
        expect(result.message).toContain('already have a pending appointment');
      });

      it('should reject booking less than 2 hours in advance', async () => {
        const now = new Date();
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { 
            appointment_date: oneHourFromNow,
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
          { appointment_date: yesterday }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('past');
      });

      it('should reject overlapping appointments for same consultant', async () => {
        // Book first appointment
        const firstAppointment = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '10:00', end_time: '11:00' }
        );
        const firstResult = await AppointmentService.bookAppointment(firstAppointment);
        
        // Confirm first appointment to avoid pending limit
        if (firstResult.data?.appointment?._id) {
          await AppointmentService.confirmAppointment(
            firstResult.data.appointment._id.toString(),
            testConsultant._id.toString()
          );
        }

        // Create second user for overlapping appointment
        const secondUser = await TestDataFactory.createTestUser({
          email: 'second@example.com'
        });

        // Try to book overlapping appointment
        const overlappingAppointment = TestDataFactory.createTestAppointmentData(
          secondUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '10:30', end_time: '11:30' }
        );

        const result = await AppointmentService.bookAppointment(overlappingAppointment);

        expect(result.success).toBe(false);
        expect(result.message).toContain('already has an appointment');
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
        expect(result.message).toContain('Customer not found');
      });

      it('should reject invalid consultant ID', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          'invalid-id'
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Consultant not found');
      });

      it('should reject invalid time format', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '25:00', end_time: '26:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('time format') || expect(result.message).toContain('invalid');
      });

      it('should reject when end time is before start time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '15:00', end_time: '14:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('before') || expect(result.message).toContain('invalid');
      });

      it('should reject when start time equals end time', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { start_time: '10:00', end_time: '10:00' }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('before') || expect(result.message).toContain('invalid');
      });

      it('should reject missing required fields', async () => {
        const appointmentData = {
          customer_id: testUser._id.toString(),
          consultant_id: testConsultant._id.toString(),
          // Missing appointment_date, start_time, end_time
        };

        const result = await AppointmentService.bookAppointment(appointmentData as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('missing');
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
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { appointment_date: twoHoursFromNow }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
      });

      it('should handle very long customer notes', async () => {
        const longNotes = 'a'.repeat(1000);
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
        expect(result.data?.appointment.customer_notes).toBeNull();
      });

      it('should handle timezone considerations', async () => {
        const utcDate = new Date();
        utcDate.setUTCHours(utcDate.getUTCHours() + 3);
        
        const appointmentData = TestDataFactory.createTestAppointmentData(
          testUser._id.toString(),
          testConsultant._id.toString(),
          { appointment_date: utcDate }
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(true);
        expect(result.data?.appointment.appointment_date).toEqual(utcDate);
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed ObjectId', async () => {
        const appointmentData = TestDataFactory.createTestAppointmentData(
          'not-a-valid-objectid',
          testConsultant._id.toString()
        );

        const result = await AppointmentService.bookAppointment(appointmentData);

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
      });

      it('should handle null/undefined parameters', async () => {
        const result = await AppointmentService.bookAppointment(null as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('invalid');
      });

      it('should handle empty object parameters', async () => {
        const result = await AppointmentService.bookAppointment({} as any);

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('missing');
      });
    });
  });

  describe('confirmAppointment', () => {
    let pendingAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const result = await AppointmentService.bookAppointment(appointmentData);
      pendingAppointment = result.data?.appointment;
    });

    it('should successfully confirm pending appointment', async () => {
      const result = await AppointmentService.confirmAppointment(
        pendingAppointment?._id?.toString() || '',
        testConsultant._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointment.status).toBe('confirmed');
      expect(result.data?.appointment.meeting_info).toBeDefined();
    });

    it('should reject confirmation by non-consultant', async () => {
      const result = await AppointmentService.confirmAppointment(
        pendingAppointment._id.toString(),
        testUser._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('permission') || expect(result.message).toContain('unauthorized');
    });

    it('should reject confirmation of non-existent appointment', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentService.confirmAppointment(
        nonExistentId,
        testConsultant._id.toString()
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('cancelAppointment', () => {
    let confirmedAppointment: any;

    beforeEach(async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      const confirmResult = await AppointmentService.confirmAppointment(
        bookResult.data?.appointment?._id?.toString() || '',
        testConsultant._id.toString()
      );
      confirmedAppointment = confirmResult.data?.appointment;
    });

    it('should successfully cancel appointment by customer', async () => {
      const result = await AppointmentService.cancelAppointment(
        confirmedAppointment._id.toString(),
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointment.status).toBe('cancelled');
    });

    it('should successfully cancel appointment by consultant', async () => {
      const result = await AppointmentService.cancelAppointment(
        confirmedAppointment._id.toString(),
        testConsultant._id.toString(),
        'consultant'
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointment.status).toBe('cancelled');
    });

    it('should reject cancellation by unauthorized user', async () => {
      const otherUser = await TestDataFactory.createTestUser({
        email: 'other@example.com'
      });

      const result = await AppointmentService.cancelAppointment(
        confirmedAppointment._id.toString(),
        otherUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('permission') || expect(result.message).toContain('unauthorized');
    });
  });

  describe('getCustomerAppointments', () => {
    it('should retrieve customer appointments successfully', async () => {
      // Create multiple appointments for the customer
      const appointmentData1 = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const appointmentData2 = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString(),
        { start_time: '14:00', end_time: '15:00' }
      );

      await AppointmentService.bookAppointment(appointmentData1);
      await AppointmentService.bookAppointment(appointmentData2);

      const result = await AppointmentService.getCustomerAppointments(
        testUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointments).toHaveLength(2);
    });

    it('should filter appointments by status', async () => {
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      await AppointmentService.bookAppointment(appointmentData);

      const result = await AppointmentService.getCustomerAppointments(
        testUser._id.toString(),
        'pending'
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointments).toHaveLength(1);
      expect(result.data?.appointments[0].status).toBe('pending');
    });

    it('should return empty array for customer with no appointments', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'new@example.com'
      });

      const result = await AppointmentService.getCustomerAppointments(
        newUser._id.toString()
      );

      expect(result.success).toBe(true);
      expect(result.data?.appointments).toHaveLength(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete appointment lifecycle', async () => {
      // Book appointment
      const appointmentData = TestDataFactory.createTestAppointmentData(
        testUser._id.toString(),
        testConsultant._id.toString()
      );
      const bookResult = await AppointmentService.bookAppointment(appointmentData);
      expect(bookResult.success).toBe(true);
      expect(bookResult.data?.appointment.status).toBe('pending');

      // Confirm appointment
      const confirmResult = await AppointmentService.confirmAppointment(
        bookResult.data?.appointment?._id?.toString() || '',
        testConsultant._id.toString()
      );
      expect(confirmResult.success).toBe(true);
      expect(confirmResult.data?.appointment.status).toBe('confirmed');

      // Complete appointment
      const completeResult = await AppointmentService.completeAppointment(
        confirmResult.data?.appointment._id.toString(),
        testConsultant._id.toString(),
        'Consultation completed successfully'
      );
      expect(completeResult.success).toBe(true);
      expect(completeResult.data?.appointment.status).toBe('completed');
    });
  });
});