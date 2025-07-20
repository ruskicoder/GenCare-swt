import { GoogleMeetService } from '../../services/googleMeetService';

describe('GoogleMeetService', () => {
  const futureDate1 = new Date(Date.now() + 3600000); // 1 hour from now
  const futureDate2 = new Date(Date.now() + 7200000); // 2 hours from now

  describe('createMeeting', () => {
    it('should create meeting successfully with valid parameters', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        futureDate1,
        futureDate2,
        ['participant1@example.com']
      );

      expect(result.success).toBe(true);
      expect(result.meetingUrl).toBeDefined();
      expect(result.meetingId).toBeDefined();
      expect(result.meetingUrl).toMatch(/^https:\/\/meet\.google\.com\/[a-z-]+$/);
    });

    it('should create meeting without participants', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        futureDate1,
        futureDate2
      );

      expect(result.success).toBe(true);
      expect(result.meetingUrl).toBeDefined();
      expect(result.meetingId).toBeDefined();
    });

    it('should return error for missing title', async () => {
      const result = await GoogleMeetService.createMeeting(
        '',
        futureDate1,
        futureDate2
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: title, startTime, or endTime');
    });

    it('should return error for missing startTime', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        null as any,
        futureDate2
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: title, startTime, or endTime');
    });

    it('should return error for missing endTime', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        futureDate1,
        null as any
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing required parameters: title, startTime, or endTime');
    });

    it('should return error when start time is after end time', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        futureDate2,
        futureDate1
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time must be before end time');
    });

    it('should return error when start time equals end time', async () => {
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        futureDate1,
        futureDate1
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time must be before end time');
    });

    it('should return error for past start time', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const result = await GoogleMeetService.createMeeting(
        'Test Meeting',
        pastDate,
        futureDate1
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time cannot be in the past');
    });

    it('should generate unique meeting IDs', async () => {
      const result1 = await GoogleMeetService.createMeeting(
        'Meeting 1',
        futureDate1,
        futureDate2
      );
      
      const result2 = await GoogleMeetService.createMeeting(
        'Meeting 2',
        futureDate1,
        futureDate2
      );

      expect(result1.meetingId).not.toBe(result2.meetingId);
    });
  });

  describe('updateMeeting', () => {
    it('should update meeting successfully', async () => {
      const result = await GoogleMeetService.updateMeeting('test-meeting-id', {
        title: 'Updated Meeting',
        startTime: futureDate1,
        endTime: futureDate2
      });

      expect(result.success).toBe(true);
    });

    it('should return error for missing meeting ID', async () => {
      const result = await GoogleMeetService.updateMeeting('', {
        title: 'Updated Meeting'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Meeting ID is required');
    });

    it('should return error when updated start time is after end time', async () => {
      const result = await GoogleMeetService.updateMeeting('test-meeting-id', {
        startTime: futureDate2,
        endTime: futureDate1
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time must be before end time');
    });

    it('should return error for past start time in update', async () => {
      const pastDate = new Date(Date.now() - 3600000);
      const result = await GoogleMeetService.updateMeeting('test-meeting-id', {
        startTime: pastDate
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Start time cannot be in the past');
    });

    it('should update only title', async () => {
      const result = await GoogleMeetService.updateMeeting('test-meeting-id', {
        title: 'New Title'
      });

      expect(result.success).toBe(true);
    });

    it('should update participants', async () => {
      const result = await GoogleMeetService.updateMeeting('test-meeting-id', {
        participants: ['new@example.com', 'another@example.com']
      });

      expect(result.success).toBe(true);
    });
  });

  describe('deleteMeeting', () => {
    it('should delete meeting successfully', async () => {
      const result = await GoogleMeetService.deleteMeeting('test-meeting-id');

      expect(result.success).toBe(true);
    });

    it('should return error for missing meeting ID', async () => {
      const result = await GoogleMeetService.deleteMeeting('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Meeting ID is required');
    });
  });

  describe('getMeetingDetails', () => {
    it('should get meeting details successfully', async () => {
      const result = await GoogleMeetService.getMeetingDetails('test-meeting-id');

      expect(result.success).toBe(true);
      expect(result.meeting).toBeDefined();
      expect(result.meeting?.id).toBe('test-meeting-id');
      expect(result.meeting?.title).toBe('Sample Meeting');
      expect(result.meeting?.participants).toEqual(['user1@example.com', 'user2@example.com']);
      expect(result.meeting?.meetingUrl).toBe('https://meet.google.com/test-meeting-id');
    });

    it('should return error for missing meeting ID', async () => {
      const result = await GoogleMeetService.getMeetingDetails('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Meeting ID is required');
    });
  });

  describe('validateMeetingUrl', () => {
    it('should validate correct Google Meet URLs', () => {
      const validUrls = [
        'https://meet.google.com/abc-def-ghi',
        'https://meet.google.com/test123',
        'https://meet.google.com/meeting_123',
        'https://meet.google.com/a1b2c3d4e5'
      ];

      validUrls.forEach(url => {
        expect(GoogleMeetService.validateMeetingUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '',
        'http://meet.google.com/abc-def-ghi',
        'https://zoom.us/meeting',
        'https://meet.google.com/',
        'https://meet.google.com',
        'not-a-url',
        'https://meet.google.com/abc/def',
        'https://meet.google.com/abc def'
      ];

      invalidUrls.forEach(url => {
        expect(GoogleMeetService.validateMeetingUrl(url)).toBe(false);
      });
    });

    it('should handle null and undefined', () => {
      expect(GoogleMeetService.validateMeetingUrl(null as any)).toBe(false);
      expect(GoogleMeetService.validateMeetingUrl(undefined as any)).toBe(false);
    });
  });

  describe('extractMeetingIdFromUrl', () => {
    it('should extract meeting ID from valid URL', () => {
      const url = 'https://meet.google.com/abc-def-ghi';
      const meetingId = GoogleMeetService.extractMeetingIdFromUrl(url);

      expect(meetingId).toBe('abc-def-ghi');
    });

    it('should return null for invalid URLs', () => {
      const invalidUrls = [
        'https://zoom.us/meeting',
        'invalid-url',
        '',
        'https://meet.google.com/',
        'https://meet.google.com'
      ];

      invalidUrls.forEach(url => {
        expect(GoogleMeetService.extractMeetingIdFromUrl(url)).toBeNull();
      });
    });

    it('should handle complex meeting IDs', () => {
      const url = 'https://meet.google.com/complex_meeting-id_123';
      const meetingId = GoogleMeetService.extractMeetingIdFromUrl(url);

      expect(meetingId).toBe('complex_meeting-id_123');
    });
  });

  describe('formatMeetingDuration', () => {
    it('should format duration in hours and minutes', () => {
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T12:30:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('2h 30m');
    });

    it('should format duration only in minutes when less than an hour', () => {
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T10:45:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('45m');
    });

    it('should format exact hour durations', () => {
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T12:00:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('2h 0m');
    });

    it('should handle zero duration', () => {
      const start = new Date('2024-01-01T10:00:00Z');
      const end = new Date('2024-01-01T10:00:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('0m');
    });

    it('should handle invalid dates', () => {
      const start = new Date('invalid');
      const end = new Date('2024-01-01T10:00:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('Unknown duration');
    });

    it('should format long durations', () => {
      const start = new Date('2024-01-01T09:00:00Z');
      const end = new Date('2024-01-01T18:15:00Z');
      
      const duration = GoogleMeetService.formatMeetingDuration(start, end);
      expect(duration).toBe('9h 15m');
    });
  });
});