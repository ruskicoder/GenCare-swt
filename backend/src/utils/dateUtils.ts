export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeZoneInfo {
  timezone: string;
  offset: number;
  abbreviation: string;
}

export class DateUtils {
  /**
   * Formats a date to ISO string
   */
  static toISOString(date: Date): string {
    return date.toISOString();
  }

  /**
   * Formats a date to a readable string
   */
  static formatDate(date: Date, format: 'short' | 'long' | 'medium' = 'medium'): string {
    let options: Intl.DateTimeFormatOptions;
    
    switch (format) {
      case 'short':
        options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        break;
      case 'long':
        options = { year: 'numeric', month: 'long', day: '2-digit', weekday: 'long' };
        break;
      case 'medium':
      default:
        options = { year: 'numeric', month: 'short', day: '2-digit' };
        break;
    }

    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Formats time to readable string
   */
  static formatTime(date: Date, use24Hour: boolean = false): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !use24Hour
    };

    return date.toLocaleTimeString('en-US', options);
  }

  /**
   * Adds days to a date
   */
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Adds months to a date
   */
  static addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  /**
   * Adds years to a date
   */
  static addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  /**
   * Gets difference between two dates in days
   */
  static getDifferenceInDays(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((date1.getTime() - date2.getTime()) / oneDay);
  }

  /**
   * Gets difference between two dates in hours
   */
  static getDifferenceInHours(date1: Date, date2: Date): number {
    const oneHour = 60 * 60 * 1000;
    return Math.round((date1.getTime() - date2.getTime()) / oneHour);
  }

  /**
   * Gets difference between two dates in minutes
   */
  static getDifferenceInMinutes(date1: Date, date2: Date): number {
    const oneMinute = 60 * 1000;
    return Math.round((date1.getTime() - date2.getTime()) / oneMinute);
  }

  /**
   * Checks if a date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return this.isSameDay(date, today);
  }

  /**
   * Checks if a date is yesterday
   */
  static isYesterday(date: Date): boolean {
    const yesterday = this.addDays(new Date(), -1);
    return this.isSameDay(date, yesterday);
  }

  /**
   * Checks if a date is tomorrow
   */
  static isTomorrow(date: Date): boolean {
    const tomorrow = this.addDays(new Date(), 1);
    return this.isSameDay(date, tomorrow);
  }

  /**
   * Checks if two dates are the same day
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Checks if two dates are in the same month
   */
  static isSameMonth(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth();
  }

  /**
   * Checks if two dates are in the same year
   */
  static isSameYear(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Gets the start of day for a date
   */
  static startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
   * Gets the end of day for a date
   */
  static endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  /**
   * Gets the start of week for a date
   */
  static startOfWeek(date: Date, startOnMonday: boolean = false): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = startOnMonday ? (day === 0 ? 6 : day - 1) : day;
    result.setDate(result.getDate() - diff);
    return this.startOfDay(result);
  }

  /**
   * Gets the end of week for a date
   */
  static endOfWeek(date: Date, startOnMonday: boolean = false): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = startOnMonday ? (day === 0 ? 0 : 7 - day) : 6 - day;
    result.setDate(result.getDate() + diff);
    return this.endOfDay(result);
  }

  /**
   * Gets the start of month for a date
   */
  static startOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    return this.startOfDay(result);
  }

  /**
   * Gets the end of month for a date
   */
  static endOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    return this.endOfDay(result);
  }

  /**
   * Gets the start of year for a date
   */
  static startOfYear(date: Date): Date {
    const result = new Date(date);
    result.setMonth(0, 1);
    return this.startOfDay(result);
  }

  /**
   * Gets the end of year for a date
   */
  static endOfYear(date: Date): Date {
    const result = new Date(date);
    result.setMonth(11, 31);
    return this.endOfDay(result);
  }

  /**
   * Checks if a date is in the past
   */
  static isPast(date: Date): boolean {
    return date < new Date();
  }

  /**
   * Checks if a date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > new Date();
  }

  /**
   * Checks if a date is within a range
   */
  static isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  /**
   * Gets an array of dates between two dates
   */
  static getDateRange(start: Date, end: Date): Date[] {
    const dates: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return dates;
  }

  /**
   * Gets the age from a birth date
   */
  static getAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Checks if a year is a leap year
   */
  static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  /**
   * Gets the number of days in a month
   */
  static getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  /**
   * Gets the day of year (1-365/366)
   */
  static getDayOfYear(date: Date): number {
    const start = this.startOfYear(date);
    return this.getDifferenceInDays(date, start) + 1;
  }

  /**
   * Gets the week number of the year
   */
  static getWeekNumber(date: Date): number {
    const start = this.startOfYear(date);
    const startOfFirstWeek = this.startOfWeek(start, true);
    const weeks = Math.floor(this.getDifferenceInDays(date, startOfFirstWeek) / 7) + 1;
    return weeks;
  }

  /**
   * Parses a date string into a Date object
   */
  static parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  }

  /**
   * Gets relative time description
   */
  static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffInMinutes = this.getDifferenceInMinutes(now, date);

    if (Math.abs(diffInMinutes) < 1) {
      return 'just now';
    } else if (Math.abs(diffInMinutes) < 60) {
      return diffInMinutes > 0 
        ? `${diffInMinutes} minutes ago`
        : `in ${Math.abs(diffInMinutes)} minutes`;
    }

    const diffInHours = this.getDifferenceInHours(now, date);
    if (Math.abs(diffInHours) < 24) {
      return diffInHours > 0
        ? `${diffInHours} hours ago`
        : `in ${Math.abs(diffInHours)} hours`;
    }

    const diffInDays = this.getDifferenceInDays(now, date);
    if (Math.abs(diffInDays) < 7) {
      return diffInDays > 0
        ? `${diffInDays} days ago`
        : `in ${Math.abs(diffInDays)} days`;
    }

    if (Math.abs(diffInDays) < 30) {
      const weeks = Math.floor(Math.abs(diffInDays) / 7);
      return diffInDays > 0
        ? `${weeks} weeks ago`
        : `in ${weeks} weeks`;
    }

    return this.formatDate(date);
  }

  /**
   * Creates a date range object
   */
  static createDateRange(start: Date, end: Date): DateRange {
    if (start > end) {
      throw new Error('Start date must be before end date');
    }
    return { start, end };
  }

  /**
   * Validates if a date is valid
   */
  static isValidDate(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}