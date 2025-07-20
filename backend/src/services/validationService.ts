export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  data?: any;
}

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'date' | 'boolean' | 'array' | 'object';
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export class ValidationService {
  /**
   * Validates an object against a set of rules
   */
  static validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: string[] = [];
    const cleanedData: any = {};

    for (const rule of rules) {
      const value = data[rule.field];
      const fieldErrors = this.validateField(value, rule);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else {
        cleanedData[rule.field] = value;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: errors.length === 0 ? cleanedData : undefined
    };
  }

  /**
   * Validates a single field against a rule
   */
  private static validateField(value: any, rule: ValidationRule): string[] {
    const errors: string[] = [];
    const fieldName = rule.field;

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push(`${fieldName} is required`);
      return errors; // Stop validation if required field is missing
    }

    // If field is not required and value is empty, skip other validations
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(value, rule.type, fieldName);
      if (typeError) {
        errors.push(typeError);
        return errors; // Stop validation if type is wrong
      }
    }

    // Length validation for strings
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push(`${fieldName} must be at least ${rule.minLength} characters long`);
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push(`${fieldName} must be no more than ${rule.maxLength} characters long`);
      }
    }

    // Numeric range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fieldName} must be at least ${rule.min}`);
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fieldName} must be no more than ${rule.max}`);
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string') {
      if (!rule.pattern.test(value)) {
        errors.push(`${fieldName} format is invalid`);
      }
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (typeof customResult === 'string') {
        errors.push(customResult);
      } else if (customResult === false) {
        errors.push(`${fieldName} is invalid`);
      }
    }

    return errors;
  }

  /**
   * Validates the type of a value
   */
  private static validateType(value: any, expectedType: string, fieldName: string): string | null {
    switch (expectedType) {
      case 'string':
        if (typeof value !== 'string') {
          return `${fieldName} must be a string`;
        }
        break;
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return `${fieldName} must be a number`;
        }
        break;
      
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return `${fieldName} must be a valid email address`;
        }
        break;
      
      case 'date':
        if (!(value instanceof Date) && !this.isValidDateString(value)) {
          return `${fieldName} must be a valid date`;
        }
        break;
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return `${fieldName} must be a boolean`;
        }
        break;
      
      case 'array':
        if (!Array.isArray(value)) {
          return `${fieldName} must be an array`;
        }
        break;
      
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return `${fieldName} must be an object`;
        }
        break;
    }
    
    return null;
  }

  /**
   * Validates email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates if a string is a valid date
   */
  static isValidDateString(dateString: any): boolean {
    if (typeof dateString !== 'string') return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Validates password strength
   */
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates phone number format
   */
  static validatePhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  }

  /**
   * Validates URL format
   */
  static validateUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes string input
   */
  static sanitizeString(input: string): string {
    return input
      .trim()
      .replace(/<[^>]*>/g, '') // Remove HTML tags completely
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Validates credit card number using Luhn algorithm
   */
  static validateCreditCard(cardNumber: string): boolean {
    // Remove spaces and hyphens
    const cleanedNumber = cardNumber.replace(/[\s-]/g, '');
    
    // Check if it's all digits
    if (!/^\d+$/.test(cleanedNumber)) {
      return false;
    }

    // Check length (most cards are 13-19 digits)
    if (cleanedNumber.length < 13 || cleanedNumber.length > 19) {
      return false;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanedNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanedNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Validates age range
   */
  static validateAge(birthDate: Date | string, minAge: number = 0, maxAge: number = 150): ValidationResult {
    const errors: string[] = [];
    
    let date: Date;
    if (typeof birthDate === 'string') {
      date = new Date(birthDate);
      if (isNaN(date.getTime())) {
        errors.push('Invalid birth date format');
        return { isValid: false, errors };
      }
    } else {
      date = birthDate;
    }

    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();
    
    const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate()) 
      ? age - 1 
      : age;

    if (actualAge < minAge) {
      errors.push(`Age must be at least ${minAge} years`);
    }

    if (actualAge > maxAge) {
      errors.push(`Age must be no more than ${maxAge} years`);
    }

    if (date > today) {
      errors.push('Birth date cannot be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
      data: { age: actualAge }
    };
  }

  /**
   * Validates array with specific constraints
   */
  static validateArray(arr: any[], minLength?: number, maxLength?: number, itemValidator?: (item: any) => boolean): ValidationResult {
    const errors: string[] = [];

    if (minLength !== undefined && arr.length < minLength) {
      errors.push(`Array must contain at least ${minLength} items`);
    }

    if (maxLength !== undefined && arr.length > maxLength) {
      errors.push(`Array must contain no more than ${maxLength} items`);
    }

    if (itemValidator) {
      for (let i = 0; i < arr.length; i++) {
        if (!itemValidator(arr[i])) {
          errors.push(`Item at index ${i} is invalid`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}