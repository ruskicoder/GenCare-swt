import { MenstrualCycleService } from '../../services/menstrualCycleService';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { MenstrualCycle } from '../../models/MenstrualCycle';
import { User } from '../../models/User';
import mongoose from 'mongoose';

describe('MenstrualCycleService', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test data for each test
    testUser = await TestDataFactory.createTestUser();
  });

  describe('processPeriodDays', () => {
    describe('Happy Path', () => {
      it('should successfully process period days and create cycle', async () => {
        const today = new Date();
        const periodDays = [
          new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
          new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
          new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
          today
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Test cycle'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
        expect(result.cycles || result.data?.cycles).toHaveLength(1);
      });

      it('should process single period day', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Single day cycle'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
        expect(result.cycles || result.data?.cycles).toHaveLength(1);
      });

      it('should process multiple cycles with gaps', async () => {
        const baseDate = new Date();
        const periodDays = TestDataFactory.createMultiplePeriodDays(baseDate, [
          [0, 1, 2, 3], // First cycle: 4 consecutive days
          [28, 29, 30, 31], // Second cycle: 4 consecutive days, 28 days later
          [56, 57, 58] // Third cycle: 3 consecutive days, 28 days later
        ]);

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Multiple cycles'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
        expect(result.cycles || result.data?.cycles).toHaveLength(3);
      });

      it('should handle empty notes', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          ''
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
      });

      it('should correctly predict ovulation date', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Ovulation prediction test'
        );

        expect(result.success).toBe(true);
        const cycle = (result.cycles || result.data?.cycles)[0];
        expect(cycle.predicted_ovulation_date).toBeDefined();
        
        // Ovulation should be about 14 days after cycle start
        const ovulationDate = new Date(cycle.predicted_ovulation_date);
        const cycleStart = new Date(cycle.cycle_start_date);
        const daysDiff = Math.floor((ovulationDate - cycleStart) / (24 * 60 * 60 * 1000));
        expect(daysDiff).toBe(14);
      });

      it('should predict fertile window', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Fertile window test'
        );

        expect(result.success).toBe(true);
        const cycle = (result.cycles || result.data?.cycles)[0];
        expect(cycle.predicted_fertile_start).toBeDefined();
        expect(cycle.predicted_fertile_end).toBeDefined();
        
        // Fertile window should be around ovulation
        const fertileStart = new Date(cycle.predicted_fertile_start);
        const fertileEnd = new Date(cycle.predicted_fertile_end);
        const windowDays = Math.floor((fertileEnd - fertileStart) / (24 * 60 * 60 * 1000));
        expect(windowDays).toBeGreaterThan(0);
        expect(windowDays).toBeLessThanOrEqual(7);
      });
    });

    describe('Business Rule Validations', () => {
      it('should reject empty period days array', async () => {
        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          [],
          'Empty periods'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('empty');
      });

      it('should reject invalid user ID', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          'invalid-user-id',
          periodDays,
          'Invalid user'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required') || expect(result.message).toContain('invalid');
      });

      it('should reject null user ID', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          null as any,
          periodDays,
          'Null user'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required');
      });

      it('should reject empty user ID', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          '',
          periodDays,
          'Empty user'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required');
      });

      it('should remove duplicate dates', async () => {
        const today = new Date();
        const periodDays = [
          today,
          today, // Duplicate
          new Date(today.getTime() + 24 * 60 * 60 * 1000),
          new Date(today.getTime() + 24 * 60 * 60 * 1000) // Duplicate
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Duplicate dates'
        );

        expect(result.success).toBe(true);
        const cycle = (result.cycles || result.data?.cycles)[0];
        expect(cycle.period_days).toHaveLength(2); // Should remove duplicates
      });

      it('should handle future dates', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);
        const periodDays = [futureDate];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Future dates'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
      });

      it('should handle past dates', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 100);
        const periodDays = [pastDate];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Past dates'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long notes', async () => {
        const today = new Date();
        const periodDays = [today];
        const longNotes = 'a'.repeat(1000);

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          longNotes
        );

        expect(result.success).toBe(true);
        const cycle = (result.cycles || result.data?.cycles)[0];
        expect(cycle.notes).toBe(longNotes);
      });

      it('should handle null notes', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          null as any
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
      });

      it('should handle irregular periods', async () => {
        const baseDate = new Date();
        const periodDays = [
          baseDate,
          new Date(baseDate.getTime() + 20 * 24 * 60 * 60 * 1000), // 20 days later
          new Date(baseDate.getTime() + 35 * 24 * 60 * 60 * 1000), // 35 days later
          new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000)  // 60 days later
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Irregular periods'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toHaveLength(4); // Each day as separate cycle
      });

      it('should handle very short cycles', async () => {
        const today = new Date();
        const periodDays = [
          today,
          new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days later
          new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)  // 30 days later
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Short cycles'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toHaveLength(3);
      });

      it('should handle very long cycles', async () => {
        const today = new Date();
        const periodDays = [
          today,
          new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 days later
          new Date(today.getTime() + 120 * 24 * 60 * 60 * 1000) // 120 days later
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Long cycles'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toHaveLength(3);
      });

      it('should handle single day periods', async () => {
        const baseDate = new Date();
        const periodDays = [
          baseDate,
          new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000), // 28 days later
          new Date(baseDate.getTime() + 56 * 24 * 60 * 60 * 1000)  // 56 days later
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Single day periods'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toHaveLength(3);
      });

      it('should handle timezone differences', async () => {
        const baseDate = new Date();
        const periodDays = [
          new Date(baseDate.toISOString()), // UTC
          new Date(baseDate.getTime() + 24 * 60 * 60 * 1000)
        ];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Timezone test'
        );

        expect(result.success).toBe(true);
        expect(result.cycles || result.data?.cycles).toBeDefined();
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid date objects', async () => {
        const invalidDate = new Date('invalid-date');
        const periodDays = [invalidDate];

        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          periodDays,
          'Invalid dates'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('date');
      });

      it('should handle malformed ObjectId', async () => {
        const today = new Date();
        const periodDays = [today];

        const result = await MenstrualCycleService.processPeriodDays(
          'not-a-valid-objectid',
          periodDays,
          'Malformed ID'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('User ID');
      });

      it('should handle null period days', async () => {
        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          null as any,
          'Null periods'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('empty');
      });

      it('should handle undefined period days', async () => {
        const result = await MenstrualCycleService.processPeriodDays(
          testUser._id.toString(),
          undefined as any,
          'Undefined periods'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('empty');
      });
    });
  });

  describe('getCycles', () => {
    beforeEach(async () => {
      // Create test cycles
      const today = new Date();
      const periodDays = [
        new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        today
      ];

      await MenstrualCycleService.processPeriodDays(
        testUser._id.toString(),
        periodDays,
        'Test cycles for getCycles'
      );
    });

    it('should retrieve user cycles successfully', async () => {
      const result = await MenstrualCycleService.getCycles(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.cycles || result.data?.cycles).toBeDefined();
      expect(result.cycles || result.data?.cycles).toHaveLength(1);
    });

    it('should return empty array for user with no cycles', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'nocycles@example.com'
      });

      const result = await MenstrualCycleService.getCycles(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.cycles || result.data?.cycles).toHaveLength(0);
    });

    it('should handle invalid user ID', async () => {
      const result = await MenstrualCycleService.getCycles('invalid-user-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
    });
  });

  describe('getTodayStatus', () => {
    beforeEach(async () => {
      // Create test cycles
      const today = new Date();
      const periodDays = [
        new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        today
      ];

      await MenstrualCycleService.processPeriodDays(
        testUser._id.toString(),
        periodDays,
        'Test cycles for today status'
      );
    });

    it('should get today status successfully', async () => {
      const result = await MenstrualCycleService.getTodayStatus(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.status || result.data?.status).toBeDefined();
      expect(result.status?.isOnPeriod || result.data?.status?.isOnPeriod).toBe(true);
    });

    it('should provide recommendations', async () => {
      const result = await MenstrualCycleService.getTodayStatus(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.status?.recommendations || result.data?.status?.recommendations).toBeDefined();
      expect(Array.isArray(result.status?.recommendations || result.data?.status?.recommendations)).toBe(true);
    });

    it('should handle user with no cycles', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'notoday@example.com'
      });

      const result = await MenstrualCycleService.getTodayStatus(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.status?.isOnPeriod || result.data?.status?.isOnPeriod).toBe(false);
    });
  });

  describe('getCycleStats', () => {
    beforeEach(async () => {
      // Create multiple cycles for stats
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 60);
      
      const periodDays = TestDataFactory.createMultiplePeriodDays(baseDate, [
        [0, 1, 2, 3],
        [28, 29, 30, 31],
        [56, 57, 58, 59]
      ]);

      await MenstrualCycleService.processPeriodDays(
        testUser._id.toString(),
        periodDays,
        'Test cycles for stats'
      );
    });

    it('should get cycle statistics successfully', async () => {
      const result = await MenstrualCycleService.getCycleStats(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.stats || result.data?.stats).toBeDefined();
      expect(result.stats?.averageCycleLength || result.data?.stats?.averageCycleLength).toBeDefined();
    });

    it('should calculate average cycle length', async () => {
      const result = await MenstrualCycleService.getCycleStats(testUser._id.toString());

      expect(result.success).toBe(true);
      const avgLength = result.stats?.averageCycleLength || result.data?.stats?.averageCycleLength;
      expect(avgLength).toBeGreaterThan(0);
      expect(avgLength).toBeLessThan(50); // Reasonable cycle length
    });

    it('should handle user with no cycles', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'nostats@example.com'
      });

      const result = await MenstrualCycleService.getCycleStats(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.stats?.averageCycleLength || result.data?.stats?.averageCycleLength).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete cycle management workflow', async () => {
      // Process period days
      const today = new Date();
      const periodDays = [
        new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        today
      ];

      const processResult = await MenstrualCycleService.processPeriodDays(
        testUser._id.toString(),
        periodDays,
        'Integration test cycle'
      );
      expect(processResult.success).toBe(true);

      // Get cycles
      const cyclesResult = await MenstrualCycleService.getCycles(testUser._id.toString());
      expect(cyclesResult.success).toBe(true);
      expect(cyclesResult.cycles || cyclesResult.data?.cycles).toHaveLength(1);

      // Get today status
      const statusResult = await MenstrualCycleService.getTodayStatus(testUser._id.toString());
      expect(statusResult.success).toBe(true);
      expect(statusResult.status?.isOnPeriod || statusResult.data?.status?.isOnPeriod).toBe(true);

      // Get cycle stats
      const statsResult = await MenstrualCycleService.getCycleStats(testUser._id.toString());
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats || statsResult.data?.stats).toBeDefined();
    });

    it('should handle multiple cycles over time', async () => {
      // Create cycles over several months
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 90);

      const periodDays = TestDataFactory.createMultiplePeriodDays(baseDate, [
        [0, 1, 2, 3],      // Cycle 1
        [28, 29, 30, 31],  // Cycle 2
        [56, 57, 58, 59],  // Cycle 3
        [84, 85, 86, 87]   // Cycle 4
      ]);

      const processResult = await MenstrualCycleService.processPeriodDays(
        testUser._id.toString(),
        periodDays,
        'Multiple cycles test'
      );
      expect(processResult.success).toBe(true);

      // Verify all cycles were created
      const cyclesResult = await MenstrualCycleService.getCycles(testUser._id.toString());
      expect(cyclesResult.success).toBe(true);
      expect(cyclesResult.cycles || cyclesResult.data?.cycles).toHaveLength(4);

      // Check stats with multiple cycles
      const statsResult = await MenstrualCycleService.getCycleStats(testUser._id.toString());
      expect(statsResult.success).toBe(true);
      const avgLength = statsResult.stats?.averageCycleLength || statsResult.data?.stats?.averageCycleLength;
      expect(avgLength).toBeCloseTo(28, 1); // Should be close to 28 days
    });
  });
});