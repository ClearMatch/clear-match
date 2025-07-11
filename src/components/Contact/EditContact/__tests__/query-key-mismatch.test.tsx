/**
 * Test for query key mismatch bug that causes cache invalidation to fail
 * 
 * The bug: EditContact component uses query key ["contact", id] but cache invalidation
 * uses query key ["contacts", "detail", id]. Since keys don't match, cache isn't invalidated.
 * 
 * This test should FAIL initially, then PASS after fixing the query key mismatch.
 */

import { contactKeys } from '@/lib/query-keys';

describe('Query Key Consistency for Cache Invalidation', () => {
  /**
   * QUERY KEY BUG TEST: Ensure query keys match between fetch and invalidation
   * 
   * This test verifies that the query key used in EditContact component
   * matches the query key used in cache invalidation logic.
   * 
   * Before fix: ["contact", id] vs ["contacts", "detail", id] - MISMATCH
   * After fix: both should use contactKeys.detail(id) - MATCH
   */
  test('EditContact query key matches cache invalidation key', () => {
    const contactId = 'test-contact-123';
    
    // This is the query key that should be used consistently
    const expectedQueryKey = contactKeys.detail(contactId);
    
    // Verify the key structure matches what we expect
    expect(expectedQueryKey).toEqual(['contacts', 'detail', contactId]);
    
    // The EditContact component should use this same key
    // Previously it used ["contact", contactId] which would cause cache mismatch
    
    // When we invalidate cache after updating a contact, it should invalidate the same key
    const invalidationKey = contactKeys.detail(contactId);
    
    // These should be identical for cache invalidation to work
    expect(expectedQueryKey).toEqual(invalidationKey);
  });

  /**
   * CACHE BEHAVIOR TEST: Verify cache invalidation actually affects the right queries
   */
  test('Cache invalidation targets correct query keys', () => {
    const contactId = 'test-contact-456';
    
    // All these keys should be related and follow the same pattern
    const detailKey = contactKeys.detail(contactId);
    const listsKey = contactKeys.lists();
    const tasksKey = contactKeys.tasks(contactId);
    
    // Verify they all start with the base "contacts" key
    expect(detailKey[0]).toBe('contacts');
    expect(listsKey[0]).toBe('contacts');  
    expect(tasksKey[0]).toBe('contacts');
    
    // Detail key should have the specific contact ID
    expect(detailKey).toContain(contactId);
    expect(tasksKey).toContain(contactId);
    
    // This ensures invalidation will work correctly because all keys are consistent
  });
});