import { QueryClient } from '@tanstack/react-query';
import {
  contactKeys,
  taskKeys,
  dashboardKeys,
  eventKeys,
  userKeys,
  organizationKeys,
  queryKeyUtils,
  type ContactFilters,
  type TaskFilters,
  type ContactSort,
  type TaskSort,
} from '../query-keys';

describe('Query Keys', () => {
  describe('Contact Keys', () => {
    it('should generate correct base keys', () => {
      expect(contactKeys.all).toEqual(['contacts']);
      expect(contactKeys.lists()).toEqual(['contacts', 'list']);
      expect(contactKeys.details()).toEqual(['contacts', 'detail']);
    });

    it('should generate correct list keys with parameters', () => {
      const params = {
        search: 'john',
        filters: { status: 'active' } as ContactFilters,
        sort: { field: 'firstName', direction: 'asc' } as ContactSort,
        userId: 'user-123',
      };

      expect(contactKeys.list(params)).toEqual([
        'contacts',
        'list',
        params,
      ]);
    });

    it('should generate correct detail keys', () => {
      expect(contactKeys.detail('contact-123')).toEqual([
        'contacts',
        'detail',
        'contact-123',
      ]);
    });

    it('should generate correct relation keys', () => {
      expect(contactKeys.tasks('contact-123')).toEqual([
        'contacts',
        'tasks',
        'contact-123',
      ]);
      
      expect(contactKeys.events('contact-123')).toEqual([
        'contacts',
        'events',
        'contact-123',
      ]);
    });

    it('should generate correct option keys', () => {
      expect(contactKeys.organizations()).toEqual([
        'contacts',
        'organizations',
      ]);
      
      expect(contactKeys.tags()).toEqual([
        'contacts',
        'tags',
      ]);
    });

    it('should handle empty parameters', () => {
      expect(contactKeys.list({})).toEqual([
        'contacts',
        'list',
        {},
      ]);
    });

    it('should handle partial parameters', () => {
      const params = {
        search: 'john',
        // No filters, sort, or userId
      };

      expect(contactKeys.list(params)).toEqual([
        'contacts',
        'list',
        params,
      ]);
    });
  });

  describe('Task Keys', () => {
    it('should generate correct base keys', () => {
      expect(taskKeys.all).toEqual(['tasks']);
      expect(taskKeys.lists()).toEqual(['tasks', 'list']);
      expect(taskKeys.details()).toEqual(['tasks', 'detail']);
    });

    it('should generate correct list keys with filters', () => {
      const params = {
        search: 'follow up',
        filters: {
          status: 'pending',
          priority: 'high',
          assigneeId: 'user-123',
        } as TaskFilters,
        sort: { field: 'due_date', direction: 'asc' } as TaskSort,
      };

      expect(taskKeys.list(params)).toEqual([
        'tasks',
        'list',
        params,
      ]);
    });

    it('should generate correct option keys', () => {
      expect(taskKeys.assigneeOptions()).toEqual([
        'tasks',
        'assignee-options',
      ]);
      
      expect(taskKeys.creatorOptions()).toEqual([
        'tasks',
        'creator-options',
      ]);
      
      expect(taskKeys.formData()).toEqual([
        'tasks',
        'form-data',
      ]);
    });

    it('should handle complex task filters', () => {
      const params = {
        filters: {
          status: 'in_progress',
          priority: 'urgent',
          assigneeId: 'user-123',
          contactId: 'contact-456',
          eventId: 'event-789',
          dueDate: {
            start: '2024-01-01',
            end: '2024-12-31',
          },
        } as TaskFilters,
      };

      expect(taskKeys.list(params)).toEqual([
        'tasks',
        'list',
        params,
      ]);
    });
  });

  describe('Dashboard Keys', () => {
    it('should generate correct base keys', () => {
      expect(dashboardKeys.all).toEqual(['dashboard']);
    });

    it('should generate correct stats keys', () => {
      expect(dashboardKeys.stats('user-123')).toEqual([
        'dashboard',
        'stats',
        'user-123',
      ]);
    });

    it('should generate correct analytics keys', () => {
      expect(dashboardKeys.analytics('user-123', '30d')).toEqual([
        'dashboard',
        'analytics',
        'user-123',
        '30d',
      ]);
    });

    it('should handle optional time range in analytics', () => {
      expect(dashboardKeys.analytics('user-123')).toEqual([
        'dashboard',
        'analytics',
        'user-123',
        undefined,
      ]);
    });

    it('should generate correct activity keys', () => {
      expect(dashboardKeys.activity('user-123', 50)).toEqual([
        'dashboard',
        'activity',
        'user-123',
        50,
      ]);
    });
  });

  describe('Event Keys', () => {
    it('should generate correct base keys', () => {
      expect(eventKeys.all).toEqual(['events']);
      expect(eventKeys.lists()).toEqual(['events', 'list']);
      expect(eventKeys.details()).toEqual(['events', 'detail']);
    });

    it('should generate correct form data keys', () => {
      expect(eventKeys.formData()).toEqual([
        'events',
        'form-data',
      ]);
    });
  });

  describe('User Keys', () => {
    it('should generate correct base keys', () => {
      expect(userKeys.all).toEqual(['users']);
      expect(userKeys.lists()).toEqual(['users', 'list']);
    });

    it('should generate correct profile keys', () => {
      expect(userKeys.profile('user-123')).toEqual([
        'users',
        'profile',
        'user-123',
      ]);
    });

    it('should generate correct list keys with organization', () => {
      expect(userKeys.list('org-456')).toEqual([
        'users',
        'list',
        'org-456',
      ]);
    });

    it('should generate correct preferences keys', () => {
      expect(userKeys.preferences('user-123')).toEqual([
        'users',
        'preferences',
        'user-123',
      ]);
    });
  });

  describe('Organization Keys', () => {
    it('should generate correct base keys', () => {
      expect(organizationKeys.all).toEqual(['organizations']);
      expect(organizationKeys.lists()).toEqual(['organizations', 'list']);
      expect(organizationKeys.details()).toEqual(['organizations', 'detail']);
    });

    it('should generate correct members keys', () => {
      expect(organizationKeys.members('org-123')).toEqual([
        'organizations',
        'members',
        'org-123',
      ]);
    });
  });

  describe('Query Key Utilities', () => {
    let mockQueryClient: {
      invalidateQueries: jest.Mock;
      removeQueries: jest.Mock;
      getQueriesData: jest.Mock;
      prefetchQuery: jest.Mock;
    };

    beforeEach(() => {
      mockQueryClient = {
        invalidateQueries: jest.fn(),
        removeQueries: jest.fn(),
        getQueriesData: jest.fn(),
        prefetchQuery: jest.fn(),
      };
    });

    describe('invalidateEntity', () => {
      it('should invalidate queries with correct key', async () => {
        await queryKeyUtils.invalidateEntity(mockQueryClient as any, contactKeys.all);

        expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith({
          queryKey: ['contacts'],
        });
      });
    });

    describe('removeEntity', () => {
      it('should remove queries with correct key', async () => {
        await queryKeyUtils.removeEntity(mockQueryClient as any, taskKeys.all);

        expect(mockQueryClient.removeQueries).toHaveBeenCalledWith({
          queryKey: ['tasks'],
        });
      });
    });

    describe('getEntityData', () => {
      it('should get queries data with correct key', async () => {
        mockQueryClient.getQueriesData.mockReturnValue([
          [['contacts', 'list'], { data: 'mock-data' }],
        ]);

        const result = queryKeyUtils.getEntityData(mockQueryClient as any, contactKeys.all);

        expect(mockQueryClient.getQueriesData).toHaveBeenCalledWith({
          queryKey: ['contacts'],
        });
        expect(result).toEqual([
          [['contacts', 'list'], { data: 'mock-data' }],
        ]);
      });
    });

    describe('prefetchRelated', () => {
      it('should prefetch multiple related queries', async () => {
        const relationships = [
          {
            queryKey: ['contacts'] as const,
            queryFn: () => Promise.resolve('contacts-data'),
          },
          {
            queryKey: ['tasks'] as const,
            queryFn: () => Promise.resolve('tasks-data'),
          },
        ];

        mockQueryClient.prefetchQuery.mockResolvedValue(undefined);

        await queryKeyUtils.prefetchRelated(mockQueryClient as any, relationships);

        expect(mockQueryClient.prefetchQuery).toHaveBeenCalledTimes(2);
        expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith({
          queryKey: ['contacts'],
          queryFn: expect.any(Function),
        });
        expect(mockQueryClient.prefetchQuery).toHaveBeenCalledWith({
          queryKey: ['tasks'],
          queryFn: expect.any(Function),
        });
      });

      it('should handle prefetch errors gracefully', async () => {
        const relationships = [
          {
            queryKey: ['contacts'] as const,
            queryFn: () => Promise.reject(new Error('Prefetch failed')),
          },
        ];

        mockQueryClient.prefetchQuery.mockRejectedValue(new Error('Prefetch failed'));

        await expect(
          queryKeyUtils.prefetchRelated(mockQueryClient as any, relationships)
        ).rejects.toThrow('Prefetch failed');
      });
    });
  });

  describe('Key Consistency', () => {
    it('should maintain consistent structure across entity types', () => {
      // All entity base keys should be arrays with single string
      expect(contactKeys.all).toHaveLength(1);
      expect(taskKeys.all).toHaveLength(1);
      expect(dashboardKeys.all).toHaveLength(1);
      expect(eventKeys.all).toHaveLength(1);
      expect(userKeys.all).toHaveLength(1);
      expect(organizationKeys.all).toHaveLength(1);

      // All entity base keys should be strings
      expect(typeof contactKeys.all[0]).toBe('string');
      expect(typeof taskKeys.all[0]).toBe('string');
      expect(typeof dashboardKeys.all[0]).toBe('string');
      expect(typeof eventKeys.all[0]).toBe('string');
      expect(typeof userKeys.all[0]).toBe('string');
      expect(typeof organizationKeys.all[0]).toBe('string');
    });

    it('should use consistent naming patterns', () => {
      // Lists should follow the same pattern
      expect(contactKeys.lists()).toEqual(['contacts', 'list']);
      expect(taskKeys.lists()).toEqual(['tasks', 'list']);
      expect(eventKeys.lists()).toEqual(['events', 'list']);
      expect(userKeys.lists()).toEqual(['users', 'list']);
      expect(organizationKeys.lists()).toEqual(['organizations', 'list']);

      // Details should follow the same pattern
      expect(contactKeys.details()).toEqual(['contacts', 'detail']);
      expect(taskKeys.details()).toEqual(['tasks', 'detail']);
      expect(eventKeys.details()).toEqual(['events', 'detail']);
      expect(organizationKeys.details()).toEqual(['organizations', 'detail']);
    });
  });

  describe('Type Safety', () => {
    it('should enforce correct filter types', () => {
      // These should compile without TypeScript errors
      const contactFilters: ContactFilters = {
        status: 'active',
        organizationId: 'org-123',
        tags: ['tag1', 'tag2'],
        dateRange: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      };

      const taskFilters: TaskFilters = {
        status: 'pending',
        priority: 'high',
        assigneeId: 'user-123',
        creatorId: 'user-456',
        contactId: 'contact-789',
        eventId: 'event-101',
        dueDate: {
          start: '2024-01-01',
          end: '2024-12-31',
        },
      };

      expect(contactFilters).toBeDefined();
      expect(taskFilters).toBeDefined();
    });

    it('should enforce correct sort types', () => {
      const contactSort: ContactSort = {
        field: 'firstName',
        direction: 'asc',
      };

      const taskSort: TaskSort = {
        field: 'due_date',
        direction: 'desc',
      };

      expect(contactSort).toBeDefined();
      expect(taskSort).toBeDefined();
    });
  });

  describe('Cache Invalidation Patterns', () => {
    it('should support hierarchical invalidation', () => {
      // Invalidating contacts.all should affect all contact queries
      const allContactQueries = [
        contactKeys.all,
        contactKeys.lists(),
        contactKeys.list({}),
        contactKeys.details(),
        contactKeys.detail('contact-123'),
        contactKeys.tasks('contact-123'),
      ];

      // All should start with ['contacts']
      allContactQueries.forEach(queryKey => {
        expect(queryKey[0]).toBe('contacts');
      });
    });

    it('should allow specific query invalidation', () => {
      const specificQuery = contactKeys.list({
        search: 'john',
        filters: { status: 'active' },
      });

      expect(specificQuery).toEqual([
        'contacts',
        'list',
        { search: 'john', filters: { status: 'active' } },
      ]);
    });
  });
});