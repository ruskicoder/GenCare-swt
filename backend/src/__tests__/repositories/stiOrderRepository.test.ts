import { StiOrderRepository } from '../../repositories/stiOrderRepository';
import { TestDataFactory } from '../fixtures/testDataFactory';
import { StiOrder } from '../../models/StiOrder';
import mongoose from 'mongoose';

describe('StiOrderRepository', () => {
  let testUser: any;
  let testStiTest: any;
  let testStiPackage: any;
  let testStiSchedule: any;
  let testOrder: any;

  beforeEach(async () => {
    testUser = await TestDataFactory.createTestUser();
    testStiTest = await TestDataFactory.createTestStiTest();
    testStiPackage = await TestDataFactory.createTestStiPackage();
    testStiSchedule = await TestDataFactory.createTestStiTestSchedule();

    // Create a test order using the model directly
    const orderData = {
      customer_id: testUser._id,
      sti_schedule_id: testStiSchedule._id,
      order_date: new Date(),
      total_amount: 100,
      payment_status: 'Pending' as const,
      order_status: 'Booked' as const,
      notes: 'Test order'
    };

    testOrder = await StiOrder.create(orderData);
  });

  describe('insertStiOrder', () => {
    it('should create a new STI order', async () => {
      const orderData = {
        customer_id: testUser._id,
        sti_schedule_id: testStiSchedule._id,
        order_date: new Date(),
        total_amount: 200,
        payment_status: 'Pending' as const,
        order_status: 'Booked' as const,
        notes: 'New test order'
      };

      const result = await StiOrderRepository.insertStiOrder(orderData);

      expect(result).toBeDefined();
      expect(result?._id).toBeDefined();
      expect(result?.customer_id.toString()).toBe(testUser._id.toString());
      expect(result?.total_amount).toBe(200);
      expect(result?.order_status).toBe('Booked');
    });

    it('should handle creation errors', async () => {
      const invalidOrderData = {
        // Missing required fields
        customer_id: testUser._id,
        // Missing other required fields
      };

      await expect(StiOrderRepository.insertStiOrder(invalidOrderData as any))
        .rejects.toThrow();
    });
  });

  describe('findOrderById', () => {
    it('should find order by ID', async () => {
      const result = await StiOrderRepository.findOrderById(testOrder._id.toString());

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(testOrder._id.toString());
      expect(result?.order_status).toBe('Booked');
    });

    it('should return null for non-existent ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiOrderRepository.findOrderById(nonExistentId);

      expect(result).toBeNull();
    });

    it('should handle invalid ID format', async () => {
      await expect(StiOrderRepository.findOrderById('invalid-id'))
        .rejects.toThrow();
    });
  });

  describe('getOrdersByCustomer', () => {
    it('should find orders by customer ID', async () => {
      const result = await StiOrderRepository.getOrdersByCustomer(testUser._id.toString());

      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBeGreaterThan(0);
      expect(result?.[0].customer_id.toString()).toBe(testUser._id.toString());
    });

    it('should return empty array for non-existent customer', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiOrderRepository.getOrdersByCustomer(nonExistentId);

      expect(Array.isArray(result)).toBe(true);
      expect(result?.length).toBe(0);
    });

    it('should exclude canceled orders', async () => {
      // Create a canceled order
      const canceledOrderData = {
        customer_id: testUser._id,
        sti_schedule_id: testStiSchedule._id,
        order_date: new Date(),
        total_amount: 150,
        payment_status: 'Pending' as const,
        order_status: 'Canceled' as const,
        notes: 'Canceled order'
      };
      await StiOrder.create(canceledOrderData);

      const result = await StiOrderRepository.getOrdersByCustomer(testUser._id.toString());

      expect(Array.isArray(result)).toBe(true);
      // Should only return non-canceled orders
      result?.forEach(order => {
        expect(order.order_status).not.toBe('Canceled');
      });
    });
  });

  describe('getOrdersByTestScheduleId', () => {
    it('should find orders by test schedule ID', async () => {
      const result = await StiOrderRepository.getOrdersByTestScheduleId(testStiSchedule);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('saveOrder', () => {
    it('should save order changes', async () => {
      // Modify the order
      testOrder.order_status = 'Accepted';
      testOrder.payment_status = 'Paid';

      const result = await StiOrderRepository.saveOrder(testOrder);

      expect(result).toBeDefined();
      expect(result.order_status).toBe('Accepted');
      expect(result.payment_status).toBe('Paid');
    });
  });

  describe('getTotalRevenueByCustomer', () => {
    it('should calculate total revenue for customer', async () => {
      // Create a completed and paid order
      const completedOrderData = {
        customer_id: testUser._id,
        sti_schedule_id: testStiSchedule._id,
        order_date: new Date(),
        total_amount: 300,
        payment_status: 'Paid' as const,
        order_status: 'Completed' as const,
        notes: 'Completed order'
      };
      await StiOrder.create(completedOrderData);

      const result = await StiOrderRepository.getTotalRevenueByCustomer(testUser._id.toString());

      expect(result).toBe(300);
    });

    it('should return 0 for customer with no completed orders', async () => {
      const newUser = await TestDataFactory.createTestUser({
        email: 'new@example.com'
      });

      const result = await StiOrderRepository.getTotalRevenueByCustomer(newUser._id.toString());

      expect(result).toBe(0);
    });
  });

  describe('getTotalRevenue', () => {
    it('should calculate total revenue across all customers', async () => {
      // Create multiple completed and paid orders
      const order1Data = {
        customer_id: testUser._id,
        sti_schedule_id: testStiSchedule._id,
        order_date: new Date(),
        total_amount: 200,
        payment_status: 'Paid' as const,
        order_status: 'Completed' as const,
        notes: 'Order 1'
      };

      const secondUser = await TestDataFactory.createTestUser({
        email: 'second@example.com'
      });

      const order2Data = {
        customer_id: secondUser._id,
        sti_schedule_id: testStiSchedule._id,
        order_date: new Date(),
        total_amount: 150,
        payment_status: 'Paid' as const,
        order_status: 'Completed' as const,
        notes: 'Order 2'
      };

      await StiOrder.create(order1Data);
      await StiOrder.create(order2Data);

      const result = await StiOrderRepository.getTotalRevenue();

      expect(result).toBe(350);
    });

    it('should return 0 when no completed orders exist', async () => {
      // Clear all orders
      await StiOrder.deleteMany({});

      const result = await StiOrderRepository.getTotalRevenue();

      expect(result).toBe(0);
    });
  });

  describe('getOrderWithTests', () => {
    it('should get order with populated test information', async () => {
      const result = await StiOrderRepository.getOrderWithTests(testOrder._id.toString());

      expect(result).toBeDefined();
      expect(result?._id.toString()).toBe(testOrder._id.toString());
    });

    it('should return null for non-existent order', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const result = await StiOrderRepository.getOrderWithTests(nonExistentId);

      expect(result).toBeNull();
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results', async () => {
      const filters = {};
      const page = 1;
      const limit = 10;

      const result = await StiOrderRepository.findWithPagination(filters, page, limit);

      expect(result).toBeDefined();
      expect(result.orders).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
      expect(typeof result.total).toBe('number');
    });

    it('should filter by order status', async () => {
      const filters = { order_status: 'Booked' };
      const page = 1;
      const limit = 10;

      const result = await StiOrderRepository.findWithPagination(filters, page, limit);

      expect(result).toBeDefined();
      expect(Array.isArray(result.orders)).toBe(true);
      result.orders.forEach(order => {
        expect(order.order_status).toBe('Booked');
      });
    });
  });
});