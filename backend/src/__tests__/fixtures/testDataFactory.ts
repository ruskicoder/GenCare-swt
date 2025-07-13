import mongoose from 'mongoose';
import { IUser, User } from '../../models/User';
import { IConsultant, Consultant } from '../../models/Consultant';
import { IAppointment } from '../../models/Appointment';
import { IStiOrder } from '../../models/StiOrder';
import { IStiPackage, StiPackage } from '../../models/StiPackage';
import { IStiTest, StiTest } from '../../models/StiTest';
import { IMenstrualCycle } from '../../models/MenstrualCycle';
import { IWeeklySchedule, WeeklySchedule } from '../../models/WeeklySchedule';
import { IStiTestSchedule, StiTestSchedule } from '../../models/StiTestSchedule';

export class TestDataFactory {
  // Create test user
  static async createTestUser(overrides: Partial<IUser> = {}): Promise<IUser> {
    const userData = {
      email: 'test@example.com',
      password: 'hashedpassword123',
      full_name: 'Test User',
      phone: '1234567890',
      date_of_birth: new Date('1990-01-01'),
      gender: 'female' as const,
      role: 'customer' as const,
      status: true,
      ...overrides
    };

    const user = new User(userData);
    await user.save();
    return user;
  }

  // Create test consultant
  static async createTestConsultant(overrides: Partial<IConsultant> = {}): Promise<IConsultant> {
    // First create a user for the consultant
    const user = await this.createTestUser({
      full_name: 'Dr. Test Consultant',
      email: 'consultant@example.com',
      role: 'consultant'
    });

    const consultantData = {
      user_id: user._id,
      specialization: 'General Medicine',
      qualifications: 'MD, MBBS',
      experience_years: 5,
      total_consultations: 0,
      ...overrides
    };

    const consultant = new Consultant(consultantData);
    await consultant.save();
    return consultant;
  }

  // Create test weekly schedule
  static async createTestWeeklySchedule(consultantId: string, overrides: Partial<IWeeklySchedule> = {}): Promise<IWeeklySchedule> {
    // Create an admin user for the created_by field
    const adminUser = await this.createTestUser({
      full_name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin'
    });

    const scheduleData = {
      consultant_id: new mongoose.Types.ObjectId(consultantId),
      week_start_date: new Date('2024-01-01'),
      week_end_date: new Date('2024-01-07'),
      working_days: {
        monday: {
          start_time: '09:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
          is_available: true
        },
        tuesday: {
          start_time: '09:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
          is_available: true
        },
        wednesday: {
          start_time: '09:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
          is_available: true
        },
        thursday: {
          start_time: '09:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
          is_available: true
        },
        friday: {
          start_time: '09:00',
          end_time: '17:00',
          break_start: '12:00',
          break_end: '13:00',
          is_available: true
        }
      },
      default_slot_duration: 60,
      created_by: {
        user_id: adminUser._id,
        role: adminUser.role,
        name: adminUser.full_name
      },
      created_date: new Date(),
      updated_date: new Date(),
      ...overrides
    };

    const schedule = new WeeklySchedule(scheduleData);
    await schedule.save();
    return schedule;
  }

  // Create test appointment data
  static createTestAppointmentData(customerId: string, consultantId: string, overrides: any = {}): any {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    return {
      customer_id: customerId,
      consultant_id: consultantId,
      appointment_date: tomorrow,
      start_time: '10:00',
      end_time: '11:00',
      customer_notes: 'Test appointment',
      ...overrides
    };
  }

  // Create test STI test
  static async createTestStiTest(overrides: Partial<IStiTest> = {}): Promise<IStiTest> {
    // Generate unique code to avoid duplicate key errors
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const testData = {
      sti_test_name: `Test STI Test ${randomId}`,
      sti_test_code: `STI-VIR-BLD-${randomId}`,
      sti_test_type: 'máu' as const,
      category: 'viral' as const,
      price: 100,
      description: 'Test STI test description',
      is_active: true,
      createdBy: new mongoose.Types.ObjectId(),
      ...overrides
    };

    const stiTest = new StiTest(testData);
    await stiTest.save();
    return stiTest;
  }

