import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Mock external services
jest.mock('../services/googleMeetService', () => ({
  GoogleMeetService: {
    createMeeting: jest.fn().mockResolvedValue({
      success: true,
      meeting: {
        meet_url: 'https://meet.google.com/test-meeting',
        meeting_id: 'test-meeting-id',
        meeting_password: 'test-password'
      }
    })
  }
}));

jest.mock('../services/emailNotificationService', () => ({
  EmailNotificationService: {
    sendAppointmentConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendAppointmentReminder: jest.fn().mockResolvedValue({ success: true }),
    sendAppointmentCancellation: jest.fn().mockResolvedValue({ success: true }),
    sendStiOrderConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendStiResultNotification: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../utils/mailUtils', () => ({
  MailUtils: {
    sendStiOrderConfirmation: jest.fn().mockResolvedValue({ success: true }),
    sendEmail: jest.fn().mockResolvedValue({ success: true })
  }
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
jest.setTimeout(30000);