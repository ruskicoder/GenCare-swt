import { AuthService } from '../../services/authService';
import { UserRepository } from '../../repositories/userRepository';
import { JWTUtils } from '../../utils/jwtUtils';
import { MailUtils } from '../../utils/mailUtils';
import { RandomUtils } from '../../utils/randomUtils';
import bcrypt from 'bcryptjs';
import { LoginRequest } from '../../dto/requests/LoginRequest';
import { RegisterRequest } from '../../dto/requests/RegisterRequest';

// Mock dependencies
jest.mock('../../repositories/userRepository');
jest.mock('../../utils/jwtUtils');
jest.mock('../../utils/mailUtils');
jest.mock('../../utils/randomUtils');
jest.mock('bcryptjs');
jest.mock('../../configs/redis', () => ({
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn()
}));

const mockUserRepository = UserRepository as jest.Mocked<typeof UserRepository>;
const mockJWTUtils = JWTUtils as jest.Mocked<typeof JWTUtils>;
const mockMailUtils = MailUtils as jest.Mocked<typeof MailUtils>;
const mockRandomUtils = RandomUtils as jest.Mocked<typeof RandomUtils>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Import the mocked redis client
const mockRedisClient = require('../../configs/redis');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginRequest: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: 'hashedpassword',
        status: true,
        email_verified: true,
        role: 'customer'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJWTUtils.generateAccessToken.mockReturnValue('mock-jwt-token');

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng nhập thành công');
      expect(result.user).toEqual({
        _id: mockUser._id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should fail login with non-existent email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email hoặc mật khẩu không đúng');
    });

    it('should fail login with disabled account', async () => {
      const mockUser = {
        email: 'test@example.com',
        status: false,
        email_verified: true,
        password: 'hashedpassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tài khoản đã bị vô hiệu hóa');
    });

    it('should fail login with unverified email', async () => {
      const mockUser = {
        email: 'test@example.com',
        status: true,
        email_verified: false,
        password: 'hashedpassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tài khoản chưa được xác thực email. Vui lòng xác thực OTP trước khi đăng nhập.');
    });

    it('should fail login for Google account without password', async () => {
      const mockUser = {
        email: 'test@example.com',
        status: true,
        email_verified: true,
        password: null
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Tài khoản này được tạo bằng Google. Vui lòng đăng nhập bằng Google.');
    });

    it('should fail login with wrong password', async () => {
      const mockUser = {
        email: 'test@example.com',
        status: true,
        email_verified: true,
        password: 'hashedpassword'
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email hoặc mật khẩu không đúng');
    });

    it('should handle database errors', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đã xảy ra lỗi trong quá trình đăng nhập');
    });
  });

  describe('loginGoogle', () => {
    const googleUser = {
      email: 'google@example.com',
      full_name: 'Google User',
      avatar_url: 'avatar.jpg'
    };

    it('should login existing Google user successfully', async () => {
      const existingUser = {
        _id: 'user123',
        email: 'google@example.com',
        full_name: 'Google User',
        role: 'customer',
        status: true
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);
      mockJWTUtils.generateAccessToken.mockReturnValue('mock-jwt-token');

      const result = await AuthService.loginGoogle(googleUser);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng nhập Google thành công');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should create and login new Google user', async () => {
      const newUser = {
        _id: 'newuser123',
        email: 'google@example.com',
        full_name: 'Google User',
        role: 'customer'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(newUser as any);
      mockJWTUtils.generateAccessToken.mockReturnValue('mock-jwt-token');

      const result = await AuthService.loginGoogle(googleUser);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng nhập Google thành công');
      expect(result.accessToken).toBe('mock-jwt-token');
    });

    it('should handle errors during Google login', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.loginGoogle(googleUser);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đã xảy ra lỗi trong quá trình đăng nhập Google');
    });
  });

  describe('register', () => {
    const registerRequest: RegisterRequest = {
      email: 'new@example.com',
      password: 'password123',
      confirm_password: 'password123',
      full_name: 'New User',
      phone: '1234567890',
      date_of_birth: new Date('1990-01-01'),
      gender: 'female'
    };

    it('should register new user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashedpassword' as never);
      mockRandomUtils.generateRandomOTP.mockReturnValue('123456');
      mockRedisClient.setex.mockResolvedValue('OK');
      mockMailUtils.sendOtpForRegister.mockResolvedValue(undefined);

      const result = await AuthService.register(registerRequest);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Đăng ký thành công. Vui lòng kiểm tra email để xác thực OTP.');
    });

    it('should fail registration with existing email', async () => {
      const existingUser = { email: 'new@example.com' };
      mockUserRepository.findByEmail.mockResolvedValue(existingUser as any);

      const result = await AuthService.register(registerRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email đã được sử dụng');
    });

    it('should handle registration errors', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.register(registerRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đã xảy ra lỗi trong quá trình đăng ký');
    });
  });

  describe('verifyOTP', () => {
    const email = 'test@example.com';
    const otp = '123456';

    it('should verify OTP successfully', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        email_verified: false
      };

      mockRedisClient.get.mockResolvedValue('123456');
      mockUserRepository.findByEmail.mockResolvedValue(mockUser as any);
      mockUserRepository.findByIdAndUpdate.mockResolvedValue(undefined);
      mockRedisClient.del.mockResolvedValue(1);

      const result = await AuthService.verifyOTP(email, otp);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Xác thực OTP thành công');
    });

    it('should fail with expired OTP', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await AuthService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP đã hết hạn hoặc không tồn tại');
    });

    it('should fail with incorrect OTP', async () => {
      mockRedisClient.get.mockResolvedValue('654321');

      const result = await AuthService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('OTP không đúng');
    });

    it('should fail with non-existent user', async () => {
      mockRedisClient.get.mockResolvedValue('123456');
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await AuthService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Không tìm thấy người dùng');
    });

    it('should handle verification errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis error'));

      const result = await AuthService.verifyOTP(email, otp);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đã xảy ra lỗi trong quá trình xác thực OTP');
    });
  });

  describe('verifyOldPassword', () => {
    const userId = 'user123';
    const oldPassword = 'oldpassword';

    it('should verify old password successfully', async () => {
      const mockUser = {
        password: 'hashedpassword'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(true as never);

      const result = await AuthService.verifyOldPassword(userId, oldPassword);

      expect(result).toBe(true);
    });

    it('should fail verification with wrong password', async () => {
      const mockUser = {
        password: 'hashedpassword'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockBcrypt.compare.mockResolvedValue(false as never);

      const result = await AuthService.verifyOldPassword(userId, oldPassword);

      expect(result).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await AuthService.verifyOldPassword(userId, oldPassword);

      expect(result).toBe(false);
    });

    it('should handle verification errors', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const result = await AuthService.verifyOldPassword(userId, oldPassword);

      expect(result).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const password = 'password123';
      const hashedPassword = 'hashedpassword';

      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await AuthService.hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should handle hashing errors', async () => {
      const password = 'password123';

      mockBcrypt.hash.mockRejectedValue(new Error('Hashing error') as never);

      await expect(AuthService.hashPassword(password)).rejects.toThrow('Hashing error');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userId = 'user123';
      const hashedPassword = 'newhashedpassword';

      mockUserRepository.findByIdAndUpdate.mockResolvedValue(undefined);

      await AuthService.updatePassword(userId, hashedPassword);

      expect(mockUserRepository.findByIdAndUpdate).toHaveBeenCalledWith(
        expect.anything(),
        { password: hashedPassword }
      );
    });

    it('should handle update errors', async () => {
      const userId = 'user123';
      const hashedPassword = 'newhashedpassword';

      mockUserRepository.findByIdAndUpdate.mockRejectedValue(new Error('Update error'));

      await expect(AuthService.updatePassword(userId, hashedPassword)).rejects.toThrow('Update error');
    });
  });

  describe('insertGoogle', () => {
    it('should create Google user successfully', async () => {
      const profile = {
        emails: [{ value: 'google@example.com' }],
        displayName: 'Google User',
        photos: [{ value: 'avatar.jpg' }]
      };

      const newUser = {
        _id: 'newuser123',
        email: 'google@example.com',
        full_name: 'Google User'
      };

      mockUserRepository.create.mockResolvedValue(newUser as any);

      const result = await AuthService.insertGoogle(profile);

      expect(result).toEqual(newUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        email: 'google@example.com',
        full_name: 'Google User',
        avatar_url: 'avatar.jpg',
        email_verified: true,
        status: true,
        role: 'customer'
      });
    });

    it('should handle creation errors', async () => {
      const profile = {
        emails: [{ value: 'google@example.com' }],
        displayName: 'Google User'
      };

      mockUserRepository.create.mockRejectedValue(new Error('Creation error'));

      await expect(AuthService.insertGoogle(profile)).rejects.toThrow('Creation error');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty email in login', async () => {
      const loginRequest: LoginRequest = {
        email: '',
        password: 'password123'
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await AuthService.login(loginRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email hoặc mật khẩu không đúng');
    });

    it('should handle null values gracefully', async () => {
      const result = await AuthService.verifyOldPassword('', '');

      expect(result).toBe(false);
    });

    it('should handle Redis connection errors', async () => {
      mockRedisClient.setex.mockRejectedValue(new Error('Redis connection error'));
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const registerRequest: RegisterRequest = {
        email: 'test@example.com',
        password: 'password123',
        confirm_password: 'password123',
        full_name: 'Test User',
        phone: '1234567890',
        date_of_birth: new Date('1990-01-01'),
        gender: 'female'
      };

      const result = await AuthService.register(registerRequest);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Đã xảy ra lỗi trong quá trình đăng ký');
    });
  });
});