  // Create test STI package
  static async createTestStiPackage(overrides: Partial<IStiPackage> = {}): Promise<IStiPackage> {
    // Generate unique code to avoid duplicate key errors
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const packageData = {
      sti_package_name: `Test STI Package ${randomId}`,
      sti_package_code: `PKG${randomId}`,
      price: 200,
      description: 'Test STI package description',
      is_active: true,
      createdBy: new mongoose.Types.ObjectId(),
      ...overrides
    };

    const stiPackage = new StiPackage(packageData);
    await stiPackage.save();
    return stiPackage;
  }

  // Create test STI test schedule
  static async createTestStiTestSchedule(overrides: Partial<IStiTestSchedule> = {}): Promise<IStiTestSchedule> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const scheduleData = {
      order_date: tomorrow,
      number_current_orders: 0,
      is_locked: false,
      is_holiday: false,
      ...overrides
    };

    const schedule = new StiTestSchedule(scheduleData);
    await schedule.save();
    return schedule;
  }

  // Create test STI order data
  static createTestStiOrderData(customerId: string, scheduleId: string, overrides: any = {}): any {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      customer_id: customerId,
      sti_schedule_id: scheduleId,
      order_date: tomorrow,
      total_amount: 100,
      payment_status: 'Pending' as const,
      order_status: 'Booked' as const,
      ...overrides
    };
  }

  // Create test menstrual cycle data
  static createTestMenstrualCycleData(userId: string, overrides: any = {}): any {
    const today = new Date();
    const cycleStartDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const periodDays = [
      new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      today
    ];

    return {
      user_id: userId,
      cycle_start_date: cycleStartDate,
      period_days: periodDays,
      cycle_length: 28,
      notes: 'Test cycle notes',
      predicted_cycle_end: new Date(cycleStartDate.getTime() + 28 * 24 * 60 * 60 * 1000),
      predicted_ovulation_date: new Date(cycleStartDate.getTime() + 14 * 24 * 60 * 60 * 1000),
      predicted_fertile_start: new Date(cycleStartDate.getTime() + 12 * 24 * 60 * 60 * 1000),
      predicted_fertile_end: new Date(cycleStartDate.getTime() + 16 * 24 * 60 * 60 * 1000),
      notification_enabled: true,
      ...overrides
    };
  }

  // Create multiple period days for testing cycle grouping
  static createMultiplePeriodDays(baseDate: Date, patterns: number[][]): Date[] {
    const allDays: Date[] = [];
    
    patterns.forEach((pattern, cycleIndex) => {
      const cycleStart = new Date(baseDate);
      cycleStart.setDate(baseDate.getDate() + (cycleIndex * 28));
      
      pattern.forEach(dayOffset => {
        const periodDay = new Date(cycleStart);
        periodDay.setDate(cycleStart.getDate() + dayOffset);
        allDays.push(periodDay);
      });
    });

    return allDays;
  }

  // Create test data for edge cases
  static createEdgeCaseData() {
    return {
      invalidEmail: 'invalid-email',
      invalidDate: 'invalid-date',
      futureDate: new Date('2030-01-01'),
      pastDate: new Date('2020-01-01'),
      invalidTimeFormat: '25:00',
      invalidUserId: 'invalid-user-id',
      nonExistentId: new mongoose.Types.ObjectId().toString(),
      emptyString: '',
      nullValue: null,
      undefinedValue: undefined,
      negativeAmount: -100,
      zeroAmount: 0,
      maxAmount: 999999999,
      longString: 'a'.repeat(2000),
      specialCharacters: '<script>alert("xss")</script>',
      sqlInjection: "'; DROP TABLE users; --"
    };
  }

  // Clean up test data
  static async cleanupTestData(): Promise<void> {
    await User.deleteMany({});
    await Consultant.deleteMany({});
    await WeeklySchedule.deleteMany({});
    await StiTest.deleteMany({});
    await StiPackage.deleteMany({});
    await StiTestSchedule.deleteMany({});
  }
}