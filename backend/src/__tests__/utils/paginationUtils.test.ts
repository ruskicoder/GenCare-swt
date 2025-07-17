import { PaginationUtils } from '../../utils/paginationUtils';
import { PaginationQuery } from '../../dto/requests/PaginationRequest';
import { AppointmentHistoryQuery } from '../../dto/requests/AppointmentHistoryRequest';

describe('PaginationUtils', () => {
  describe('validatePagination', () => {
    it('should return default values for empty query', () => {
      const query: PaginationQuery = {};
      const result = PaginationUtils.validatePagination(query);

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort_by: 'publish_date',
        sort_order: -1
      });
    });

    it('should validate and normalize page parameter', () => {
      const testCases = [
        { input: { page: '5' as any }, expected: 5 },
        { input: { page: '0' as any }, expected: 1 },
        { input: { page: '-5' as any }, expected: 1 },
        { input: { page: 'invalid' as any }, expected: 1 },
        { input: { page: 100 }, expected: 100 }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = PaginationUtils.validatePagination(input);
        expect(result.page).toBe(expected);
      });
    });

    it('should validate and normalize limit parameter', () => {
      const testCases = [
        { input: { limit: '20' as any }, expected: 20 },
        { input: { limit: '0' as any }, expected: 1 },
        { input: { limit: '-10' as any }, expected: 1 },
        { input: { limit: '150' as any }, expected: 100 }, // Max limit
        { input: { limit: 'invalid' as any }, expected: 10 }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = PaginationUtils.validatePagination(input);
        expect(result.limit).toBe(expected);
      });
    });

    it('should handle sort_by parameter', () => {
      const result1 = PaginationUtils.validatePagination({ sort_by: 'title' });
      expect(result1.sort_by).toBe('title');

      const result2 = PaginationUtils.validatePagination({});
      expect(result2.sort_by).toBe('publish_date');
    });

    it('should handle sort_order parameter', () => {
      const result1 = PaginationUtils.validatePagination({ sort_order: 'asc' });
      expect(result1.sort_order).toBe(1);

      const result2 = PaginationUtils.validatePagination({ sort_order: 'desc' });
      expect(result2.sort_order).toBe(-1);

      const result3 = PaginationUtils.validatePagination({});
      expect(result3.sort_order).toBe(-1);
    });
  });

  describe('calculatePagination', () => {
    it('should calculate pagination info correctly', () => {
      const result = PaginationUtils.calculatePagination(100, 3, 10);

      expect(result).toEqual({
        current_page: 3,
        total_pages: 10,
        total_items: 100,
        items_per_page: 10,
        has_next: true,
        has_prev: true
      });
    });

    it('should handle first page', () => {
      const result = PaginationUtils.calculatePagination(50, 1, 10);

      expect(result.has_prev).toBe(false);
      expect(result.has_next).toBe(true);
    });

    it('should handle last page', () => {
      const result = PaginationUtils.calculatePagination(50, 5, 10);

      expect(result.has_prev).toBe(true);
      expect(result.has_next).toBe(false);
    });

    it('should handle single page', () => {
      const result = PaginationUtils.calculatePagination(5, 1, 10);

      expect(result).toEqual({
        current_page: 1,
        total_pages: 1,
        total_items: 5,
        items_per_page: 10,
        has_next: false,
        has_prev: false
      });
    });

    it('should handle zero items', () => {
      const result = PaginationUtils.calculatePagination(0, 1, 10);

      expect(result).toEqual({
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        items_per_page: 10,
        has_next: false,
        has_prev: false
      });
    });
  });

  describe('buildBlogFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildBlogFilter({});
      expect(result).toEqual({});
    });

    it('should filter by title search', () => {
      const result = PaginationUtils.buildBlogFilter({ search: 'test blog' });
      expect(result.title).toEqual({ $regex: 'test blog', $options: 'i' });
    });

    it('should filter by status', () => {
      const result = PaginationUtils.buildBlogFilter({ status: 'published' });
      expect(result.status).toBe('published');
    });

    it('should filter by category', () => {
      const result = PaginationUtils.buildBlogFilter({ category: 'tech' });
      expect(result.category).toBe('tech');
    });

    it('should filter by author', () => {
      const result = PaginationUtils.buildBlogFilter({ author: 'john' });
      expect(result.author).toBe('john');
    });

    it('should filter by date range', () => {
      const query = {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };
      const result = PaginationUtils.buildBlogFilter(query);

      expect(result.publish_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });

    it('should combine multiple filters', () => {
      const query = {
        search: 'test',
        status: 'published',
        category: 'tech',
        author: 'john'
      };
      const result = PaginationUtils.buildBlogFilter(query);

      expect(result.title).toEqual({ $regex: 'test', $options: 'i' });
      expect(result.status).toBe('published');
      expect(result.category).toBe('tech');
      expect(result.author).toBe('john');
    });
  });

  describe('sanitizeSearch', () => {
    it('should sanitize search string', () => {
      const testCases = [
        { input: 'normal text', expected: 'normal text' },
        { input: 'text with $regex', expected: 'text with \\$regex' },
        { input: 'text with ()', expected: 'text with \\(\\)' },
        { input: 'text [brackets]', expected: 'text \\[brackets\\]' },
        { input: 'text.with.dots', expected: 'text\\.with\\.dots' },
        { input: 'text*with*stars', expected: 'text\\*with\\*stars' },
        { input: 'text+plus+signs', expected: 'text\\+plus\\+signs' },
        { input: 'text?question?marks', expected: 'text\\?question\\?marks' },
        { input: 'text^caret^marks', expected: 'text\\^caret\\^marks' },
        { input: 'text|pipe|marks', expected: 'text\\|pipe\\|marks' },
        { input: 'text{curly}braces', expected: 'text\\{curly\\}braces' }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = PaginationUtils.sanitizeSearch(input);
        expect(result).toBe(expected);
      });
    });

    it('should handle empty and null inputs', () => {
      expect(PaginationUtils.sanitizeSearch('')).toBe('');
      expect(PaginationUtils.sanitizeSearch('   ')).toBe('   ');
    });
  });

  describe('buildBlogCommentFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildBlogCommentFilter({});
      expect(result).toEqual({});
    });

    it('should filter by blog_id', () => {
      const result = PaginationUtils.buildBlogCommentFilter({ blog_id: '123' });
      expect(result.blog_id).toBe('123');
    });

    it('should filter by commenter_name', () => {
      const result = PaginationUtils.buildBlogCommentFilter({ commenter_name: 'john' });
      expect(result.commenter_name).toBe('john');
    });

    it('should filter by commenter_email', () => {
      const result = PaginationUtils.buildBlogCommentFilter({ commenter_email: 'john@test.com' });
      expect(result.commenter_email).toBe('john@test.com');
    });

    it('should filter by content search', () => {
      const result = PaginationUtils.buildBlogCommentFilter({ search: 'test comment' });
      expect(result.content).toEqual({ $regex: 'test comment', $options: 'i' });
    });

    it('should filter by status', () => {
      const result = PaginationUtils.buildBlogCommentFilter({ status: 'approved' });
      expect(result.status).toBe('approved');
    });

    it('should filter by date range', () => {
      const query = {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };
      const result = PaginationUtils.buildBlogCommentFilter(query);

      expect(result.created_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });
  });

  describe('buildAppointmentFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildAppointmentFilter({});
      expect(result).toEqual({});
    });

    it('should filter by customer_id', () => {
      const result = PaginationUtils.buildAppointmentFilter({ customer_id: '123' });
      expect(result.customer_id).toBe('123');
    });

    it('should filter by consultant_id', () => {
      const result = PaginationUtils.buildAppointmentFilter({ consultant_id: '456' });
      expect(result.consultant_id).toBe('456');
    });

    it('should filter by status', () => {
      const result = PaginationUtils.buildAppointmentFilter({ status: 'confirmed' });
      expect(result.status).toBe('confirmed');
    });

    it('should filter by appointment type', () => {
      const result = PaginationUtils.buildAppointmentFilter({ appointment_type: 'online' });
      expect(result.appointment_type).toBe('online');
    });

    it('should filter by date range', () => {
      const query = {
        appointment_date_from: '2024-01-01',
        appointment_date_to: '2024-12-31'
      };
      const result = PaginationUtils.buildAppointmentFilter(query);

      expect(result.appointment_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });

    it('should filter by search term', () => {
      const result = PaginationUtils.buildAppointmentFilter({ search: 'test' });
      expect(result.$or).toEqual([
        { customer_notes: { $regex: 'test', $options: 'i' } },
        { consultant_notes: { $regex: 'test', $options: 'i' } }
      ]);
    });
  });

  describe('buildAppointmentHistoryFilter', () => {
    it('should return empty filter for empty query', () => {
      const query: AppointmentHistoryQuery = {};
      const result = PaginationUtils.buildAppointmentHistoryFilter(query);
      expect(result).toEqual({});
    });

    it('should filter by appointment_id', () => {
      const query: AppointmentHistoryQuery = { appointment_id: '123' };
      const result = PaginationUtils.buildAppointmentHistoryFilter(query);
      expect(result.appointment_id).toBe('123');
    });

    it('should filter by action', () => {
      const query: AppointmentHistoryQuery = { action: 'created' };
      const result = PaginationUtils.buildAppointmentHistoryFilter(query);
      expect(result.action).toBe('created');
    });

    it('should filter by date range', () => {
      const query: AppointmentHistoryQuery = {
        date_from: '2024-01-01',
        date_to: '2024-12-31'
      };
      const result = PaginationUtils.buildAppointmentHistoryFilter(query);

      expect(result.created_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });
  });

  describe('buildStiOrderFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildStiOrderFilter({});
      expect(result).toEqual({});
    });

    it('should filter by customer_id', () => {
      const result = PaginationUtils.buildStiOrderFilter({ customer_id: '123' });
      expect(result.customer_id).toBe('123');
    });

    it('should filter by order_status', () => {
      const result = PaginationUtils.buildStiOrderFilter({ order_status: 'completed' });
      expect(result.order_status).toBe('completed');
    });

    it('should filter by payment_status', () => {
      const result = PaginationUtils.buildStiOrderFilter({ payment_status: 'paid' });
      expect(result.payment_status).toBe('paid');
    });

    it('should filter by date range', () => {
      const query = {
        order_date_from: '2024-01-01',
        order_date_to: '2024-12-31'
      };
      const result = PaginationUtils.buildStiOrderFilter(query);

      expect(result.order_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });

    it('should filter by package_id', () => {
      const result = PaginationUtils.buildStiOrderFilter({ package_id: '789' });
      expect(result.package_id).toBe('789');
    });

    it('should filter by test_id', () => {
      const result = PaginationUtils.buildStiOrderFilter({ test_id: '456' });
      expect(result.individual_tests).toEqual({ $in: ['456'] });
    });

    it('should filter by search term', () => {
      const result = PaginationUtils.buildStiOrderFilter({ search: 'test order' });
      expect(result.$or).toEqual([
        { notes: { $regex: 'test order', $options: 'i' } },
        { order_id: { $regex: 'test order', $options: 'i' } }
      ]);
    });
  });

  describe('validateStiOrderPagination', () => {
    it('should return default values for empty query', () => {
      const result = PaginationUtils.validateStiOrderPagination({});

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort_by: 'order_date',
        sort_order: -1
      });
    });

    it('should validate page and limit parameters', () => {
      const result = PaginationUtils.validateStiOrderPagination({
        page: '5',
        limit: '20'
      });

      expect(result.page).toBe(5);
      expect(result.limit).toBe(20);
    });

    it('should handle invalid parameters', () => {
      const result = PaginationUtils.validateStiOrderPagination({
        page: 'invalid',
        limit: '150'
      });

      expect(result.page).toBe(1);
      expect(result.limit).toBe(100); // Max limit
    });
  });

  describe('buildAuditLogFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildAuditLogFilter({});
      expect(result).toEqual({});
    });

    it('should filter by action_type', () => {
      const result = PaginationUtils.buildAuditLogFilter({ action_type: 'CREATE' });
      expect(result.action_type).toBe('CREATE');
    });

    it('should filter by entity_type', () => {
      const result = PaginationUtils.buildAuditLogFilter({ entity_type: 'StiOrder' });
      expect(result.entity_type).toBe('StiOrder');
    });

    it('should filter by user_id', () => {
      const result = PaginationUtils.buildAuditLogFilter({ user_id: '123' });
      expect(result.user_id).toBe('123');
    });

    it('should filter by entity_id', () => {
      const result = PaginationUtils.buildAuditLogFilter({ entity_id: '456' });
      expect(result.entity_id).toBe('456');
    });

    it('should filter by date range', () => {
      const query = {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      };
      const result = PaginationUtils.buildAuditLogFilter(query);

      expect(result.created_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });

    it('should filter by search term', () => {
      const result = PaginationUtils.buildAuditLogFilter({ search: 'test action' });
      expect(result.$or).toEqual([
        { action_description: { $regex: 'test action', $options: 'i' } },
        { entity_name: { $regex: 'test action', $options: 'i' } }
      ]);
    });
  });

  describe('validateAuditLogPagination', () => {
    it('should return default values for empty query', () => {
      const result = PaginationUtils.validateAuditLogPagination({});

      expect(result).toEqual({
        page: 1,
        limit: 10,
        sort_by: 'created_date',
        sort_order: -1
      });
    });

    it('should validate parameters correctly', () => {
      const result = PaginationUtils.validateAuditLogPagination({
        page: '3',
        limit: '25',
        sort_by: 'action_type',
        sort_order: 'asc'
      });

      expect(result).toEqual({
        page: 3,
        limit: 25,
        sort_by: 'action_type',
        sort_order: 1
      });
    });
  });

  describe('buildUserFilter', () => {
    it('should return empty filter for empty query', () => {
      const result = PaginationUtils.buildUserFilter({});
      expect(result).toEqual({});
    });

    it('should filter by role', () => {
      const result = PaginationUtils.buildUserFilter({ role: 'customer' });
      expect(result.role).toBe('customer');
    });

    it('should filter by status', () => {
      const result = PaginationUtils.buildUserFilter({ status: 'active' });
      expect(result.status).toBe('active');
    });

    it('should filter by email_verified', () => {
      const result = PaginationUtils.buildUserFilter({ email_verified: 'true' });
      expect(result.email_verified).toBe(true);

      const result2 = PaginationUtils.buildUserFilter({ email_verified: 'false' });
      expect(result2.email_verified).toBe(false);
    });

    it('should filter by date range', () => {
      const query = {
        registration_date_from: '2024-01-01',
        registration_date_to: '2024-12-31'
      };
      const result = PaginationUtils.buildUserFilter(query);

      expect(result.registration_date).toEqual({
        $gte: new Date('2024-01-01'),
        $lte: new Date('2024-12-31')
      });
    });

    it('should filter by search term', () => {
      const result = PaginationUtils.buildUserFilter({ search: 'john' });
      expect(result.$or).toEqual([
        { full_name: { $regex: 'john', $options: 'i' } },
        { email: { $regex: 'john', $options: 'i' } }
      ]);
    });

    it('should combine multiple filters', () => {
      const query = {
        role: 'customer',
        status: 'active',
        email_verified: 'true',
        search: 'john'
      };
      const result = PaginationUtils.buildUserFilter(query);

      expect(result.role).toBe('customer');
      expect(result.status).toBe('active');
      expect(result.email_verified).toBe(true);
      expect(result.$or).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null and undefined inputs gracefully', () => {
      expect(() => PaginationUtils.validatePagination(null as any)).not.toThrow();
      expect(() => PaginationUtils.buildBlogFilter(null)).not.toThrow();
      expect(() => PaginationUtils.sanitizeSearch(null as any)).not.toThrow();
    });

    it('should handle invalid date strings', () => {
      const query = {
        start_date: 'invalid-date',
        end_date: 'also-invalid'
      };
      const result = PaginationUtils.buildBlogFilter(query);
      // Should not crash and should handle invalid dates gracefully
      expect(result).toBeDefined();
    });

    it('should handle very large numbers for pagination', () => {
      const result = PaginationUtils.calculatePagination(1000000, 50000, 20);
      expect(result.total_pages).toBe(50000);
      expect(result.current_page).toBe(50000);
    });

    it('should handle extreme pagination parameters', () => {
      const result = PaginationUtils.validatePagination({
        page: Number.MAX_SAFE_INTEGER as any,
        limit: Number.MAX_SAFE_INTEGER as any
      });

      expect(result.page).toBeGreaterThan(0);
      expect(result.limit).toBeLessThanOrEqual(100); // Should be capped at max
    });
  });
});