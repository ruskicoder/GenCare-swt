# GenCare Healthcare Management System - Backend Documentation

## Project Overview
GenCare is a comprehensive healthcare management system built with Node.js, TypeScript, Express, and MongoDB. The system manages appointments, STI testing, and menstrual cycle tracking.

## Architecture

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Caching**: Redis
- **Container**: Docker
- **Authentication**: JWT + Passport.js (Google OAuth)
- **Security**: Helmet, CORS, Express Rate Limit
- **Testing**: Jest (configured)

### Project Structure
```
backend/src/
├── app.ts                 # Main application entry point
├── configs/               # Configuration files
│   ├── database.ts       # MongoDB connection
│   ├── passport.ts       # Authentication config
│   └── redis.ts          # Redis configuration
├── controllers/          # API endpoints
├── services/             # Business logic layer
├── repositories/         # Data access layer
├── models/               # Mongoose schemas
├── middlewares/          # Express middlewares
├── dto/                  # Data transfer objects
├── utils/                # Utility functions
└── scripts/              # Helper scripts
```

## Core Business Functions

### 1. Appointment Booking System

#### Key Components:
- **Model**: `Appointment.ts` - Defines appointment structure
- **Service**: `AppointmentService.bookAppointment()` - Core booking logic
- **Controller**: `appointmentController.ts` - API endpoints
- **Repository**: `AppointmentRepository` - Data access

#### Business Rules:
1. **Pending Limit**: Users can only have one pending appointment
2. **Lead Time**: Minimum 2-hour advance booking required
3. **Consultant Availability**: Checks weekly schedule and conflicts
4. **Working Hours**: Validates against consultant's working hours
5. **No Overlap**: Prevents double-booking consultants

#### Key Features:
- Real-time availability checking
- Google Meet integration
- Email notifications
- Appointment status management (pending → confirmed → completed)
- Feedback system
- Cancellation with business rules

### 2. STI Test Booking System

#### Key Components:
- **Models**: `StiOrder.ts`, `StiPackage.ts`, `StiTest.ts`
- **Service**: `StiService.createStiOrder()` - Core booking logic
- **Controller**: `stiController.ts` - API endpoints
- **Repository**: `StiOrderRepository` - Data access

#### Business Rules:
1. **Package or Individual**: Can book packages or individual tests
2. **Schedule Integration**: Links to test schedules
3. **Payment Tracking**: Manages payment status
4. **Order Status Flow**: Booked → Accepted → Processing → SpecimenCollected → Testing → Completed

#### Key Features:
- Package and individual test selection
- Order scheduling
- Payment status tracking
- Result management
- Audit logging
- Email notifications

### 3. Menstrual Cycle Management

#### Key Components:
- **Model**: `MenstrualCycle.ts` - Cycle data structure
- **Service**: `MenstrualCycleService.processPeriodDays()` - Core processing
- **Controller**: `menstrualCycleController.ts` - API endpoints
- **Repository**: `MenstrualCycleRepository` - Data access

#### Business Rules:
1. **Cycle Grouping**: Consecutive period days form one cycle
2. **Prediction Algorithm**: 14-day luteal phase calculation
3. **Duplicate Prevention**: Removes duplicate dates
4. **Cycle Length**: Standard 28-day cycle with variations

#### Key Features:
- Period day tracking
- Cycle prediction
- Fertility window calculation
- Ovulation prediction
- Statistics and trends
- Notification settings

## Database Schema Overview

### Appointment Schema
```typescript
{
  customer_id: ObjectId (ref: User)
  consultant_id: ObjectId (ref: Consultant)
  appointment_date: Date
  start_time: string (HH:mm format)
  end_time: string (HH:mm format)
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress'
  meeting_info: {
    meet_url: string
    meeting_id: string
    created_at: Date
    reminder_sent: boolean
  }
  feedback: {
    rating: number (1-5)
    comment: string
    feedback_date: Date
  }
}
```

