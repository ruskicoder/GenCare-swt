import { RandomUtils } from '../../utils/randomUtils';

describe('RandomUtils', () => {
  describe('generateRandomOTP', () => {
    it('should generate OTP within specified range', () => {
      const startRandom = 1000;
      const endRandom = 9999;
      const result = RandomUtils.generateRandomOTP(startRandom, endRandom);
      
      expect(typeof result).toBe('string');
      const num = parseInt(result);
      expect(num).toBeGreaterThanOrEqual(startRandom);
      expect(num).toBeLessThan(endRandom);
    });

    it('should generate different OTPs on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(RandomUtils.generateRandomOTP(1000, 9999));
      }
      
      expect(results.size).toBeGreaterThan(1);
    });

    it('should handle single digit range', () => {
      const result = RandomUtils.generateRandomOTP(0, 10);
      const num = parseInt(result);
      
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(10);
    });

    it('should handle large ranges', () => {
      const result = RandomUtils.generateRandomOTP(100000, 999999);
      const num = parseInt(result);
      
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(999999);
    });
  });

  describe('generateRandomString', () => {
    it('should generate string of specified length', () => {
      const length = 10;
      const result = RandomUtils.generateRandomString(length);
      
      expect(result).toHaveLength(length);
      expect(typeof result).toBe('string');
    });

    it('should generate only lowercase letters by default', () => {
      const result = RandomUtils.generateRandomString(20);
      
      expect(result).toMatch(/^[a-z]+$/);
    });

    it('should include numbers when specified', () => {
      const result = RandomUtils.generateRandomString(50, true);
      
      expect(result).toMatch(/^[a-z0-9]+$/);
      // Should have at least some variation between letters and numbers
      expect(result).toHaveLength(50);
    });

    it('should generate different strings on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(RandomUtils.generateRandomString(10));
      }
      
      expect(results.size).toBeGreaterThan(1);
    });

    it('should handle zero length', () => {
      const result = RandomUtils.generateRandomString(0);
      
      expect(result).toBe('');
    });

    it('should handle large lengths', () => {
      const result = RandomUtils.generateRandomString(100, true);
      
      expect(result).toHaveLength(100);
      expect(result).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('generateMeetingPassword', () => {
    it('should generate 6-digit password', () => {
      const result = RandomUtils.generateMeetingPassword();
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(6);
      expect(result).toMatch(/^\d{6}$/);
    });

    it('should generate different passwords on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(RandomUtils.generateMeetingPassword());
      }
      
      expect(results.size).toBeGreaterThan(1);
    });

    it('should generate passwords within valid range', () => {
      const result = RandomUtils.generateMeetingPassword();
      const num = parseInt(result);
      
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThan(1000000);
    });

    it('should not start with zero', () => {
      // Run multiple times to ensure consistency
      for (let i = 0; i < 20; i++) {
        const result = RandomUtils.generateMeetingPassword();
        expect(result).not.toMatch(/^0/);
      }
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token with default length', () => {
      const result = RandomUtils.generateSecureToken();
      
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(64); // 32 bytes = 64 hex characters
      expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate token with specified length', () => {
      const length = 16;
      const result = RandomUtils.generateSecureToken(length);
      
      expect(result).toHaveLength(length * 2); // bytes * 2 for hex
      expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it('should generate different tokens on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(RandomUtils.generateSecureToken());
      }
      
      expect(results.size).toBe(50); // Should all be unique
    });

    it('should handle small lengths', () => {
      const result = RandomUtils.generateSecureToken(1);
      
      expect(result).toHaveLength(2);
      expect(result).toMatch(/^[a-f0-9]+$/);
    });

    it('should handle large lengths', () => {
      const result = RandomUtils.generateSecureToken(128);
      
      expect(result).toHaveLength(256);
      expect(result).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const result = RandomUtils.generateUUID();
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should generate different UUIDs on multiple calls', () => {
      const results = new Set();
      for (let i = 0; i < 100; i++) {
        results.add(RandomUtils.generateUUID());
      }
      
      expect(results.size).toBe(100); // Should all be unique
    });

    it('should contain proper UUID separators', () => {
      const result = RandomUtils.generateUUID();
      
      expect(result).toContain('-');
      expect(result.split('-')).toHaveLength(5);
    });

    it('should have correct segment lengths', () => {
      const result = RandomUtils.generateUUID();
      const segments = result.split('-');
      
      expect(segments[0]).toHaveLength(8);
      expect(segments[1]).toHaveLength(4);
      expect(segments[2]).toHaveLength(4);
      expect(segments[3]).toHaveLength(4);
      expect(segments[4]).toHaveLength(12);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle generateRandomString with includeNumbers false', () => {
      const result = RandomUtils.generateRandomString(20, false);
      
      expect(result).toMatch(/^[a-z]+$/);
      expect(result).toHaveLength(20);
    });

    it('should handle multiple rapid calls', () => {
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push({
          otp: RandomUtils.generateRandomOTP(1000, 9999),
          string: RandomUtils.generateRandomString(10),
          password: RandomUtils.generateMeetingPassword(),
          token: RandomUtils.generateSecureToken(8),
          uuid: RandomUtils.generateUUID()
        });
      }
      
      // All should be valid
      results.forEach(result => {
        expect(typeof result.otp).toBe('string');
        expect(result.string).toHaveLength(10);
        expect(result.password).toMatch(/^\d{6}$/);
        expect(result.token).toHaveLength(16);
        expect(result.uuid).toMatch(/^[0-9a-f-]+$/);
      });
    });

    it('should maintain consistency in format across calls', () => {
      for (let i = 0; i < 5; i++) {
        const otp = RandomUtils.generateRandomOTP(1000, 9999);
        const string = RandomUtils.generateRandomString(8);
        const password = RandomUtils.generateMeetingPassword();
        const token = RandomUtils.generateSecureToken(4);
        const uuid = RandomUtils.generateUUID();

        expect(parseInt(otp)).toBeGreaterThanOrEqual(1000);
        expect(string).toMatch(/^[a-z]{8}$/);
        expect(password).toMatch(/^\d{6}$/);
        expect(token).toMatch(/^[a-f0-9]{8}$/);
        expect(uuid).toMatch(/^[0-9a-f-]{36}$/);
      }
    });
  });
});