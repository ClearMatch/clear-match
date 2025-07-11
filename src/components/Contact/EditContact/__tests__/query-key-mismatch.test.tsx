/**
 * Tests for query key consistency between data fetching and cache invalidation
 */

import { contactKeys } from '@/lib/query-keys';

describe('Query Key Consistency for Cache Invalidation', () => {
  test('should use consistent query keys for fetching and invalidation', () => {
    const contactId = 'test-contact-123';
    
    const expectedQueryKey = contactKeys.detail(contactId);
    
    expect(expectedQueryKey).toEqual(['contacts', 'detail', contactId]);
    
    const invalidationKey = contactKeys.detail(contactId);
    
    expect(expectedQueryKey).toEqual(invalidationKey);
  });

  test('should target correct query keys for cache invalidation', () => {
    const contactId = 'test-contact-456';
    
    const detailKey = contactKeys.detail(contactId);
    const listsKey = contactKeys.lists();
    const tasksKey = contactKeys.tasks(contactId);
    
    expect(detailKey[0]).toBe('contacts');
    expect(listsKey[0]).toBe('contacts');  
    expect(tasksKey[0]).toBe('contacts');
    
    expect(detailKey).toContain(contactId);
    expect(tasksKey).toContain(contactId);
    
  });
});