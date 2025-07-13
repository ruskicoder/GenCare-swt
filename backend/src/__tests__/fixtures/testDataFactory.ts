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
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      address: '123 Test St',
      date_of_birth: new Date('1990-01-01'),
      gender: 'female' as const,
      role: 'customer' as const,
      isActive: true,
      ...overrides
    };

    const user = new User(userData);
    await user.save();
    return user;
  }

  // Create test consultant
  static async createTestConsultant(overrides: Partial<IConsultant> = {}): Promise<IConsultant> {
    const consultantData = {
      first_name: 'Dr. Test',
      last_name: 'Consultant',
      email: 'consultant@example.com',
      phone: '0987654321',
      specialization: 'General Medicine',
      experience_years: 5,
      is_active: true,
      ...overrides
    };

    const consultant = new Consultant(consultantData);
    await consultant.save();
    return consultant;
  }

  // Create test weekly schedule
  static async createTestWeeklySchedule(consultantId: string, overrides: Partial<IWeeklySchedule> = {}): Promise<IWeeklySchedule> {
    const scheduleData = {
      consultant_id: new mongoose.Types.ObjectId(consultantId),
      week_start_date: new Date('2024-01-01'),
      week_end_date: new Date('2024-01-07'),
      schedule: [
        {
          day_of_week: 1,
          working_hours: {
            start: '09:00',
            end: '17:00'
          },
          break_times: [
            {
              start: '12:00',
              end: '13:00'
            }
          ],
          is_available: true
        },
        {
          day_of_week: 2,
          working_hours: {
            start: '09:00',
            end: '17:00'
          },
          break_times: [
            {
              start: '12:00',
              end: '13:00'
            }
          ],
          is_available: true
        }
      ],
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
    const testData = {
      sti_test_name: 'Test STI Test',
      sti_test_code: 'TST001',
      price: 100,
      description: 'Test STI test description',
      test_type: 'Blood' as const,
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
    const packageData = {
      sti_package_name: 'Test STI Package',
      sti_package_code: 'PKG001',
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
      test_date: tomorrow,
      available_slots: ['09:00', '10:00', '11:00', '14:00', '15:00'],
      max_bookings: 10,
      current_bookings: 0,
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
    const periodDays = [
      new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
      new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
      today
    ];

    return {
      user_id: userId,
      period_days: periodDays,
      notes: 'Test cycle notes',
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