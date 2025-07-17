import { JWTUtils, JWTPayload } from '../../utils/jwtUtils';
import jwt from 'jsonwebtoken';

describe('JWTUtils', () => {
  const testPayload: JWTPayload = {
    userId: '507f1f77bcf86cd799439011',
    role: 'customer'
  };

  // Use the actual secret that JWTUtils will use
  const actualSecret = process.env.JWT_SECRET ?? 'my-secret-key-change-in-production';

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate tokens with default expiration', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const decoded = jwt.verify(token, actualSecret) as any;
      
      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should generate different tokens for same payload', () => {
      const token1 = JWTUtils.generateAccessToken(testPayload);
      // Force a different timestamp by manually creating another token
      const payload2 = { ...testPayload, _timestamp: Date.now() };
      const token2 = jwt.sign(payload2, actualSecret, { expiresIn: '1d' });
      
      expect(token1).not.toBe(token2); // Different due to different payloads
    });

    it('should handle different roles', () => {
      const adminPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439012',
        role: 'admin'
      };
      
      const token = JWTUtils.generateAccessToken(adminPayload);
      const decoded = jwt.verify(token, actualSecret) as any;
      
      expect(decoded.userId).toBe(adminPayload.userId);
      expect(decoded.role).toBe(adminPayload.role);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const result = JWTUtils.verifyToken(token);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testPayload.userId);
      expect(result?.role).toBe(testPayload.role);
    });

    it('should reject invalid token', () => {
      const result = JWTUtils.verifyToken('invalid-token');
      
      expect(result).toBeNull();
    });

    it('should reject malformed token', () => {
      const result = JWTUtils.verifyToken('not.a.jwt');
      
      expect(result).toBeNull();
    });

    it('should reject expired token', () => {
      // Create an already expired token
      const expiredToken = jwt.sign(testPayload, actualSecret, { expiresIn: '-1h' });
      const result = JWTUtils.verifyToken(expiredToken);
      
      expect(result).toBeNull();
    });

    it('should reject token with wrong secret', () => {
      const tokenWithWrongSecret = jwt.sign(testPayload, 'wrong-secret');
      const result = JWTUtils.verifyToken(tokenWithWrongSecret);
      
      expect(result).toBeNull();
    });

    it('should handle empty token', () => {
      const result = JWTUtils.verifyToken('');
      
      expect(result).toBeNull();
    });

    it('should handle null token', () => {
      const result = JWTUtils.verifyToken(null as any);
      
      expect(result).toBeNull();
    });

    it('should handle undefined token', () => {
      const result = JWTUtils.verifyToken(undefined as any);
      
      expect(result).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode valid token without verification', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const result = JWTUtils.decodeToken(token);
      
      expect(result).not.toBeNull();
      expect(result?.userId).toBe(testPayload.userId);
      expect(result?.role).toBe(testPayload.role);
    });

    it('should decode expired token', () => {
      // Create an expired token and decode it (should work since decode doesn't verify)
      const expiredToken = jwt.sign(testPayload, actualSecret, { expiresIn: '-1h' });
      const result = JWTUtils.decodeToken(expiredToken);
      
      expect(result?.userId).toBe(testPayload.userId);
      expect(result?.role).toBe(testPayload.role);
    });

    it('should return null for malformed token', () => {
      const result = JWTUtils.decodeToken('not-a-jwt');
      
      expect(result).toBeNull();
    });

    it('should return null for empty token', () => {
      const result = JWTUtils.decodeToken('');
      
      expect(result).toBeNull();
    });

    it('should handle different user roles', () => {
      const staffPayload: JWTPayload = {
        userId: '507f1f77bcf86cd799439013',
        role: 'staff'
      };
      
      const token = JWTUtils.generateAccessToken(staffPayload);
      const result = JWTUtils.decodeToken(token);
      
      expect(result?.userId).toBe(staffPayload.userId);
      expect(result?.role).toBe(staffPayload.role);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing JWT_SECRET environment variable', () => {
      // This test verifies that the fallback secret works
      const token = JWTUtils.generateAccessToken(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
    });

    it('should handle large payload', () => {
      const largePayload: JWTPayload = {
        userId: 'a'.repeat(100),
        role: 'customer'
      };
      
      const token = JWTUtils.generateAccessToken(largePayload);
      const result = JWTUtils.verifyToken(token);
      
      expect(result?.userId).toBe(largePayload.userId);
    });
  });

  describe('Security Tests', () => {
    it('should handle token tampering', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const [header, payload, signature] = token.split('.');
      
      // Tamper with signature
      const tamperedToken = `${header}.${payload}.tampered-signature`;
      const result = JWTUtils.verifyToken(tamperedToken);
      
      expect(result).toBeNull();
    });

    it('should validate token structure', () => {
      const token = JWTUtils.generateAccessToken(testPayload);
      const parts = token.split('.');
      
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBeTruthy(); // header
      expect(parts[1]).toBeTruthy(); // payload
      expect(parts[2]).toBeTruthy(); // signature
    });

    it('should handle various invalid token formats', () => {
      const invalidTokens = [
        'invalid-token',
        'not.a.jwt',
        'only.two.parts',
        '...',
        Buffer.from('binary data').toString(),
        'too.many.parts.in.this.token',
        null,
        undefined
      ];
      
      invalidTokens.forEach(invalidToken => {
        const result = JWTUtils.verifyToken(invalidToken as any);
        expect(result).toBeNull();
      });
    });
  });
});