import { AppointmentHistoryService } from '../../services/appointmentHistoryService';

describe('AppointmentHistoryService', () => {
  beforeEach(async () => {
    // Clear history before each test
    await AppointmentHistoryService.clearHistory();
  });

  describe('logAction', () => {
    it('should log action successfully with valid parameters', async () => {
      const result = await AppointmentHistoryService.logAction(
        'appointment-123',
        'created',
        'user-456',
        { note: 'Initial appointment creation' }
      );

      expect(result.success).toBe(true);
      expect(result.historyId).toBeDefined();
      expect(result.historyId).toMatch(/^hist_\d+_[a-z0-9]+$/);
    });

    it('should log action without details', async () => {
      const result = await AppointmentHistoryService.logAction(
        'appointment-123',
        'updated',
        'user-456'
      );

      expect(result.success).toBe(true);
      expect(result.historyId).toBeDefined();
    });

    it('should return error for missing appointmentId', async () => {
      const result = await AppointmentHistoryService.logAction(
        '',
        'created',
        'user-456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: appointmentId, action, or userId');
    });

    it('should return error for missing action', async () => {
      const result = await AppointmentHistoryService.logAction(
        'appointment-123',
        null as any,
        'user-456'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: appointmentId, action, or userId');
    });

    it('should return error for missing userId', async () => {
      const result = await AppointmentHistoryService.logAction(
        'appointment-123',
        'created',
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: appointmentId, action, or userId');
    });

    it('should handle all action types', async () => {
      const actions = ['created', 'updated', 'cancelled', 'completed', 'rescheduled'] as const;
      
      for (const action of actions) {
        const result = await AppointmentHistoryService.logAction(
          `appointment-${action}`,
          action,
          'user-456'
        );
        
        expect(result.success).toBe(true);
      }
    });

    it('should generate unique history IDs', async () => {
      const result1 = await AppointmentHistoryService.logAction(
        'appointment-1',
        'created',
        'user-1'
      );
      
      const result2 = await AppointmentHistoryService.logAction(
        'appointment-2',
        'created',
        'user-2'
      );

      expect(result1.historyId).not.toBe(result2.historyId);
    });
  });

  describe('getAppointmentHistory', () => {
    beforeEach(async () => {
      // Set up test data
      await AppointmentHistoryService.logAction('appointment-123', 'created', 'user-1');
      await AppointmentHistoryService.logAction('appointment-123', 'updated', 'user-1');
      await AppointmentHistoryService.logAction('appointment-456', 'created', 'user-2');
    });

    it('should get appointment history successfully', async () => {
      const result = await AppointmentHistoryService.getAppointmentHistory('appointment-123');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(result.history![0].action).toBe('updated'); // Most recent first
      expect(result.history![1].action).toBe('created');
      expect(result.history!.every(entry => entry.appointmentId === 'appointment-123')).toBe(true);
    });

    it('should return empty history for non-existent appointment', async () => {
      const result = await AppointmentHistoryService.getAppointmentHistory('non-existent');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(0);
    });

    it('should return error for missing appointment ID', async () => {
      const result = await AppointmentHistoryService.getAppointmentHistory('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Appointment ID is required');
    });

    it('should sort history by timestamp descending', async () => {
      // Add more entries with slight delays
      await new Promise(resolve => setTimeout(resolve, 10));
      await AppointmentHistoryService.logAction('appointment-123', 'cancelled', 'user-1');
      
      const result = await AppointmentHistoryService.getAppointmentHistory('appointment-123');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(3);
      expect(result.history![0].action).toBe('cancelled'); // Most recent
      expect(result.history![1].action).toBe('updated');
      expect(result.history![2].action).toBe('created'); // Oldest
    });
  });

  describe('getUserHistory', () => {
    beforeEach(async () => {
      // Set up test data
      const baseTime = Date.now();
      
      await AppointmentHistoryService.logAction('appointment-1', 'created', 'user-123');
      await AppointmentHistoryService.logAction('appointment-2', 'updated', 'user-123');
      await AppointmentHistoryService.logAction('appointment-3', 'cancelled', 'user-123');
      await AppointmentHistoryService.logAction('appointment-4', 'created', 'user-456');
    });

    it('should get user history successfully', async () => {
      const result = await AppointmentHistoryService.getUserHistory('user-123');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.history!.every(entry => entry.userId === 'user-123')).toBe(true);
    });

    it('should return error for missing user ID', async () => {
      const result = await AppointmentHistoryService.getUserHistory('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should filter by action', async () => {
      const result = await AppointmentHistoryService.getUserHistory('user-123', {
        action: 'created'
      });

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(1);
      expect(result.history![0].action).toBe('created');
    });

    it('should apply pagination with limit', async () => {
      const result = await AppointmentHistoryService.getUserHistory('user-123', {
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should apply pagination with offset', async () => {
      const result = await AppointmentHistoryService.getUserHistory('user-123', {
        offset: 1,
        limit: 2
      });

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(result.total).toBe(3);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 10000);
      
      // Add a future entry
      await AppointmentHistoryService.logAction('appointment-future', 'completed', 'user-123');
      
      const result = await AppointmentHistoryService.getUserHistory('user-123', {
        dateFrom: now,
        dateTo: future
      });

      expect(result.success).toBe(true);
      expect(result.history!.length).toBeGreaterThan(0);
    });

    it('should return empty history for non-existent user', async () => {
      const result = await AppointmentHistoryService.getUserHistory('non-existent');

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getHistoryStats', () => {
    beforeEach(async () => {
      // Set up test data
      await AppointmentHistoryService.logAction('appointment-1', 'created', 'user-1');
      await AppointmentHistoryService.logAction('appointment-2', 'created', 'user-2');
      await AppointmentHistoryService.logAction('appointment-3', 'updated', 'user-1');
      await AppointmentHistoryService.logAction('appointment-4', 'cancelled', 'user-2');
      await AppointmentHistoryService.logAction('appointment-5', 'completed', 'user-1');
    });

    it('should get history stats successfully', async () => {
      const result = await AppointmentHistoryService.getHistoryStats();

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats!.totalActions).toBe(5);
      expect(result.stats!.actionBreakdown).toEqual({
        created: 2,
        updated: 1,
        cancelled: 1,
        completed: 1
      });
      expect(result.stats!.dateRange.from).toBeDefined();
      expect(result.stats!.dateRange.to).toBeDefined();
    });

    it('should filter stats by date range', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 10000);
      
      const result = await AppointmentHistoryService.getHistoryStats(now, future);

      expect(result.success).toBe(true);
      expect(result.stats!.totalActions).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty history', async () => {
      await AppointmentHistoryService.clearHistory();
      
      const result = await AppointmentHistoryService.getHistoryStats();

      expect(result.success).toBe(true);
      expect(result.stats!.totalActions).toBe(0);
      expect(result.stats!.actionBreakdown).toEqual({});
    });
  });

  describe('clearHistory', () => {
    it('should clear all history successfully', async () => {
      // Add some entries
      await AppointmentHistoryService.logAction('appointment-1', 'created', 'user-1');
      await AppointmentHistoryService.logAction('appointment-2', 'updated', 'user-2');
      
      const result = await AppointmentHistoryService.clearHistory();

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(2);
      
      // Verify history is empty
      const statsResult = await AppointmentHistoryService.getHistoryStats();
      expect(statsResult.stats!.totalActions).toBe(0);
    });

    it('should handle clearing empty history', async () => {
      const result = await AppointmentHistoryService.clearHistory();

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(0);
    });
  });

  describe('deleteHistoryEntry', () => {
    let historyId: string;

    beforeEach(async () => {
      const result = await AppointmentHistoryService.logAction('appointment-1', 'created', 'user-1');
      historyId = result.historyId!;
    });

    it('should delete history entry successfully', async () => {
      const result = await AppointmentHistoryService.deleteHistoryEntry(historyId);

      expect(result.success).toBe(true);
      
      // Verify entry is deleted
      const historyResult = await AppointmentHistoryService.getAppointmentHistory('appointment-1');
      expect(historyResult.history).toHaveLength(0);
    });

    it('should return error for missing history ID', async () => {
      const result = await AppointmentHistoryService.deleteHistoryEntry('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('History ID is required');
    });

    it('should return error for non-existent history entry', async () => {
      const result = await AppointmentHistoryService.deleteHistoryEntry('non-existent');

      expect(result.success).toBe(false);
      expect(result.error).toBe('History entry not found');
    });
  });

  describe('getActionDisplayName', () => {
    it('should return correct display names for all actions', () => {
      expect(AppointmentHistoryService.getActionDisplayName('created')).toBe('Appointment Created');
      expect(AppointmentHistoryService.getActionDisplayName('updated')).toBe('Appointment Updated');
      expect(AppointmentHistoryService.getActionDisplayName('cancelled')).toBe('Appointment Cancelled');
      expect(AppointmentHistoryService.getActionDisplayName('completed')).toBe('Appointment Completed');
      expect(AppointmentHistoryService.getActionDisplayName('rescheduled')).toBe('Appointment Rescheduled');
    });

    it('should return the action itself for unknown actions', () => {
      expect(AppointmentHistoryService.getActionDisplayName('unknown' as any)).toBe('unknown');
    });
  });
});