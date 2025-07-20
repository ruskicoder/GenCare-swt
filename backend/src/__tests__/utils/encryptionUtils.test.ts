import { EncryptionUtils } from '../../utils/encryptionUtils';

describe('EncryptionUtils', () => {
  describe('generateKey', () => {
    it('should generate a key of correct length', () => {
      const key = EncryptionUtils.generateKey();
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/i.test(key)).toBe(true);
    });

    it('should generate unique keys', () => {
      const key1 = EncryptionUtils.generateKey();
      const key2 = EncryptionUtils.generateKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('generateSalt', () => {
    it('should generate a salt of correct length', () => {
      const salt = EncryptionUtils.generateSalt();
      
      expect(salt).toBeDefined();
      expect(typeof salt).toBe('string');
      expect(salt).toHaveLength(32); // 16 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/i.test(salt)).toBe(true);
    });

    it('should generate unique salts', () => {
      const salt1 = EncryptionUtils.generateSalt();
      const salt2 = EncryptionUtils.generateSalt();
      
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('hashPassword', () => {
    it('should hash password with generated salt', () => {
      const password = 'testPassword123';
      const result = EncryptionUtils.hashPassword(password);
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(typeof result.hash).toBe('string');
      expect(typeof result.salt).toBe('string');
      expect(result.hash).toHaveLength(128); // 64 bytes * 2 (hex)
      expect(result.salt).toHaveLength(32); // 16 bytes * 2 (hex)
    });

    it('should hash password with provided salt', () => {
      const password = 'testPassword123';
      const salt = 'customsalt1234567890abcdef12345678';
      const result = EncryptionUtils.hashPassword(password, salt);
      
      expect(result.hash).toBeDefined();
      expect(result.salt).toBe(salt);
    });

    it('should generate same hash for same password and salt', () => {
      const password = 'testPassword123';
      const salt = 'customsalt1234567890abcdef12345678';
      
      const result1 = EncryptionUtils.hashPassword(password, salt);
      const result2 = EncryptionUtils.hashPassword(password, salt);
      
      expect(result1.hash).toBe(result2.hash);
    });

    it('should throw error for empty password', () => {
      expect(() => EncryptionUtils.hashPassword('')).toThrow('Failed to hash password: Password is required');
    });

    it('should handle different passwords differently', () => {
      const salt = 'customsalt1234567890abcdef12345678';
      const result1 = EncryptionUtils.hashPassword('password1', salt);
      const result2 = EncryptionUtils.hashPassword('password2', salt);
      
      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'testPassword123';
      const { hash, salt } = EncryptionUtils.hashPassword(password);
      
      const isValid = EncryptionUtils.verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', () => {
      const password = 'testPassword123';
      const { hash, salt } = EncryptionUtils.hashPassword(password);
      
      const isValid = EncryptionUtils.verifyPassword('wrongPassword', hash, salt);
      expect(isValid).toBe(false);
    });

    it('should return false for missing parameters', () => {
      expect(EncryptionUtils.verifyPassword('', 'hash', 'salt')).toBe(false);
      expect(EncryptionUtils.verifyPassword('password', '', 'salt')).toBe(false);
      expect(EncryptionUtils.verifyPassword('password', 'hash', '')).toBe(false);
    });

    it('should handle invalid hash gracefully', () => {
      const isValid = EncryptionUtils.verifyPassword('password', 'invalidhash', 'salt');
      expect(isValid).toBe(false);
    });
  });

  describe('encrypt', () => {
    it('should encrypt text with generated key', () => {
      const text = 'Hello, World!';
      const result = EncryptionUtils.encrypt(text);
      
      expect(result.encrypted).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.key).toHaveLength(64); // 32 bytes * 2 (hex)
      expect(result.iv).toHaveLength(32); // 16 bytes * 2 (hex)
    });

    it('should encrypt text with provided key', () => {
      const text = 'Hello, World!';
      const key = EncryptionUtils.generateKey();
      const result = EncryptionUtils.encrypt(text, key);
      
      expect(result.key).toBe(key);
      expect(result.encrypted).toBeDefined();
    });

    it('should produce different encrypted output for same text', () => {
      const text = 'Hello, World!';
      const result1 = EncryptionUtils.encrypt(text);
      const result2 = EncryptionUtils.encrypt(text);
      
      expect(result1.encrypted).not.toBe(result2.encrypted);
      expect(result1.iv).not.toBe(result2.iv);
    });

    it('should throw error for empty text', () => {
      expect(() => EncryptionUtils.encrypt('')).toThrow('Failed to encrypt: Text to encrypt is required');
    });

    it('should handle special characters', () => {
      const text = '¡Hëllö, Wörld! 😀🚀';
      const result = EncryptionUtils.encrypt(text);
      
      expect(result.encrypted).toBeDefined();
      expect(result.key).toBeDefined();
    });
  });

  describe('decrypt', () => {
    it('should decrypt encrypted text correctly', () => {
      const originalText = 'Hello, World!';
      const { encrypted, key, iv } = EncryptionUtils.encrypt(originalText);
      
      const decrypted = EncryptionUtils.decrypt(encrypted, key, iv);
      expect(decrypted).toBe(originalText);
    });

    it('should handle special characters in decryption', () => {
      const originalText = '¡Hëllö, Wörld! 😀🚀';
      const { encrypted, key, iv } = EncryptionUtils.encrypt(originalText);
      
      const decrypted = EncryptionUtils.decrypt(encrypted, key, iv);
      expect(decrypted).toBe(originalText);
    });

    it('should throw error for missing parameters', () => {
      expect(() => EncryptionUtils.decrypt('', 'key', 'iv'))
        .toThrow('Failed to decrypt: All parameters (encrypted, key, iv) are required');
      expect(() => EncryptionUtils.decrypt('encrypted', '', 'iv'))
        .toThrow('Failed to decrypt: All parameters (encrypted, key, iv) are required');
      expect(() => EncryptionUtils.decrypt('encrypted', 'key', ''))
        .toThrow('Failed to decrypt: All parameters (encrypted, key, iv) are required');
    });

    it('should throw error for invalid encrypted data', () => {
      const key = EncryptionUtils.generateKey();
      const iv = '1234567890abcdef1234567890abcdef';
      
      expect(() => EncryptionUtils.decrypt('invaliddata', key, iv))
        .toThrow('Failed to decrypt:');
    });
  });

  describe('generateHash', () => {
    it('should generate SHA256 hash by default', () => {
      const data = 'Hello, World!';
      const hash = EncryptionUtils.generateHash(data);
      
      expect(hash).toBeDefined();
      expect(hash).toHaveLength(64); // SHA256 = 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/i.test(hash)).toBe(true);
    });

    it('should generate different hash algorithms', () => {
      const data = 'Hello, World!';
      
      const md5Hash = EncryptionUtils.generateHash(data, 'md5');
      const sha1Hash = EncryptionUtils.generateHash(data, 'sha1');
      const sha256Hash = EncryptionUtils.generateHash(data, 'sha256');
      const sha512Hash = EncryptionUtils.generateHash(data, 'sha512');
      
      expect(md5Hash).toHaveLength(32);
      expect(sha1Hash).toHaveLength(40);
      expect(sha256Hash).toHaveLength(64);
      expect(sha512Hash).toHaveLength(128);
    });

    it('should generate consistent hashes for same data', () => {
      const data = 'Hello, World!';
      const hash1 = EncryptionUtils.generateHash(data);
      const hash2 = EncryptionUtils.generateHash(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should throw error for empty data', () => {
      expect(() => EncryptionUtils.generateHash('')).toThrow('Failed to generate hash: Data to hash is required');
    });
  });

  describe('generateHMAC', () => {
    it('should generate HMAC with default SHA256', () => {
      const data = 'Hello, World!';
      const secret = 'mySecret';
      const hmac = EncryptionUtils.generateHMAC(data, secret);
      
      expect(hmac).toBeDefined();
      expect(hmac).toHaveLength(64); // SHA256 = 32 bytes * 2 (hex)
      expect(/^[a-f0-9]+$/i.test(hmac)).toBe(true);
    });

    it('should generate different HMAC algorithms', () => {
      const data = 'Hello, World!';
      const secret = 'mySecret';
      
      const sha1Hmac = EncryptionUtils.generateHMAC(data, secret, 'sha1');
      const sha256Hmac = EncryptionUtils.generateHMAC(data, secret, 'sha256');
      const sha512Hmac = EncryptionUtils.generateHMAC(data, secret, 'sha512');
      
      expect(sha1Hmac).toHaveLength(40);
      expect(sha256Hmac).toHaveLength(64);
      expect(sha512Hmac).toHaveLength(128);
    });

    it('should generate different HMACs for different secrets', () => {
      const data = 'Hello, World!';
      const hmac1 = EncryptionUtils.generateHMAC(data, 'secret1');
      const hmac2 = EncryptionUtils.generateHMAC(data, 'secret2');
      
      expect(hmac1).not.toBe(hmac2);
    });

    it('should throw error for missing data or secret', () => {
      expect(() => EncryptionUtils.generateHMAC('', 'secret'))
        .toThrow('Failed to generate HMAC: Data and secret are required');
      expect(() => EncryptionUtils.generateHMAC('data', ''))
        .toThrow('Failed to generate HMAC: Data and secret are required');
    });
  });

  describe('validateKeyLength', () => {
    it('should validate correct key length', () => {
      const validKey = EncryptionUtils.generateKey();
      expect(EncryptionUtils.validateKeyLength(validKey)).toBe(true);
    });

    it('should reject invalid key lengths', () => {
      expect(EncryptionUtils.validateKeyLength('short')).toBe(false);
      expect(EncryptionUtils.validateKeyLength('1234567890abcdef1234567890abcdef')).toBe(false); // 32 chars = 16 bytes
    });

    it('should reject empty or invalid keys', () => {
      expect(EncryptionUtils.validateKeyLength('')).toBe(false);
      expect(EncryptionUtils.validateKeyLength('invalidhexkey')).toBe(false);
    });
  });

  describe('isValidHash', () => {
    it('should validate correct hash formats', () => {
      const data = 'test';
      const md5Hash = EncryptionUtils.generateHash(data, 'md5');
      const sha1Hash = EncryptionUtils.generateHash(data, 'sha1');
      const sha256Hash = EncryptionUtils.generateHash(data, 'sha256');
      const sha512Hash = EncryptionUtils.generateHash(data, 'sha512');
      
      expect(EncryptionUtils.isValidHash(md5Hash, 'md5')).toBe(true);
      expect(EncryptionUtils.isValidHash(sha1Hash, 'sha1')).toBe(true);
      expect(EncryptionUtils.isValidHash(sha256Hash, 'sha256')).toBe(true);
      expect(EncryptionUtils.isValidHash(sha512Hash, 'sha512')).toBe(true);
    });

    it('should reject invalid hash formats', () => {
      expect(EncryptionUtils.isValidHash('short', 'sha256')).toBe(false);
      expect(EncryptionUtils.isValidHash('invalidchars!@#', 'sha256')).toBe(false);
      expect(EncryptionUtils.isValidHash('', 'sha256')).toBe(false);
    });

    it('should reject wrong length for algorithm', () => {
      const sha256Hash = EncryptionUtils.generateHash('test', 'sha256');
      expect(EncryptionUtils.isValidHash(sha256Hash, 'md5')).toBe(false);
    });
  });

  describe('secureCompare', () => {
    it('should return true for identical strings', () => {
      const str = 'testString123';
      expect(EncryptionUtils.secureCompare(str, str)).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(EncryptionUtils.secureCompare('string1', 'string2')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(EncryptionUtils.secureCompare('short', 'verylongstring')).toBe(false);
    });

    it('should return false for empty or null strings', () => {
      expect(EncryptionUtils.secureCompare('', 'test')).toBe(false);
      expect(EncryptionUtils.secureCompare('test', '')).toBe(false);
      expect(EncryptionUtils.secureCompare('', '')).toBe(false);
    });

    it('should handle special characters', () => {
      const str = '¡Hëllö! 😀🚀';
      expect(EncryptionUtils.secureCompare(str, str)).toBe(true);
      expect(EncryptionUtils.secureCompare(str, 'different')).toBe(false);
    });
  });
});