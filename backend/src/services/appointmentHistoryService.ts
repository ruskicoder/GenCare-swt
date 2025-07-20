interface AppointmentHistory {
  id: string;
  appointmentId: string;
  action: 'created' | 'updated' | 'cancelled' | 'completed' | 'rescheduled';
  timestamp: Date;
  userId: string;
  details?: any;
}

interface HistoryStats {
  totalActions: number;
  actionBreakdown: { [key: string]: number };
  dateRange: { from: Date; to: Date };
}

export class AppointmentHistoryService {
  private static history: AppointmentHistory[] = [];

  public static async logAction(
    appointmentId: string,
    action: AppointmentHistory['action'],
    userId: string,
    details?: any
  ): Promise<{ success: boolean; historyId?: string; error?: string }> {
    try {
      if (!appointmentId || !action || !userId) {
        return {
          success: false,
          error: 'Missing required parameters: appointmentId, action, or userId'
        };
      }

      const historyEntry: AppointmentHistory = {
        id: this.generateHistoryId(),
        appointmentId,
        action,
        timestamp: new Date(),
        userId,
        details
      };

      this.history.push(historyEntry);

      return {
        success: true,
        historyId: historyEntry.id
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to log action: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async getAppointmentHistory(
    appointmentId: string
  ): Promise<{ success: boolean; history?: AppointmentHistory[]; error?: string }> {
    try {
      if (!appointmentId) {
        return {
          success: false,
          error: 'Appointment ID is required'
        };
      }

      const appointmentHistory = this.history
        .filter(entry => entry.appointmentId === appointmentId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        success: true,
        history: appointmentHistory
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get appointment history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async getUserHistory(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      action?: AppointmentHistory['action'];
      dateFrom?: Date;
      dateTo?: Date;
    }
  ): Promise<{ 
    success: boolean; 
    history?: AppointmentHistory[]; 
    total?: number;
    error?: string 
  }> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'User ID is required'
        };
      }

      let userHistory = this.history.filter(entry => entry.userId === userId);

      // Apply filters
      if (options?.action) {
        userHistory = userHistory.filter(entry => entry.action === options.action);
      }

      if (options?.dateFrom) {
        userHistory = userHistory.filter(entry => entry.timestamp >= options.dateFrom!);
      }

      if (options?.dateTo) {
        userHistory = userHistory.filter(entry => entry.timestamp <= options.dateTo!);
      }

      // Sort by timestamp descending
      userHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const total = userHistory.length;
      
      // Apply pagination
      if (options?.offset) {
        userHistory = userHistory.slice(options.offset);
      }
      
      if (options?.limit) {
        userHistory = userHistory.slice(0, options.limit);
      }

      return {
        success: true,
        history: userHistory,
        total
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get user history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async getHistoryStats(
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<{ success: boolean; stats?: HistoryStats; error?: string }> {
    try {
      let relevantHistory = this.history;

      // Apply date filters
      if (dateFrom) {
        relevantHistory = relevantHistory.filter(entry => entry.timestamp >= dateFrom);
      }

      if (dateTo) {
        relevantHistory = relevantHistory.filter(entry => entry.timestamp <= dateTo);
      }

      const actionBreakdown: { [key: string]: number } = {};
      relevantHistory.forEach(entry => {
        actionBreakdown[entry.action] = (actionBreakdown[entry.action] || 0) + 1;
      });

      const timestamps = relevantHistory.map(entry => entry.timestamp);
      const minDate = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(d => d.getTime()))) : new Date();
      const maxDate = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(d => d.getTime()))) : new Date();

      const stats: HistoryStats = {
        totalActions: relevantHistory.length,
        actionBreakdown,
        dateRange: {
          from: minDate,
          to: maxDate
        }
      };

      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get history stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async clearHistory(): Promise<{ success: boolean; cleared?: number; error?: string }> {
    try {
      const cleared = this.history.length;
      this.history = [];

      return {
        success: true,
        cleared
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to clear history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static async deleteHistoryEntry(
    historyId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!historyId) {
        return {
          success: false,
          error: 'History ID is required'
        };
      }

      const initialLength = this.history.length;
      this.history = this.history.filter(entry => entry.id !== historyId);

      if (this.history.length === initialLength) {
        return {
          success: false,
          error: 'History entry not found'
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete history entry: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  public static getActionDisplayName(action: AppointmentHistory['action']): string {
    const displayNames = {
      created: 'Appointment Created',
      updated: 'Appointment Updated',
      cancelled: 'Appointment Cancelled',
      completed: 'Appointment Completed',
      rescheduled: 'Appointment Rescheduled'
    };

    return displayNames[action] || action;
  }

  private static generateHistoryId(): string {
    return `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}