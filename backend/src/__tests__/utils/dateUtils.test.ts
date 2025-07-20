import { DateUtils } from '../../utils/dateUtils';

describe('DateUtils', () => {
  const testDate = new Date('2023-06-15T14:30:00.000Z');
  const testDate2 = new Date('2023-06-20T10:00:00.000Z');

  describe('toISOString', () => {
    it('should convert date to ISO string', () => {
      const result = DateUtils.toISOString(testDate);
      expect(result).toBe('2023-06-15T14:30:00.000Z');
    });
  });

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const result = DateUtils.formatDate(testDate, 'short');
      expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should format date in medium format (default)', () => {
      const result = DateUtils.formatDate(testDate);
      expect(result).toContain('Jun');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });

    it('should format date in long format', () => {
      const result = DateUtils.formatDate(testDate, 'long');
      expect(result).toContain('Thursday');
      expect(result).toContain('June');
      expect(result).toContain('15');
      expect(result).toContain('2023');
    });
  });

  describe('formatTime', () => {
    it('should format time in 12-hour format by default', () => {
      const result = DateUtils.formatTime(testDate);
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should format time in 24-hour format', () => {
      const result = DateUtils.formatTime(testDate, true);
      expect(result).toMatch(/\d{2}:\d{2}/);
      expect(result).not.toMatch(/(AM|PM)/i);
    });
  });

  describe('addDays', () => {
    it('should add positive days', () => {
      const result = DateUtils.addDays(testDate, 5);
      expect(result.getDate()).toBe(20);
    });

    it('should subtract days with negative input', () => {
      const result = DateUtils.addDays(testDate, -5);
      expect(result.getDate()).toBe(10);
    });

    it('should handle month rollover', () => {
      const endOfMonth = new Date('2023-06-30');
      const result = DateUtils.addDays(endOfMonth, 1);
      expect(result.getMonth()).toBe(6); // July (0-indexed)
      expect(result.getDate()).toBe(1);
    });
  });

  describe('addMonths', () => {
    it('should add positive months', () => {
      const result = DateUtils.addMonths(testDate, 3);
      expect(result.getMonth()).toBe(8); // September (0-indexed)
    });

    it('should subtract months with negative input', () => {
      const result = DateUtils.addMonths(testDate, -2);
      expect(result.getMonth()).toBe(3); // April (0-indexed)
    });

    it('should handle year rollover', () => {
      const result = DateUtils.addMonths(testDate, 8);
      expect(result.getFullYear()).toBe(2024);
    });
  });

  describe('addYears', () => {
    it('should add positive years', () => {
      const result = DateUtils.addYears(testDate, 2);
      expect(result.getFullYear()).toBe(2025);
    });

    it('should subtract years with negative input', () => {
      const result = DateUtils.addYears(testDate, -1);
      expect(result.getFullYear()).toBe(2022);
    });
  });

  describe('getDifferenceInDays', () => {
    it('should calculate positive difference', () => {
      const result = DateUtils.getDifferenceInDays(testDate2, testDate);
      expect(result).toBe(5);
    });

    it('should calculate negative difference', () => {
      const result = DateUtils.getDifferenceInDays(testDate, testDate2);
      expect(result).toBe(-5);
    });

    it('should return 0 for same dates', () => {
      const result = DateUtils.getDifferenceInDays(testDate, testDate);
      expect(result).toBe(0);
    });
  });

  describe('getDifferenceInHours', () => {
    it('should calculate difference in hours', () => {
      const date1 = new Date('2023-06-15T14:00:00.000Z');
      const date2 = new Date('2023-06-15T18:00:00.000Z');
      const result = DateUtils.getDifferenceInHours(date2, date1);
      expect(result).toBe(4);
    });
  });

  describe('getDifferenceInMinutes', () => {
    it('should calculate difference in minutes', () => {
      const date1 = new Date('2023-06-15T14:00:00.000Z');
      const date2 = new Date('2023-06-15T14:30:00.000Z');
      const result = DateUtils.getDifferenceInMinutes(date2, date1);
      expect(result).toBe(30);
    });
  });

  describe('date comparison methods', () => {
    beforeEach(() => {
      // Mock current date to a known value
      jest.useFakeTimers();
      jest.setSystemTime(testDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should identify today correctly', () => {
      expect(DateUtils.isToday(testDate)).toBe(true);
      expect(DateUtils.isToday(testDate2)).toBe(false);
    });

    it('should identify yesterday correctly', () => {
      const yesterday = DateUtils.addDays(testDate, -1);
      expect(DateUtils.isYesterday(yesterday)).toBe(true);
      expect(DateUtils.isYesterday(testDate)).toBe(false);
    });

    it('should identify tomorrow correctly', () => {
      const tomorrow = DateUtils.addDays(testDate, 1);
      expect(DateUtils.isTomorrow(tomorrow)).toBe(true);
      expect(DateUtils.isTomorrow(testDate)).toBe(false);
    });
  });

  describe('isSameDay', () => {
    it('should identify same day correctly', () => {
      const sameDay = new Date('2023-06-15T22:00:00.000Z');
      expect(DateUtils.isSameDay(testDate, sameDay)).toBe(true);
      expect(DateUtils.isSameDay(testDate, testDate2)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    it('should identify same month correctly', () => {
      const sameMonth = new Date('2023-06-01');
      expect(DateUtils.isSameMonth(testDate, sameMonth)).toBe(true);
      
      const differentMonth = new Date('2023-07-15');
      expect(DateUtils.isSameMonth(testDate, differentMonth)).toBe(false);
    });
  });

  describe('isSameYear', () => {
    it('should identify same year correctly', () => {
      const sameYear = new Date('2023-12-31');
      expect(DateUtils.isSameYear(testDate, sameYear)).toBe(true);
      
      const differentYear = new Date('2024-06-15');
      expect(DateUtils.isSameYear(testDate, differentYear)).toBe(false);
    });
  });

  describe('start and end of periods', () => {
    it('should get start of day', () => {
      const result = DateUtils.startOfDay(testDate);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should get end of day', () => {
      const result = DateUtils.endOfDay(testDate);
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });

    it('should get start of week (Sunday start)', () => {
      const result = DateUtils.startOfWeek(testDate, false);
      expect(result.getDay()).toBe(0); // Sunday
    });

    it('should get start of week (Monday start)', () => {
      const result = DateUtils.startOfWeek(testDate, true);
      expect(result.getDay()).toBe(1); // Monday
    });

    it('should get end of week (Sunday start)', () => {
      const result = DateUtils.endOfWeek(testDate, false);
      expect(result.getDay()).toBe(6); // Saturday
    });

    it('should get end of week (Monday start)', () => {
      const result = DateUtils.endOfWeek(testDate, true);
      expect(result.getDay()).toBe(0); // Sunday
    });

    it('should get start of month', () => {
      const result = DateUtils.startOfMonth(testDate);
      expect(result.getDate()).toBe(1);
      expect(result.getHours()).toBe(0);
    });

    it('should get end of month', () => {
      const result = DateUtils.endOfMonth(testDate);
      expect(result.getDate()).toBe(30); // June has 30 days
      expect(result.getHours()).toBe(23);
    });

    it('should get start of year', () => {
      const result = DateUtils.startOfYear(testDate);
      expect(result.getMonth()).toBe(0); // January
      expect(result.getDate()).toBe(1);
    });

    it('should get end of year', () => {
      const result = DateUtils.endOfYear(testDate);
      expect(result.getMonth()).toBe(11); // December
      expect(result.getDate()).toBe(31);
    });
  });

  describe('time direction checks', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(testDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should identify past dates', () => {
      const pastDate = DateUtils.addDays(testDate, -1);
      expect(DateUtils.isPast(pastDate)).toBe(true);
      expect(DateUtils.isPast(testDate2)).toBe(false);
    });

    it('should identify future dates', () => {
      const pastDate = DateUtils.addDays(testDate, -1);
      const futureDate = DateUtils.addDays(testDate, 1);
      expect(DateUtils.isFuture(futureDate)).toBe(true);
      expect(DateUtils.isFuture(pastDate)).toBe(false);
    });
  });

  describe('isWithinRange', () => {
    it('should check if date is within range', () => {
      const start = new Date('2023-06-10');
      const end = new Date('2023-06-20');
      
      expect(DateUtils.isWithinRange(testDate, start, end)).toBe(true);
      expect(DateUtils.isWithinRange(new Date('2023-06-05'), start, end)).toBe(false);
      expect(DateUtils.isWithinRange(new Date('2023-06-25'), start, end)).toBe(false);
    });

    it('should include boundary dates', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-06-15');
      
      expect(DateUtils.isWithinRange(testDate, start, end)).toBe(true);
    });
  });

  describe('getDateRange', () => {
    it('should generate array of dates in range', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-06-17');
      const result = DateUtils.getDateRange(start, end);
      
      expect(result).toHaveLength(3);
      expect(result[0].getDate()).toBe(15);
      expect(result[1].getDate()).toBe(16);
      expect(result[2].getDate()).toBe(17);
    });

    it('should handle single day range', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-06-15');
      const result = DateUtils.getDateRange(start, end);
      
      expect(result).toHaveLength(1);
      expect(result[0].getDate()).toBe(15);
    });
  });

  describe('getAge', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-06-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should calculate age correctly', () => {
      const birthDate = new Date('1990-06-15');
      const age = DateUtils.getAge(birthDate);
      expect(age).toBe(33);
    });

    it('should handle birthday not yet reached this year', () => {
      const birthDate = new Date('1990-12-25');
      const age = DateUtils.getAge(birthDate);
      expect(age).toBe(32); // Birthday hasn't happened yet this year
    });

    it('should handle birthday already passed this year', () => {
      const birthDate = new Date('1990-01-01');
      const age = DateUtils.getAge(birthDate);
      expect(age).toBe(33); // Birthday already happened this year
    });
  });

  describe('isLeapYear', () => {
    it('should identify leap years correctly', () => {
      expect(DateUtils.isLeapYear(2000)).toBe(true); // Divisible by 400
      expect(DateUtils.isLeapYear(2004)).toBe(true); // Divisible by 4
      expect(DateUtils.isLeapYear(2100)).toBe(false); // Divisible by 100 but not 400
      expect(DateUtils.isLeapYear(2001)).toBe(false); // Not divisible by 4
    });
  });

  describe('getDaysInMonth', () => {
    it('should return correct days for each month', () => {
      expect(DateUtils.getDaysInMonth(2023, 0)).toBe(31); // January
      expect(DateUtils.getDaysInMonth(2023, 1)).toBe(28); // February (non-leap)
      expect(DateUtils.getDaysInMonth(2024, 1)).toBe(29); // February (leap)
      expect(DateUtils.getDaysInMonth(2023, 3)).toBe(30); // April
    });
  });

  describe('getDayOfYear', () => {
    it('should calculate day of year correctly', () => {
      const jan1 = new Date('2023-01-01');
      const dec31 = new Date('2023-12-31');
      
      expect(DateUtils.getDayOfYear(jan1)).toBe(1);
      expect(DateUtils.getDayOfYear(dec31)).toBe(365);
      expect(DateUtils.getDayOfYear(testDate)).toBe(166); // June 15th
    });
  });

  describe('getWeekNumber', () => {
    it('should calculate week number correctly', () => {
      const jan1 = new Date('2023-01-01');
      expect(DateUtils.getWeekNumber(jan1)).toBeGreaterThan(0);
      expect(DateUtils.getWeekNumber(testDate)).toBeGreaterThan(20);
    });
  });

  describe('parseDate', () => {
    it('should parse valid date strings', () => {
      const result = DateUtils.parseDate('2023-06-15');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2023);
    });

    it('should return null for invalid date strings', () => {
      expect(DateUtils.parseDate('invalid-date')).toBeNull();
      expect(DateUtils.parseDate('')).toBeNull();
    });

    it('should handle various date formats', () => {
      expect(DateUtils.parseDate('2023-06-15T14:30:00Z')).toBeInstanceOf(Date);
      expect(DateUtils.parseDate('June 15, 2023')).toBeInstanceOf(Date);
      expect(DateUtils.parseDate('06/15/2023')).toBeInstanceOf(Date);
    });
  });

  describe('getRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(testDate);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for very recent times', () => {
      const now = new Date(testDate);
      expect(DateUtils.getRelativeTime(now)).toBe('just now');
    });

    it('should return minutes for recent times', () => {
      const fiveMinutesAgo = new Date(testDate.getTime() - 5 * 60 * 1000);
      const fiveMinutesLater = new Date(testDate.getTime() + 5 * 60 * 1000);
      
      expect(DateUtils.getRelativeTime(fiveMinutesAgo)).toBe('5 minutes ago');
      expect(DateUtils.getRelativeTime(fiveMinutesLater)).toBe('in 5 minutes');
    });

    it('should return hours for times within 24 hours', () => {
      const twoHoursAgo = new Date(testDate.getTime() - 2 * 60 * 60 * 1000);
      const twoHoursLater = new Date(testDate.getTime() + 2 * 60 * 60 * 1000);
      
      expect(DateUtils.getRelativeTime(twoHoursAgo)).toBe('2 hours ago');
      expect(DateUtils.getRelativeTime(twoHoursLater)).toBe('in 2 hours');
    });

    it('should return days for times within a week', () => {
      const threeDaysAgo = DateUtils.addDays(testDate, -3);
      const threeDaysLater = DateUtils.addDays(testDate, 3);
      
      expect(DateUtils.getRelativeTime(threeDaysAgo)).toBe('3 days ago');
      expect(DateUtils.getRelativeTime(threeDaysLater)).toBe('in 3 days');
    });

    it('should return weeks for times within a month', () => {
      const twoWeeksAgo = DateUtils.addDays(testDate, -14);
      const twoWeeksLater = DateUtils.addDays(testDate, 14);
      
      expect(DateUtils.getRelativeTime(twoWeeksAgo)).toBe('2 weeks ago');
      expect(DateUtils.getRelativeTime(twoWeeksLater)).toBe('in 2 weeks');
    });

    it('should return formatted date for older times', () => {
      const longAgo = DateUtils.addDays(testDate, -60);
      const result = DateUtils.getRelativeTime(longAgo);
      expect(result).toContain('Apr'); // Should be a formatted date
    });
  });

  describe('createDateRange', () => {
    it('should create date range with valid dates', () => {
      const start = new Date('2023-06-15');
      const end = new Date('2023-06-20');
      const range = DateUtils.createDateRange(start, end);
      
      expect(range.start).toBe(start);
      expect(range.end).toBe(end);
    });

    it('should throw error if start is after end', () => {
      const start = new Date('2023-06-20');
      const end = new Date('2023-06-15');
      
      expect(() => DateUtils.createDateRange(start, end)).toThrow('Start date must be before end date');
    });

    it('should allow same start and end dates', () => {
      const date = new Date('2023-06-15');
      const range = DateUtils.createDateRange(date, date);
      
      expect(range.start).toBe(date);
      expect(range.end).toBe(date);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct Date objects', () => {
      expect(DateUtils.isValidDate(testDate)).toBe(true);
      expect(DateUtils.isValidDate(new Date())).toBe(true);
    });

    it('should reject invalid Date objects', () => {
      expect(DateUtils.isValidDate(new Date('invalid'))).toBe(false);
      expect(DateUtils.isValidDate('2023-06-15')).toBe(false);
      expect(DateUtils.isValidDate(null)).toBe(false);
      expect(DateUtils.isValidDate(undefined)).toBe(false);
      expect(DateUtils.isValidDate(123)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle month boundaries correctly', () => {
      const endOfFeb = new Date('2023-02-28');
      const nextDay = DateUtils.addDays(endOfFeb, 1);
      expect(nextDay.getMonth()).toBe(2); // March
      expect(nextDay.getDate()).toBe(1);
    });

    it('should handle year boundaries correctly', () => {
      const endOfYear = new Date('2023-12-31');
      const nextDay = DateUtils.addDays(endOfYear, 1);
      expect(nextDay.getFullYear()).toBe(2024);
      expect(nextDay.getMonth()).toBe(0); // January
      expect(nextDay.getDate()).toBe(1);
    });

    it('should handle leap year February correctly', () => {
      const feb28_2024 = new Date('2024-02-28');
      const nextDay = DateUtils.addDays(feb28_2024, 1);
      expect(nextDay.getDate()).toBe(29); // Leap year has Feb 29
    });

    it('should handle Sunday in week calculations', () => {
      const sunday = new Date('2023-06-18'); // A Sunday
      const startOfWeekSun = DateUtils.startOfWeek(sunday, false);
      const startOfWeekMon = DateUtils.startOfWeek(sunday, true);
      
      expect(startOfWeekSun.getDay()).toBe(0); // Sunday
      expect(startOfWeekMon.getDay()).toBe(1); // Monday
    });
  });
});