### STI Order Schema
```typescript
{
  customer_id: ObjectId (ref: Customer)
  consultant_id: ObjectId (ref: Staff)
  sti_package_item: {
    sti_package_id: ObjectId
    sti_test_ids: ObjectId[]
  }
  sti_test_items: ObjectId[]
  sti_schedule_id: ObjectId
  order_date: Date
  order_status: 'Booked' | 'Accepted' | 'Processing' | 'SpecimenCollected' | 'Testing' | 'Completed' | 'Canceled'
  total_amount: number
  payment_status: 'Pending' | 'Paid' | 'Failed'
}
```

### Menstrual Cycle Schema
```typescript
{
  user_id: ObjectId (ref: User)
  cycle_start_date: Date
  period_days: Date[]
  cycle_length: number
  predicted_cycle_end: Date
  predicted_ovulation_date: Date
  predicted_fertile_start: Date
  predicted_fertile_end: Date
  notification_enabled: boolean
  notification_types: ('period' | 'ovulation' | 'fertile_start' | 'fertile_end')[]
}
```

## External Dependencies

### Google Meet Integration
- **Service**: `GoogleMeetService`
- **Purpose**: Create meeting links for appointments
- **Dependencies**: Google APIs, OAuth tokens

### Email Notifications
- **Service**: `EmailNotificationService`
- **Purpose**: Send appointment confirmations, reminders
- **Dependencies**: Nodemailer

### Redis Cache
- **Purpose**: Session management, caching
- **Configuration**: Docker container on port 6379

## Setup Instructions

### Development Environment
1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   ```bash
   MONGODB_URI=mongodb://127.0.0.1:27017/gencare
   PORT=3000
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

3. **Start Redis**:
   ```bash
   cd redis-docker
   docker-compose up -d
   ```

4. **Run Application**:
   ```bash
   npm run dev
   ```

### Testing Setup
- **Framework**: Jest with TypeScript support
- **Database**: MongoDB Memory Server for isolated testing
- **Mocking**: External services (Google Meet, Email)

## Testing Strategy

### Unit Test Coverage Areas

#### 1. Appointment Booking Tests
- **Happy Path**: Valid appointment booking
- **Business Rules**: 
  - Pending appointment limit
  - 2-hour lead time validation
  - Consultant availability checking
  - Working hours validation
- **Edge Cases**: 
  - Overlapping appointments
  - Invalid time formats
  - Past date booking
  - Non-existent consultants
- **Error Handling**: 
  - Database failures
  - Invalid input data
  - Missing required fields

#### 2. STI Test Booking Tests
- **Happy Path**: Package and individual test booking
- **Business Rules**:
  - Package vs individual test selection
  - Schedule availability
  - Payment validation
- **Edge Cases**:
  - Non-existent packages/tests
  - Invalid schedule dates
  - Duplicate orders
- **Error Handling**:
  - Invalid customer IDs
  - Package/test not found
  - Database failures

#### 3. Menstrual Cycle Management Tests
- **Happy Path**: Period day processing and predictions
- **Business Rules**:
  - Cycle grouping logic
  - Prediction algorithms
  - Duplicate prevention
- **Edge Cases**:
  - Empty period days
  - Invalid dates
  - Overlapping cycles
- **Error Handling**:
  - Invalid user IDs
  - Malformed date inputs
  - Database failures

### Test Data Management
- **Fixtures**: Predefined test data
- **Factories**: Dynamic test data generation
- **Cleanup**: Automated database cleanup between tests
- **Isolation**: Each test runs in isolation

## Performance Considerations
- **Database Indexes**: Optimized for common queries
- **Connection Pooling**: MongoDB connection management
- **Caching**: Redis for session and frequent data
- **Rate Limiting**: API protection against abuse

## Security Measures
- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Input Validation**: Joi schema validation
- **Security Headers**: Helmet middleware
- **Rate Limiting**: Protection against brute force
- **CORS**: Controlled cross-origin requests

## Monitoring & Logging
- **Error Handling**: Centralized error handling middleware
- **Audit Logs**: STI order tracking
- **Database Logging**: MongoDB query logging
- **Application Logs**: Structured logging for debugging