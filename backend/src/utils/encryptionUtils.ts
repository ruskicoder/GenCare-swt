import crypto from 'crypto';

export class EncryptionUtils {
  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;

  public static generateKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  public static generateSalt(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public static hashPassword(password: string, salt?: string): {
    hash: string;
    salt: string;
  } {
    try {
      if (!password) {
        throw new Error('Password is required');
      }

      const useSalt = salt || this.generateSalt();
      const hash = crypto.pbkdf2Sync(password, useSalt, 100000, 64, 'sha512').toString('hex');

      return {
        hash,
        salt: useSalt
      };
    } catch (error) {
      throw new Error(`Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static verifyPassword(password: string, hash: string, salt: string): boolean {
    try {
      if (!password || !hash || !salt) {
        return false;
      }

      const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computedHash, 'hex'));
    } catch {
      return false;
    }
  }

  public static encrypt(text: string, key?: string): {
    encrypted: string;
    key: string;
    iv: string;
  } {
    try {
      if (!text) {
        throw new Error('Text to encrypt is required');
      }

      const encryptionKey = key ? Buffer.from(key, 'hex') : crypto.randomBytes(this.KEY_LENGTH);
      const iv = crypto.randomBytes(this.IV_LENGTH);
      const cipher = crypto.createCipher(this.ALGORITHM, encryptionKey);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        encrypted,
        key: encryptionKey.toString('hex'),
        iv: iv.toString('hex')
      };
    } catch (error) {
      throw new Error(`Failed to encrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static decrypt(encrypted: string, key: string, iv: string): string {
    try {
      if (!encrypted || !key || !iv) {
        throw new Error('All parameters (encrypted, key, iv) are required');
      }

      const decipher = crypto.createDecipher(this.ALGORITHM, Buffer.from(key, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static generateHash(data: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512' = 'sha256'): string {
    try {
      if (!data) {
        throw new Error('Data to hash is required');
      }

      return crypto.createHash(algorithm).update(data).digest('hex');
    } catch (error) {
      throw new Error(`Failed to generate hash: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static generateHMAC(data: string, secret: string, algorithm: 'sha1' | 'sha256' | 'sha512' = 'sha256'): string {
    try {
      if (!data || !secret) {
        throw new Error('Data and secret are required');
      }

      return crypto.createHmac(algorithm, secret).update(data).digest('hex');
    } catch (error) {
      throw new Error(`Failed to generate HMAC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public static validateKeyLength(key: string): boolean {
    try {
      if (!key) return false;
      const buffer = Buffer.from(key, 'hex');
      return buffer.length === this.KEY_LENGTH;
    } catch {
      return false;
    }
  }

  public static isValidHash(hash: string, algorithm: 'md5' | 'sha1' | 'sha256' | 'sha512'): boolean {
    try {
      if (!hash) return false;
      
      const expectedLengths = {
        md5: 32,
        sha1: 40,
        sha256: 64,
        sha512: 128
      };

      return hash.length === expectedLengths[algorithm] && /^[a-f0-9]+$/i.test(hash);
    } catch {
      return false;
    }
  }

  public static secureCompare(a: string, b: string): boolean {
    try {
      if (!a || !b || a.length !== b.length) {
        return false;
      }

      const bufferA = Buffer.from(a);
      const bufferB = Buffer.from(b);
      
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch {
      return false;
    }
  }
}