import { StiService } from '../../services/stiService';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { StiOrder } from '../../models/StiOrder';
import { StiTest } from '../../models/StiTest';
import { StiPackage } from '../../models/StiPackage';
import { StiTestSchedule } from '../../models/StiTestSchedule';
import { User } from '../../models/User';
import mongoose from 'mongoose';

describe('StiService', () => {
  let testUser: any;
  let testStiTest: any;
  let testStiPackage: any;
  let testStiSchedule: any;

  beforeEach(async () => {
    // Create test data for each test
    testUser = await TestDataFactory.createTestUser();
    testStiTest = await TestDataFactory.createTestStiTest();
    testStiPackage = await TestDataFactory.createTestStiPackage();
    testStiSchedule = await TestDataFactory.createTestStiTestSchedule();
  });

  describe('createStiOrder', () => {
    describe('Happy Path', () => {
      it('should successfully create STI order with package', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Test order notes'
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully') || expect(result.message).toContain('created');
        expect(result.stiorder).toBeDefined();
      });

      it('should successfully create STI order with individual tests', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          [testStiTest._id.toString()],
          testStiSchedule.test_date,
          'Individual test order'
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully') || expect(result.message).toContain('created');
        expect(result.stiorder).toBeDefined();
      });

      it('should successfully create STI order with both package and individual tests', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [testStiTest._id.toString()],
          testStiSchedule.test_date,
          'Combined order'
        );

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully') || expect(result.message).toContain('created');
        expect(result.stiorder).toBeDefined();
      });

      it('should create order with default status "Booked"', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Default status test'
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.order_status).toBe('Booked');
      });

      it('should create order with default payment status "Pending"', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Payment status test'
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.payment_status).toBe('Pending');
      });

      it('should create order with empty notes', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          ''
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.notes).toBe('');
      });
    });

    describe('Business Rule Validations', () => {
      it('should reject order with neither package nor individual tests', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          [],
          testStiSchedule.test_date,
          'Empty order'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('must select');
      });

      it('should reject order with invalid customer ID', async () => {
        const result = await StiService.createStiOrder(
          'invalid-customer-id',
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Invalid customer'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('Customer not found') || expect(result.message).toContain('invalid');
      });

      it('should reject order with non-existent package ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          nonExistentId,
          [],
          testStiSchedule.test_date,
          'Non-existent package'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('Package not found') || expect(result.message).toContain('not found');
      });

      it('should reject order with non-existent test ID', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          [nonExistentId],
          testStiSchedule.test_date,
          'Non-existent test'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('Test not found') || expect(result.message).toContain('not found');
      });

      it('should reject order with past date', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          pastDate,
          'Past date order'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('past') || expect(result.message).toContain('invalid date');
      });

      it('should reject order with inactive package', async () => {
        const inactivePackage = await TestDataFactory.createTestStiPackage({
          sti_package_code: 'INACTIVE01',
          is_active: false
        });

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          inactivePackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Inactive package'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('inactive') || expect(result.message).toContain('not available');
      });

      it('should reject order with inactive test', async () => {
        const inactiveTest = await TestDataFactory.createTestStiTest({
          sti_test_code: 'INACTIVE01',
          is_active: false
        });

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          [inactiveTest._id.toString()],
          testStiSchedule.test_date,
          'Inactive test'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('inactive') || expect(result.message).toContain('not available');
      });
    });

    describe('Edge Cases', () => {
      it('should handle very long notes', async () => {
        const longNotes = 'a'.repeat(1000);
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          longNotes
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.notes).toBe(longNotes);
      });

      it('should handle null notes', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          null as any
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.notes).toBeNull();
      });

      it('should handle multiple individual tests', async () => {
        const secondTest = await TestDataFactory.createTestStiTest({
          sti_test_code: 'TST002',
          sti_test_name: 'Second Test'
        });

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          [testStiTest._id.toString(), secondTest._id.toString()],
          testStiSchedule.test_date,
          'Multiple tests'
        );

        expect(result.success).toBe(true);
        expect(result.stiorder?.sti_test_items).toHaveLength(2);
      });

      it('should handle exact date boundary', async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          tomorrow,
          'Boundary date'
        );

        expect(result.success).toBe(true);
      });

      it('should handle timezone considerations', async () => {
        const utcDate = new Date();
        utcDate.setUTCHours(utcDate.getUTCHours() + 24);

        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          utcDate,
          'UTC date'
        );

        expect(result.success).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle malformed ObjectId for customer', async () => {
        const result = await StiService.createStiOrder(
          'not-a-valid-objectid',
          testStiPackage._id.toString(),
          [],
          testStiSchedule.test_date,
          'Malformed customer ID'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
      });

      it('should handle malformed ObjectId for package', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          'not-a-valid-objectid',
          [],
          testStiSchedule.test_date,
          'Malformed package ID'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
      });

      it('should handle malformed ObjectId for test', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          '',
          ['not-a-valid-objectid'],
          testStiSchedule.test_date,
          'Malformed test ID'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
      });

      it('should handle invalid date format', async () => {
        const result = await StiService.createStiOrder(
          testUser._id.toString(),
          testStiPackage._id.toString(),
          [],
          'invalid-date' as any,
          'Invalid date'
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('invalid') || expect(result.message).toContain('date');
      });

      it('should handle null parameters', async () => {
        const result = await StiService.createStiOrder(
          null as any,
          null as any,
          null as any,
          null as any,
          null as any
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('invalid');
      });

      it('should handle empty string parameters', async () => {
        const result = await StiService.createStiOrder(
          '',
          '',
          [],
          '' as any,
          ''
        );

        expect(result.success).toBe(false);
        expect(result.message).toContain('required') || expect(result.message).toContain('invalid');
      });
    });
  });

  describe('getOrdersByCustomer', () => {
    beforeEach(async () => {
      // Create test orders
      await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [],
        testStiSchedule.test_date,
        'Test order 1'
      );
      await StiService.createStiOrder(
        testUser._id.toString(),
        '',
        [testStiTest._id.toString()],
        testStiSchedule.test_date,
        'Test order 2'
      );
    });

    it('should retrieve customer orders successfully', async () => {
      const result = await StiService.getOrdersByCustomer(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.stiorder).toHaveLength(2);
    });

    it('should return empty array for customer with no orders', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'new@example.com'
      });

      const result = await StiService.getOrdersByCustomer(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.stiorder).toHaveLength(0);
    });

    it('should handle invalid customer ID', async () => {
      const result = await StiService.getOrdersByCustomer('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('invalid') || expect(result.message).toContain('not found');
    });
  });

  describe('updateOrder', () => {
    let testOrder: any;

    beforeEach(async () => {
      const orderResult = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [],
        testStiSchedule.test_date,
        'Test order for update'
      );
      testOrder = orderResult.stiorder;
    });

    it('should successfully update order status', async () => {
      const result = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Accepted' },
        testUser._id.toString(),
        'staff'
      );

      expect(result.success).toBe(true);
      expect(result.stiorder?.order_status).toBe('Accepted');
    });

    it('should successfully update payment status', async () => {
      const result = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { payment_status: 'Paid' },
        testUser._id.toString(),
        'staff'
      );

      expect(result.success).toBe(true);
      expect(result.stiorder?.payment_status).toBe('Paid');
    });

    it('should reject invalid status transitions', async () => {
      const result = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'InvalidStatus' },
        testUser._id.toString(),
        'staff'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('invalid') || expect(result.message).toContain('status');
    });

    it('should reject updates by unauthorized users', async () => {
      const result = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Accepted' },
        testUser._id.toString(),
        'customer'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('permission') || expect(result.message).toContain('unauthorized');
    });

    it('should handle non-existent order ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiService.updateOrder(
        nonExistentId,
        { order_status: 'Accepted' },
        testUser._id.toString(),
        'staff'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Order Status Workflow', () => {
    let testOrder: any;

    beforeEach(async () => {
      const orderResult = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [],
        testStiSchedule.test_date,
        'Workflow test order'
      );
      testOrder = orderResult.stiorder;
    });

    it('should handle complete order workflow', async () => {
      // Start with Booked status
      expect(testOrder?.order_status).toBe('Booked');

      // Accept order
      const acceptResult = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Accepted' },
        testUser._id.toString(),
        'staff'
      );
      expect(acceptResult.success).toBe(true);

      // Process order
      const processResult = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Processing' },
        testUser._id.toString(),
        'staff'
      );
      expect(processResult.success).toBe(true);

      // Collect specimen
      const collectResult = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'SpecimenCollected' },
        testUser._id.toString(),
        'staff'
      );
      expect(collectResult.success).toBe(true);

      // Testing
      const testingResult = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Testing' },
        testUser._id.toString(),
        'staff'
      );
      expect(testingResult.success).toBe(true);

      // Complete
      const completeResult = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Completed' },
        testUser._id.toString(),
        'staff'
      );
      expect(completeResult.success).toBe(true);
    });

    it('should handle order cancellation', async () => {
      const result = await StiService.updateOrder(
        testOrder?._id?.toString() || '',
        { order_status: 'Canceled' },
        testUser._id.toString(),
        'staff'
      );

      expect(result.success).toBe(true);
      expect(result.stiorder?.order_status).toBe('Canceled');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete STI order lifecycle', async () => {
      // Create order
      const createResult = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [],
        testStiSchedule.test_date,
        'Integration test order'
      );
      expect(createResult.success).toBe(true);

      const order = createResult.stiorder;
      const orderId = order?._id?.toString() || '';

      // Update to accepted
      const acceptResult = await StiService.updateOrder(
        orderId,
        { order_status: 'Accepted' },
        testUser._id.toString(),
        'staff'
      );
      expect(acceptResult.success).toBe(true);

      // Update payment to paid
      const paymentResult = await StiService.updateOrder(
        orderId,
        { payment_status: 'Paid' },
        testUser._id.toString(),
        'staff'
      );
      expect(paymentResult.success).toBe(true);

      // Complete order
      const completeResult = await StiService.updateOrder(
        orderId,
        { order_status: 'Completed' },
        testUser._id.toString(),
        'staff'
      );
      expect(completeResult.success).toBe(true);

      // Verify final state
      const finalOrder = completeResult.stiorder;
      expect(finalOrder?.order_status).toBe('Completed');
      expect(finalOrder?.payment_status).toBe('Paid');
    });
  });
});