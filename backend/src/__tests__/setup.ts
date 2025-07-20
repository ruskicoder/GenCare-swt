import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Create mock services that we've removed
const mockServices = {
  GoogleMeetService: {
    createMeeting: jest.fn().mockResolvedValue({
      success: true,
      data: { meeting_url: 'https://meet.google.com/test-123' }
    })
  }
};

// Mock all external dependencies that may not exist
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-123' })
  }))
}));

// Mock Redis client
jest.mock('../configs/redis', () => ({
  default: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    quit: jest.fn(),
    disconnect: jest.fn()
  }
}));

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  // Start MongoDB Memory Server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  // Clean up
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear all collections before each test
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterEach(async () => {
  // Clear all mocks after each test
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(60000);