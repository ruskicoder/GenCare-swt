import { AppointmentRepository } from '../../repositories/appointmentRepository';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { Appointment } from '../../models/Appointment';
import mongoose from 'mongoose';

describe('AppointmentRepository', () => {
  let testUser: any;
  let testConsultant: any;
  let testAppointment: any;

  beforeEach(async () => {
    testUser = await TestDataFactory.createTestUser();
    testConsultant = await TestDataFactory.createTestConsultant();
    
    // Create a test appointment
    const appointmentData = {
      customer_id: testUser._id,
      consultant_id: testConsultant._id,
      appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      start_time: '10:00',
      end_time: '11:00',
      status: 'pending' as const,
      customer_notes: 'Test appointment',
      meeting_info: {
        meet_url: 'https://meet.google.com/test-setup',
        meeting_id: `setup-meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date(),
        reminder_sent: false
      },
      created_date: new Date(),
      updated_date: new Date()
    };
    
    testAppointment = await AppointmentRepository.create(appointmentData);
  });

  describe('create', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        customer_id: testUser._id,
        consultant_id: testConsultant._id,
        appointment_date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        start_time: '14:00',
        end_time: '15:00',
        status: 'pending' as const,
        customer_notes: 'New test appointment',
        meeting_info: {
          meet_url: 'https://meet.google.com/test-unique-id',
          meeting_id: `test-meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          created_at: new Date(),
          reminder_sent: false
        },
        created_date: new Date(),
        updated_date: new Date()
      };

      const result = await AppointmentRepository.create(appointmentData);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.customer_id.toString()).toBe(testUser._id.toString());
      expect(result.consultant_id.toString()).toBe(testConsultant._id.toString());
      expect(result.status).toBe('pending');
    });
  });

  describe('findById', () => {
    it('should find appointment by ID', async () => {
      const result = await AppointmentRepository.findById(testAppointment._id.toString());

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(testAppointment._id.toString());
      expect(result?.status).toBe('pending');
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentRepository.findById(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('findByCustomerId', () => {
    it('should find appointments by customer ID', async () => {
      const result = await AppointmentRepository.findByCustomerId(testUser._id.toString());

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].customer_id.toString()).toBe(testUser._id.toString());
    });

    it('should filter by status', async () => {
      const result = await AppointmentRepository.findByCustomerId(
        testUser._id.toString(),
        'pending'
      );

      expect(Array.isArray(result)).toBe(true);
      result.forEach(appointment => {
        expect(appointment.status).toBe('pending');
      });
    });

    it('should return empty array for non-existent customer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentRepository.findByCustomerId(nonExistentId);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('findByConsultantId', () => {
    it('should find appointments by consultant ID', async () => {
      const result = await AppointmentRepository.findByConsultantId(testConsultant._id.toString());

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].consultant_id.toString()).toBe(testConsultant._id.toString());
    });
  });

  describe('updateById', () => {
    it('should update appointment by ID', async () => {
      const updateData = {
        status: 'confirmed' as const,
        customer_notes: 'Updated notes'
      };

      const result = await AppointmentRepository.updateById(
        testAppointment._id.toString(),
        updateData
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('confirmed');
      expect(result?.customer_notes).toBe('Updated notes');
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await AppointmentRepository.updateById(nonExistentId, { status: 'confirmed' });

      expect(result).toBeNull();
    });
  });

  describe('checkTimeConflict', () => {
    it('should detect time conflicts', async () => {
      const hasConflict = await AppointmentRepository.checkTimeConflict(
        testConsultant._id.toString(),
        testAppointment.appointment_date,
        '10:30', // Overlaps with existing 10:00-11:00
        '11:30'
      );

      expect(hasConflict).toBe(true);
    });

    it('should return false for non-conflicting times', async () => {
      const hasConflict = await AppointmentRepository.checkTimeConflict(
        testConsultant._id.toString(),
        testAppointment.appointment_date,
        '12:00', // No overlap with existing 10:00-11:00
        '13:00'
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('cancelById', () => {
    it('should cancel appointment by ID', async () => {
      const result = await AppointmentRepository.cancelById(testAppointment._id.toString());

      expect(result).toBeDefined();
      expect(result?.status).toBe('cancelled');
    });
  });

  describe('completeById', () => {
    it('should complete appointment by ID', async () => {
      // First confirm the appointment
      await AppointmentRepository.updateById(testAppointment._id.toString(), { status: 'confirmed' });

      const result = await AppointmentRepository.completeById(
        testAppointment._id.toString(),
        'Consultation completed successfully'
      );

      expect(result).toBeDefined();
      expect(result?.status).toBe('completed');
      expect(result?.consultant_notes).toBe('Consultation completed successfully');
    });
  });
});