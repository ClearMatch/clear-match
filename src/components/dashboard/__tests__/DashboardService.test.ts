import { dashboardService } from '../DashboardService'

describe('DashboardService', () => {
  describe('createEmptyFilters', () => {
    it('should create filter object with empty arrays', () => {
      const filters = dashboardService.createEmptyFilters()

      expect(filters).toEqual({
        contact_type: [],
        location_category: [],
        functional_role: [],
        is_active_looking: null,
        current_company_size: [],
        past_company_sizes: [],
        urgency_level: [],
        employment_status: [],
      })
    })
  })

  describe('generateContactActions', () => {
    it('should generate actions for contacts', () => {
      const mockContacts = [
        {
          id: 'contact-1',
          first_name: 'John',
          last_name: 'Doe',
          contact_type: 'contact',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
        {
          id: 'contact-2',
          first_name: 'Jane',
          last_name: 'Smith',
          contact_type: 'contact',
          is_active_looking: false,
          updated_at: '2025-01-02',
        },
      ]

      const actions = dashboardService.generateContactActions(mockContacts)

      expect(actions).toHaveLength(2)
      expect(actions[0]).toMatchObject({
        id: 'contact-1',
        contactId: 'contact-1',
        contactName: 'John Doe',
        actionType: 'follow_up',
        priority: 'high',
        type: 'contact',
      })
      expect(actions[1]).toMatchObject({
        id: 'contact-2',
        contactId: 'contact-2',
        contactName: 'Jane Smith',
        actionType: 'follow_up',
        priority: 'medium',
        type: 'contact',
      })
    })

    it('should filter out contacts without IDs', () => {
      const mockContacts = [
        {
          id: 'contact-1',
          first_name: 'John',
          last_name: 'Doe',
          contact_type: 'contact',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
        {
          id: '', // Empty ID should be filtered out
          first_name: 'Jane',
          last_name: 'Smith',
          contact_type: 'contact',
          is_active_looking: false,
          updated_at: '2025-01-02',
        },
      ]

      const actions = dashboardService.generateContactActions(mockContacts)

      expect(actions).toHaveLength(1)
      expect(actions[0].contactId).toBe('contact-1')
    })

    it('should handle contacts with missing names', () => {
      const mockContacts = [
        {
          id: 'contact-1',
          first_name: '',
          last_name: '',
          contact_type: 'contact',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
      ]

      const actions = dashboardService.generateContactActions(mockContacts)

      expect(actions).toHaveLength(1)
      expect(actions[0].contactName).toBe('Unknown Contact')
    })
  })

  describe('sortRecommendedActions', () => {
    it('should sort actions by priority then due date', () => {
      const actions = [
        {
          id: '1',
          contactId: '1',
          contactName: 'Test 1',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'medium' as const,
          dueDate: '2025-01-03',
          type: 'contact' as const,
        },
        {
          id: '2',
          contactId: '2',
          contactName: 'Test 2',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'high' as const,
          dueDate: '2025-01-02',
          type: 'contact' as const,
        },
        {
          id: '3',
          contactId: '3',
          contactName: 'Test 3',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'high' as const,
          dueDate: '2025-01-01',
          type: 'contact' as const,
        },
      ]

      const sorted = dashboardService.sortRecommendedActions(actions)

      // Should be sorted by priority (high first), then by due date (earliest first)
      expect(sorted[0].id).toBe('3') // high priority, earliest date
      expect(sorted[1].id).toBe('2') // high priority, later date
      expect(sorted[2].id).toBe('1') // medium priority
    })
  })
})