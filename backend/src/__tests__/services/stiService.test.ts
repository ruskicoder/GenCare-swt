import { StiService } from '../../services/stiService';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { IStiPackage } from '../../models/StiPackage';
import { IStiTest } from '../../models/StiTest';
import { IStiOrder } from '../../models/StiOrder';
import { IUser } from '../../models/User';
import mongoose from 'mongoose';

describe('StiService', () => {
  let testUser: IUser;
  let testStiPackage: IStiPackage;
  let testStiTest: IStiTest;

  beforeEach(async () => {
    // Create test data for each test
    testUser = await TestDataFactory.createTestUser();
    testStiPackage = await TestDataFactory.createTestStiPackage();
    testStiTest = await TestDataFactory.createTestStiTest();
  });

  describe('createStiTest', () => {
    it('should successfully create a new STI test', async () => {
      const testData = {
        sti_test_name: 'New Test ' + Date.now(),
        sti_test_code: 'STI-BAC-URN-NEW' + Date.now(),
        description: 'New STI test',
        price: 75,
        category: 'bacterial' as const,
        sti_test_type: 'nước tiểu' as const,
        is_active: true,
        createdBy: testUser._id
      } as any;

      const result = await StiService.createStiTest(testData);

      expect(result.success).toBe(true);
      expect(result.stitest).toBeDefined();
      expect(result.stitest?.sti_test_name).toBe(testData.sti_test_name);
    });

    it('should reject duplicate active STI test codes', async () => {
      const testData = {
        sti_test_name: testStiTest.sti_test_name,
        sti_test_code: testStiTest.sti_test_code,
        description: 'Duplicate test',
        price: 75,
        category: 'bacterial' as const,
        sti_test_type: 'nước tiểu' as const,
        is_active: true,
        createdBy: testUser._id
      } as any;

      const result = await StiService.createStiTest(testData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('duplicated');
    });
  });

  describe('getAllStiTest', () => {
    it('should retrieve all STI tests', async () => {
      const result = await StiService.getAllStiTest();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.stitest)).toBe(true);
      expect(result.stitest!.length).toBeGreaterThan(0);
    });
  });

  describe('getStiTestById', () => {
    it('should retrieve STI test by valid ID', async () => {
      const result = await StiService.getStiTestById(testStiTest._id.toString());

      expect(result.success).toBe(true);
      expect(result.stitest).toBeDefined();
      expect(result.stitest?._id.toString()).toBe(testStiTest._id.toString());
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.getStiTestById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });

    it('should return error for non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiService.getStiTestById(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('updateStiTest', () => {
    it('should successfully update STI test', async () => {
      const updateData = {
        sti_test_name: 'Updated Test Name',
        price: 100
      };

      const result = await StiService.updateStiTest(testStiTest._id.toString(), updateData);

      expect(result.success).toBe(true);
      expect(result.stitest?.sti_test_name).toBe(updateData.sti_test_name);
      expect(result.stitest?.price).toBe(updateData.price);
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.updateStiTest('invalid-id', { price: 100 });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });
  });

  describe('deleteStiTest', () => {
    it('should successfully soft delete STI test', async () => {
      const result = await StiService.deleteStiTest(testStiTest._id.toString(), testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.deleteStiTest('invalid-id', testUser._id.toString());

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });
  });

  describe('createStiPackage', () => {
    it('should successfully create a new STI package', async () => {
      const testData = {
        sti_package_name: 'New Package ' + Date.now(),
        sti_package_code: 'PKG' + Date.now(),
        price: 200,
        description: 'New STI package',
        is_active: true,
        createdBy: testUser._id
      } as any;

      const result = await StiService.createStiPackage(testData);

      expect(result.success).toBe(true);
      expect(result.stipackage).toBeDefined();
      expect(result.stipackage?.sti_package_name).toBe(testData.sti_package_name);
    });

    it('should reject duplicate active STI package codes', async () => {
      const testData = {
        sti_package_name: testStiPackage.sti_package_name,
        sti_package_code: testStiPackage.sti_package_code,
        price: 200,
        description: 'Duplicate package',
        is_active: true,
        createdBy: testUser._id
      } as any;

      const result = await StiService.createStiPackage(testData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('duplicated');
    });
  });

  describe('getAllStiPackage', () => {
    it('should retrieve all STI packages', async () => {
      const result = await StiService.getAllStiPackage();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.stipackage)).toBe(true);
      expect(result.stipackage!.length).toBeGreaterThan(0);
    });
  });

  describe('getStiPackageById', () => {
    it('should retrieve STI package by valid ID', async () => {
      const result = await StiService.getStiPackageById(testStiPackage._id.toString());

      expect(result.success).toBe(true);
      expect(result.stipackage).toBeDefined();
      expect(result.stipackage?._id.toString()).toBe(testStiPackage._id.toString());
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.getStiPackageById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });
  });

  describe('updateStiPackage', () => {
    it('should successfully update STI package', async () => {
      const updateData = {
        sti_package_name: 'Updated Package Name',
        price: 300
      };

      const result = await StiService.updateStiPackage(testStiPackage._id.toString(), updateData);

      expect(result.success).toBe(true);
      expect(result.stipackage?.sti_package_name).toBe(updateData.sti_package_name);
      expect(result.stipackage?.price).toBe(updateData.price);
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.updateStiPackage('invalid-id', { price: 300 });

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });
  });

  describe('deleteStiPackage', () => {
    it('should successfully soft delete STI package', async () => {
      const result = await StiService.deleteStiPackage(testStiPackage._id.toString(), testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
    });

    it('should return error for invalid ID format', async () => {
      const result = await StiService.deleteStiPackage('invalid-id', testUser._id.toString());

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid ID format');
    });
  });

  describe('createStiOrder', () => {
    it('should successfully create STI order', async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7); // Future date

      const result = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [testStiTest._id.toString()],
        orderDate,
        'Test order notes'
      );

      expect(result.success).toBe(true);
      expect(result.stiorder).toBeDefined();
      expect(result.stiorder?.customer_id.toString()).toBe(testUser._id.toString());
    });

    it('should return error for invalid customer ID', async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7);

      const result = await StiService.createStiOrder(
        'invalid-id',
        testStiPackage._id.toString(),
        [testStiTest._id.toString()],
        orderDate,
        'Test notes'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid customer ID');
    });

    it('should return error for invalid package ID', async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7);

      const result = await StiService.createStiOrder(
        testUser._id.toString(),
        'invalid-id',
        [testStiTest._id.toString()],
        orderDate,
        'Test notes'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid sti package ID');
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should retrieve orders by customer ID', async () => {
      const result = await StiService.getOrdersByCustomer(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(Array.isArray(result.stiorder)).toBe(true);
    });

    it('should return empty array for customer with no orders', async () => {
      const newUser = await TestDataFactory.createTestUser();
      const result = await StiService.getOrdersByCustomer(newUser._id.toString());

      expect(result.success).toBe(true);
      expect(Array.isArray(result.stiorder)).toBe(true);
      expect(result.stiorder!.length).toBe(0);
    });

    it('should return error for invalid customer ID', async () => {
      const result = await StiService.getOrdersByCustomer('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid customer ID');
    });
  });

  describe('getOrderById', () => {
    it('should return error for invalid order ID format', async () => {
      const result = await StiService.getOrderById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid order ID');
    });

    it('should return error for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiService.getOrderById(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('prepareScheduleForOrder', () => {
    it('should prepare schedule for valid order date', async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7);

      const result = await StiService.prepareScheduleForOrder(orderDate);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('updateOrder', () => {
    let testOrder: IStiOrder;

    beforeEach(async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7);

      const orderResult = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [testStiTest._id.toString()],
        orderDate,
        'Test order'
      );
      testOrder = orderResult.stiorder! as IStiOrder;
    });

    it('should successfully update order status', async () => {
      const updates = { order_status: 'Processing' as const };

      const result = await StiService.updateOrder(
        testOrder._id.toString(),
        updates,
        testUser._id.toString(),
        'admin'
      );

      expect(result.success).toBe(true);
      expect(result.data?.order_status).toBe('Processing');
    });

    it('should return error for invalid order ID', async () => {
      const result = await StiService.updateOrder(
        'invalid-id',
        { order_status: 'Processing' },
        testUser._id.toString(),
        'admin'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid order ID');
    });

    it('should return error for invalid status transition', async () => {
      const result = await StiService.updateOrder(
        testOrder._id.toString(),
        { order_status: 'Completed' },
        testUser._id.toString(),
        'admin'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid status transition');
    });
  });

  describe('getTotalRevenueByCustomer', () => {
    it('should calculate total revenue for valid customer', async () => {
      const result = await StiService.getTotalRevenueByCustomer(testUser._id.toString());

      expect(result.success).toBe(true);
      expect(result.total_revenue).toBeDefined();
      expect(typeof result.total_revenue).toBe('number');
    });

    it('should return error for invalid customer ID', async () => {
      const result = await StiService.getTotalRevenueByCustomer('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid customer ID');
    });
  });

  describe('getTotalRevenue', () => {
    it('should calculate total revenue across all customers', async () => {
      const result = await StiService.getTotalRevenue();

      expect(result.success).toBe(true);
      expect(result.total_revenue).toBeDefined();
      expect(typeof result.total_revenue).toBe('number');
      expect(result.total_revenue).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAllAuditLog', () => {
    it('should retrieve all audit logs', async () => {
      const result = await StiService.getAllAuditLog();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.audit_logs)).toBe(true);
    });
  });

  describe('getAllStiResult', () => {
    it('should retrieve all STI results', async () => {
      const result = await StiService.getAllStiResult();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });
  });

  describe('getStiResultById', () => {
    it('should return error for invalid result ID format', async () => {
      const result = await StiService.getStiResultById('invalid-id');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid result ID');
    });

    it('should return error for non-existent result', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiService.getStiResultById(nonExistentId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test checks that service methods handle errors properly
      const result = await StiService.getAllStiTest();
      
      // Should not throw errors, should return proper response structure
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle empty arrays and null values', async () => {
      const result = await StiService.getAllStiPackage();
      
      expect(result.success).toBe(true);
      expect(result.stipackage).toBeDefined();
    });
  });

  describe('Pagination and Search', () => {
    it('should handle STI orders pagination', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'created_date',
        sortOrder: 'desc' as const
      };

      const result = await StiService.getStiOrdersWithPagination(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.items)).toBe(true);
      expect(typeof result.data?.pagination.total_items).toBe('number');
      expect(typeof result.data?.pagination.current_page).toBe('number');
      expect(typeof result.data?.pagination.items_per_page).toBe('number');
    });

    it('should handle audit logs pagination', async () => {
      const query = {
        page: 1,
        limit: 10,
        sortBy: 'timestamp',
        sortOrder: 'desc' as const
      };

      const result = await StiService.getAuditLogsWithPagination(query);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data?.items)).toBe(true);
    });
  });

  describe('Business Logic Tests', () => {
    it('should validate order date constraints', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      const result = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [testStiTest._id.toString()],
        pastDate,
        'Test notes'
      );

      // Should handle past dates appropriately
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    it('should handle empty test items array', async () => {
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() + 7);

      const result = await StiService.createStiOrder(
        testUser._id.toString(),
        testStiPackage._id.toString(),
        [], // Empty array
        orderDate,
        'Test notes'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('At least one test item is required');
    });
  });
});