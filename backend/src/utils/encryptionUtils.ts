import crypto from 'crypto';

export class EncryptionUtils {
  /**
   * Hashes a password using SHA-256
   */
  static async hashPassword(password: string): Promise<string> {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  /**
   * Compares a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await this.hashPassword(password);
    return passwordHash === hash;
  }

  /**
   * Generates a random salt
   */
  static generateSalt(length: number = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Hashes data with salt using SHA-256
   */
  static hashWithSalt(data: string, salt: string): string {
    return crypto.createHash('sha256').update(data + salt).digest('hex');
  }

  /**
   * Generates a random key for encryption
   */
  static generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Simple encrypt function using AES-256-CBC
   */
  static encrypt(text: string, key?: string): { encrypted: string; key: string; iv: string } {
    try {
      const encryptionKey = key || this.generateKey();
      const iv = crypto.randomBytes(16);
      
      // Use createCipheriv instead of deprecated createCipher
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey, 'hex'), iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encrypted,
        key: encryptionKey,
        iv: iv.toString('hex')
      };
    } catch (error) {
      throw new Error(`Failed to encrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Simple decrypt function using AES-256-CBC
   */
  static decrypt(encryptedData: string, key: string, iv: string): string {
    try {
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      throw new Error(`Failed to decrypt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Creates HMAC signature
   */
  static createHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verifies HMAC signature
   */
  static verifyHMAC(data: string, signature: string, secret: string): boolean {
    try {
      const expected = this.createHMAC(data, secret);
      
      // Convert to buffers
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expected, 'hex');
      
      // Check if buffers have the same length
      if (signatureBuffer.length !== expectedBuffer.length) {
        return false;
      }
      
      return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Generates a random UUID
   */
  static generateUUID(): string {
    return crypto.randomUUID();
  }

  /**
   * Creates a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Hash data using MD5 (for compatibility)
   */
  static md5(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex');
  }
}