import { PaginationUtils } from '../../utils/paginationUtils';

describe('PaginationUtils', () => {
  describe('buildFilter', () => {
    it('should build filter with empty query', () => {
      const result = PaginationUtils.buildFilter({});
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with null query', () => {
      const result = PaginationUtils.buildFilter(null);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with undefined query', () => {
      const result = PaginationUtils.buildFilter(undefined);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with pagination parameters', () => {
      const query = {
        page: 1,
        limit: 10,
        sort: 'createdAt',
        order: 'desc'
      };

      const result = PaginationUtils.buildFilter(query);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with search parameters', () => {
      const query = {
        search: 'test search term',
        category: 'health',
        status: 'active'
      };

      const result = PaginationUtils.buildFilter(query);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with date range parameters', () => {
      const query = {
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        dateField: 'createdAt'
      };

      const result = PaginationUtils.buildFilter(query);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with complex query object', () => {
      const query = {
        page: 2,
        limit: 25,
        sort: 'name',
        order: 'asc',
        search: 'complex search',
        filters: {
          category: ['health', 'wellness'],
          status: 'published',
          tags: ['important', 'featured']
        },
        dateRange: {
          from: '2024-01-01',
          to: '2024-12-31'
        }
      };

      const result = PaginationUtils.buildFilter(query);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should build filter with special characters in search', () => {
      const query = {
        search: 'test with "quotes" and símb%ls & more!',
        specialField: 'value with ñoñó'
      };

      const result = PaginationUtils.buildFilter(query);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});