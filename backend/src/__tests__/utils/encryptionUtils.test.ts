import { EncryptionUtils } from '../../utils/encryptionUtils';

describe('EncryptionUtils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await EncryptionUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it('should produce consistent hashes for same password', async () => {
      const password = 'testPassword123';
      const hash1 = await EncryptionUtils.hashPassword(password);
      const hash2 = await EncryptionUtils.hashPassword(password);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different passwords', async () => {
      const password1 = 'testPassword123';
      const password2 = 'differentPassword456';
      const hash1 = await EncryptionUtils.hashPassword(password1);
      const hash2 = await EncryptionUtils.hashPassword(password2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await EncryptionUtils.hashPassword(password);
      const isMatch = await EncryptionUtils.comparePassword(password, hash);
      
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await EncryptionUtils.hashPassword(password);
      const isMatch = await EncryptionUtils.comparePassword(wrongPassword, hash);
      
      expect(isMatch).toBe(false);
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt of default length', () => {
      const salt = EncryptionUtils.generateSalt();
      
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBe(32); // 16 bytes = 32 hex characters
    });

    it('should generate a salt of specified length', () => {
      const length = 8;
      const salt = EncryptionUtils.generateSalt(length);
      
      expect(salt.length).toBe(length * 2); // hex encoding doubles the length
    });

    it('should generate different salts each time', () => {
      const salt1 = EncryptionUtils.generateSalt();
      const salt2 = EncryptionUtils.generateSalt();
      
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hashWithSalt', () => {
    it('should hash data with salt', () => {
      const data = 'testData';
      const salt = 'testSalt';
      const hash = EncryptionUtils.hashWithSalt(data, salt);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it('should produce consistent hashes for same data and salt', () => {
      const data = 'testData';
      const salt = 'testSalt';
      const hash1 = EncryptionUtils.hashWithSalt(data, salt);
      const hash2 = EncryptionUtils.hashWithSalt(data, salt);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different salts', () => {
      const data = 'testData';
      const salt1 = 'testSalt1';
      const salt2 = 'testSalt2';
      const hash1 = EncryptionUtils.hashWithSalt(data, salt1);
      const hash2 = EncryptionUtils.hashWithSalt(data, salt2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateKey', () => {
    it('should generate a key of default length', () => {
      const key = EncryptionUtils.generateKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBe(64); // 32 bytes = 64 hex characters
    });

    it('should generate a key of specified length', () => {
      const length = 16;
      const key = EncryptionUtils.generateKey(length);
      
      expect(key.length).toBe(length * 2); // hex encoding doubles the length
    });

    it('should generate different keys each time', () => {
      const key1 = EncryptionUtils.generateKey();
      const key2 = EncryptionUtils.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('encrypt', () => {
    it('should encrypt text with generated key', () => {
      const text = 'Hello, World!';
      const result = EncryptionUtils.encrypt(text);
      
      expect(result).toBeDefined();
      expect(result.encrypted).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(typeof result.encrypted).toBe('string');
      expect(typeof result.key).toBe('string');
      expect(typeof result.iv).toBe('string');
    });

    it('should encrypt text with provided key', () => {
      const text = 'Hello, World!';
      const key = EncryptionUtils.generateKey();
      const result = EncryptionUtils.encrypt(text, key);
      
      expect(result.key).toBe(key);
      expect(result.encrypted).toBeDefined();
      expect(result.iv).toBeDefined();
    });

    it('should produce different encrypted output for same text', () => {
      const text = 'Hello, World!';
      const result1 = EncryptionUtils.encrypt(text);
      const result2 = EncryptionUtils.encrypt(text);
      
      // Different because of different IVs
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should handle special characters', () => {
      const text = 'Hello! @#$%^&*()_+{}|:"<>?[];\',./ World! 🌟';
      const result = EncryptionUtils.encrypt(text);
      
      expect(result.encrypted).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.iv).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text correctly', () => {
      const text = 'Hello, World!';
      const { encrypted, key, iv } = EncryptionUtils.encrypt(text);
      const decrypted = EncryptionUtils.decrypt(encrypted, key, iv);
      
      expect(decrypted).toBe(text);
    });

    it('should handle special characters in decryption', () => {
      const text = 'Hello! @#$%^&*()_+{}|:"<>?[];\',./ World! 🌟';
      const { encrypted, key, iv } = EncryptionUtils.encrypt(text);
      const decrypted = EncryptionUtils.decrypt(encrypted, key, iv);
      
      expect(decrypted).toBe(text);
    });

    it('should throw error for invalid encrypted data', () => {
      const key = EncryptionUtils.generateKey();
      const iv = EncryptionUtils.generateKey(16);
      
      expect(() => {
        EncryptionUtils.decrypt('invalid-encrypted-data', key, iv);
      }).toThrow('Failed to decrypt');
    });

    it('should throw error for invalid key', () => {
      const text = 'Hello, World!';
      const { encrypted, iv } = EncryptionUtils.encrypt(text);
      const wrongKey = EncryptionUtils.generateKey();
      
      expect(() => {
        EncryptionUtils.decrypt(encrypted, wrongKey, iv);
      }).toThrow('Failed to decrypt');
    });

    it('should throw error for invalid IV', () => {
      const text = 'Hello, World!';
      const { encrypted, key } = EncryptionUtils.encrypt(text);
      const wrongIv = EncryptionUtils.generateKey(16);
      
      expect(() => {
        EncryptionUtils.decrypt(encrypted, key, wrongIv);
      }).toThrow('Failed to decrypt');
    });
  });

  describe('createHMAC', () => {
    it('should create HMAC signature', () => {
      const data = 'test data';
      const secret = 'test secret';
      const signature = EncryptionUtils.createHMAC(data, secret);
      
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it('should produce consistent signatures for same data and secret', () => {
      const data = 'test data';
      const secret = 'test secret';
      const signature1 = EncryptionUtils.createHMAC(data, secret);
      const signature2 = EncryptionUtils.createHMAC(data, secret);
      
      expect(signature1).toBe(signature2);
    });

    it('should produce different signatures for different secrets', () => {
      const data = 'test data';
      const secret1 = 'test secret 1';
      const secret2 = 'test secret 2';
      const signature1 = EncryptionUtils.createHMAC(data, secret1);
      const signature2 = EncryptionUtils.createHMAC(data, secret2);
      
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifyHMAC', () => {
    it('should verify valid HMAC signature', () => {
      const data = 'test data';
      const secret = 'test secret';
      const signature = EncryptionUtils.createHMAC(data, secret);
      const isValid = EncryptionUtils.verifyHMAC(data, signature, secret);
      
      expect(isValid).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      const data = 'test data';
      const secret = 'test secret';
      const wrongSignature = 'invalid-signature';
      const isValid = EncryptionUtils.verifyHMAC(data, wrongSignature, secret);
      
      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const data = 'test data';
      const secret = 'test secret';
      const wrongSecret = 'wrong secret';
      const signature = EncryptionUtils.createHMAC(data, secret);
      const isValid = EncryptionUtils.verifyHMAC(data, signature, wrongSecret);
      
      expect(isValid).toBe(false);
    });
  });

  describe('generateUUID', () => {
    it('should generate a valid UUID', () => {
      const uuid = EncryptionUtils.generateUUID();
      
      expect(uuid).toBeDefined();
      expect(typeof uuid).toBe('string');
      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should generate different UUIDs each time', () => {
      const uuid1 = EncryptionUtils.generateUUID();
      const uuid2 = EncryptionUtils.generateUUID();
      
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a secure token of default length', () => {
      const token = EncryptionUtils.generateSecureToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate a secure token of specified length', () => {
      const length = 16;
      const token = EncryptionUtils.generateSecureToken(length);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate different tokens each time', () => {
      const token1 = EncryptionUtils.generateSecureToken();
      const token2 = EncryptionUtils.generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('hash', () => {
    it('should hash data using SHA-256', () => {
      const data = 'test data';
      const hash = EncryptionUtils.hash(data);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA-256 produces 64 character hex string
    });

    it('should produce consistent hashes for same data', () => {
      const data = 'test data';
      const hash1 = EncryptionUtils.hash(data);
      const hash2 = EncryptionUtils.hash(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';
      const hash1 = EncryptionUtils.hash(data1);
      const hash2 = EncryptionUtils.hash(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('md5', () => {
    it('should hash data using MD5', () => {
      const data = 'test data';
      const hash = EncryptionUtils.md5(data);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(32); // MD5 produces 32 character hex string
    });

    it('should produce consistent hashes for same data', () => {
      const data = 'test data';
      const hash1 = EncryptionUtils.md5(data);
      const hash2 = EncryptionUtils.md5(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', () => {
      const data1 = 'test data 1';
      const data2 = 'test data 2';
      const hash1 = EncryptionUtils.md5(data1);
      const hash2 = EncryptionUtils.md5(data2);
      
      expect(hash1).not.toBe(hash2);
    });
  });
});