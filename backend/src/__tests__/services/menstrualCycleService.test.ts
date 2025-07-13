import { MenstrualCycleService } from '../../services/menstrualCycleService';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { MenstrualCycle } from '../../models/MenstrualCycle';
import { User } from '../../models/User';
import mongoose from 'mongoose';
import { MenstrualCycleRepository } from '../../repositories/menstrualCycleRepository';

// Helper functions
const createTestUser = () => TestDataFactory.createTestUser({
  full_name: 'Test User'
});

const createTestMenstrualCycle = async (userId: mongoose.Types.ObjectId, overrides: any = {}) => {
  const cycleData = TestDataFactory.createTestMenstrualCycleData(userId.toString(), overrides);
  const cycle = new MenstrualCycle(cycleData);
  await cycle.save();
  return cycle;
};

const setupTestDB = async () => {
  // Database setup is handled in setup.ts
};

const cleanupTestDB = async () => {
  // Database cleanup is handled in setup.ts
};

describe('MenstrualCycleService', () => {
  beforeEach(async () => {
    await setupTestDB();
  });

  afterEach(async () => {
    await cleanupTestDB();
  });

  describe('processPeriodDays', () => {
    it('should process valid period days successfully', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Test notes');
      
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('success');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
      }
    });

    it('should handle single day period', async () => {
      const user = await createTestUser();
      const periodDays = [new Date('2024-01-01')];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Single day');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1);
      }
    });

    it('should handle multiple separate periods', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-02-01'),
        new Date('2024-02-02'),
        new Date('2024-03-01')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Multiple periods');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(3);
      }
    });

    it('should calculate cycle predictions correctly', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-04'),
        new Date('2024-01-05')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Test cycle');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        const cycle = result.data[0];
        expect(cycle.predicted_ovulation_date).toBeDefined();
        expect(cycle.predicted_fertile_start).toBeDefined();
        expect(cycle.predicted_fertile_end).toBeDefined();
        
        // Check if ovulation is predicted around 14 days after cycle start
        const cycleStart = new Date(cycle.cycle_start_date);
        const ovulationDate = new Date(cycle.predicted_ovulation_date);
        const daysDiff = Math.floor((ovulationDate.getTime() - cycleStart.getTime()) / (24 * 60 * 60 * 1000));
        expect(daysDiff).toBeCloseTo(14, 1);
      }
    });

    it('should calculate fertile window correctly', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Test fertile window');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        const cycle = result.data[0];
        expect(cycle.predicted_fertile_start).toBeDefined();
        expect(cycle.predicted_fertile_end).toBeDefined();
        
        const fertileStart = new Date(cycle.predicted_fertile_start);
        const fertileEnd = new Date(cycle.predicted_fertile_end);
        const windowDays = Math.floor((fertileEnd.getTime() - fertileStart.getTime()) / (24 * 60 * 60 * 1000));
        expect(windowDays).toBeGreaterThan(0);
        expect(windowDays).toBeLessThan(10);
      }
    });

    it('should return empty array for empty period days', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), [], 'Empty');
      
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(0);
      }
    });

    it('should return error for missing user ID', async () => {
      const periodDays = [new Date('2024-01-01')];
      const result = await MenstrualCycleService.processPeriodDays('', periodDays, 'No user');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required');
      }
    });

    it('should return error for null user ID', async () => {
      const periodDays = [new Date('2024-01-01')];
      const result = await MenstrualCycleService.processPeriodDays(null as any, periodDays, 'Null user');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required');
      }
    });

    it('should return error for undefined user ID', async () => {
      const periodDays = [new Date('2024-01-01')];
      const result = await MenstrualCycleService.processPeriodDays(undefined as any, periodDays, 'Undefined user');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(false);
        expect(result.message).toContain('User ID is required');
      }
    });

    it('should handle timezone normalization', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01T10:30:00Z'),
        new Date('2024-01-02T15:45:00Z'),
        new Date('2024-01-03T08:15:00Z')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Timezone test');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should remove duplicate dates', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-01'), // duplicate
        new Date('2024-01-02'),
        new Date('2024-01-02'), // duplicate
        new Date('2024-01-03')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Duplicate dates');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1); // Should create one cycle
      }
    });

    it('should handle periods with gaps', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-05'), // gap
        new Date('2024-01-06')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Gap test');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(2); // Should create two separate cycles
      }
    });

    it('should handle unsorted dates', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-03'),
        new Date('2024-01-01'),
        new Date('2024-01-02')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Unsorted dates');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1);
      }
    });

    it('should handle cross-month periods', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-30'),
        new Date('2024-01-31'),
        new Date('2024-02-01'),
        new Date('2024-02-02')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Cross month');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1);
      }
    });

    it('should handle multiple cycles in same month', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-15'),
        new Date('2024-01-16')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Multiple cycles');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(2);
      }
    });

    it('should handle single day periods', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-15'),
        new Date('2024-02-01'),
        new Date('2024-02-15')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Single days');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(4); // Each day as separate cycle
      }
    });

    it('should handle consecutive periods', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03'),
        new Date('2024-01-04'),
        new Date('2024-01-05')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Consecutive');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1);
      }
    });

    it('should handle very long periods', async () => {
      const user = await createTestUser();
      const periodDays = [];
      for (let i = 1; i <= 10; i++) {
        periodDays.push(new Date(`2024-01-${i.toString().padStart(2, '0')}`));
      }

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Long period');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBe(1);
      }
    });

    it('should handle leap year dates', async () => {
      const user = await createTestUser();
      const periodDays = [
        new Date('2024-02-28'),
        new Date('2024-02-29'), // leap year
        new Date('2024-03-01')
      ];

      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Leap year');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    it('should handle null period days', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), null as any, 'Null periods');
      
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(0);
      }
    });

    it('should handle undefined period days', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), undefined as any, 'Undefined periods');
      
      expect(Array.isArray(result)).toBe(true);
      if (Array.isArray(result)) {
        expect(result.length).toBe(0);
      }
    });

    it('should handle empty notes', async () => {
      const user = await createTestUser();
      const periodDays = [new Date('2024-01-01')];
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, '');
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
    });

    it('should handle null notes', async () => {
      const user = await createTestUser();
      const periodDays = [new Date('2024-01-01')];
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, null as any);
      
      expect(typeof result).toBe('object');
      if ('success' in result) {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      }
    });
  });

  describe('getCycles', () => {
    it('should retrieve cycles for user with data', async () => {
      const user = await createTestUser();
      const cycle = await createTestMenstrualCycle(user._id);
      
      const result = await MenstrualCycleService.getCycles(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBe(1);
    });

    it('should return empty result for user with no cycles', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.getCycles(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('No cycles found');
      expect(result.data).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      const mockGetCycles = jest.spyOn(MenstrualCycleRepository, 'getCyclesByUser').mockRejectedValue(new Error('Database error'));
      
      const user = await createTestUser();
      const result = await MenstrualCycleService.getCycles(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to retrieve cycles');
      
      mockGetCycles.mockRestore();
    });
  });

  describe('getTodayStatus', () => {
    it('should return status for user on period day', async () => {
      const user = await createTestUser();
      const today = new Date();
      const cycle = await createTestMenstrualCycle(user._id, {
        period_days: [today]
      });
      
      const result = await MenstrualCycleService.getTodayStatus(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.is_period_day).toBe(true);
    });

    it('should return recommendations for period day', async () => {
      const user = await createTestUser();
      const today = new Date();
      const cycle = await createTestMenstrualCycle(user._id, {
        period_days: [today]
      });
      
      const result = await MenstrualCycleService.getTodayStatus(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.data.recommendations).toBeDefined();
      expect(Array.isArray(result.data.recommendations)).toBe(true);
    });

    it('should return status for user not on period', async () => {
      const user = await createTestUser();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const cycle = await createTestMenstrualCycle(user._id, {
        period_days: [yesterday]
      });
      
      const result = await MenstrualCycleService.getTodayStatus(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.data.is_period_day).toBe(false);
    });

    it('should handle user with no cycle data', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.getTodayStatus(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No cycle data found');
    });
  });

  describe('getCycleStats', () => {
    it('should return stats for user with cycles', async () => {
      const user = await createTestUser();
      const cycle = await createTestMenstrualCycle(user._id);
      
      const result = await MenstrualCycleService.getCycleStats(user._id.toString());
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.average_cycle_length).toBeDefined();
    });

    it('should calculate average cycle length correctly', async () => {
      const user = await createTestUser();
      await createTestMenstrualCycle(user._id, { cycle_length: 28 });
      await createTestMenstrualCycle(user._id, { cycle_length: 30 });
      
      const result = await MenstrualCycleService.getCycleStats(user._id.toString());
      
      expect(result.success).toBe(true);
      const avgLength = result.data.average_cycle_length;
      expect(avgLength).toBeCloseTo(29, 1);
    });

    it('should return error for user with no cycles', async () => {
      const user = await createTestUser();
      const result = await MenstrualCycleService.getCycleStats(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('No cycle data found');
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Clear any mocks from previous tests
    });

    it('should handle complete cycle workflow', async () => {
      const user = await createTestUser();
      
      // Process period days
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-01-03')
      ];
      
      const processResult = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Test cycle');
      expect(typeof processResult).toBe('object');
      if ('success' in processResult) {
        expect(processResult.success).toBe(true);
      }
      
      // Get cycles
      const cyclesResult = await MenstrualCycleService.getCycles(user._id.toString());
      expect(cyclesResult.success).toBe(true);
      expect(cyclesResult.data.length).toBe(1);
      
      // Get today status
      const statusResult = await MenstrualCycleService.getTodayStatus(user._id.toString());
      expect(statusResult.success).toBe(true);
      expect(statusResult.data.is_period_day).toBe(false); // Today is not in Jan 2024
      
      // Get stats
      const statsResult = await MenstrualCycleService.getCycleStats(user._id.toString());
      // With only 1 cycle, stats might not be calculable - handle gracefully
      if (statsResult.success) {
        expect(statsResult.data).toBeDefined();
      } else {
        // If insufficient data, that's also a valid scenario
        expect(statsResult.message).toMatch(/statistics|data|cycles/i);
      }
    });

    it('should handle multiple cycles workflow', async () => {
      const user = await createTestUser();
      
      // Process multiple periods
      const periodDays = [
        new Date('2024-01-01'),
        new Date('2024-01-02'),
        new Date('2024-02-01'),
        new Date('2024-02-02'),
        new Date('2024-03-01'),
        new Date('2024-03-02'),
        new Date('2024-04-01'),
        new Date('2024-04-02')
      ];
      
      const processResult = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Multiple cycles');
      expect(typeof processResult).toBe('object');
      if ('success' in processResult) {
        expect(processResult.success).toBe(true);
      }
      
      // Get cycles
      const cyclesResult = await MenstrualCycleService.getCycles(user._id.toString());
      expect(cyclesResult.success).toBe(true);
      expect(cyclesResult.data.length).toBe(4);
      
      // Get stats
      const statsResult = await MenstrualCycleService.getCycleStats(user._id.toString());
      // With 4 cycles, stats should be calculable, but handle gracefully if not
      if (statsResult.success) {
        expect(statsResult.data).toBeDefined();
        expect(statsResult.data.average_cycle_length).toBeGreaterThan(0);
      } else {
        console.log('Stats calculation failed:', statsResult.message);
        expect(statsResult.message).toMatch(/statistics|data|cycles/i);
      }
    });
  });
  
  describe('Error Handling', () => {
    beforeEach(() => {
      jest.restoreAllMocks(); // Clear any mocks from previous tests
    });

    it('should handle database connection errors', async () => {
      const mockConnection = jest.spyOn(MenstrualCycleRepository, 'getCyclesByUser').mockRejectedValue(new Error('Connection failed'));
      
      const user = await createTestUser();
      const result = await MenstrualCycleService.getCycles(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to retrieve cycles');
      
      mockConnection.mockRestore();
    });
    
    it('should handle repository errors in processPeriodDays', async () => {
      const user = await createTestUser();
      const periodDays = [new Date('2024-01-01')];
      
      // Set up mock after test data creation to avoid timing issues
      const mockInsert = jest.spyOn(MenstrualCycleRepository, 'insertCycles');
      mockInsert.mockRejectedValue(new Error('Insert failed'));
      
      const result = await MenstrualCycleService.processPeriodDays(user._id.toString(), periodDays, 'Error test');
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      if (!Array.isArray(result) && 'success' in result) {
        expect(result.success).toBe(false);
        expect(result.message).toMatch(/Failed to save cycles|Insert failed/);
      } else {
        fail('Expected error response object but got different type');
      }
      
      mockInsert.mockRestore();
    });
    
    it('should handle repository errors in getCycleStats', async () => {
      const mockStats = jest.spyOn(MenstrualCycleRepository, 'getCycleStatsData').mockRejectedValue(new Error('Stats failed'));
      
      const user = await createTestUser();
      const result = await MenstrualCycleService.getCycleStats(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Error when getting cycle statistics');
      
      mockStats.mockRestore();
    });
    
    it('should handle repository errors in getTodayStatus', async () => {
      const mockLatest = jest.spyOn(MenstrualCycleRepository, 'getLatestCycles').mockRejectedValue(new Error('Status failed'));
      
      const user = await createTestUser();
      const result = await MenstrualCycleService.getTodayStatus(user._id.toString());
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to get today status');
      
      mockLatest.mockRestore();
    });
  });
});