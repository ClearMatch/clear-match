import { dashboardService } from '../DashboardService'

describe('DashboardService', () => {
  describe('createEmptyFilters', () => {
    it('should create filter object with empty arrays', () => {
      const filters = dashboardService.createEmptyFilters()

      expect(filters).toEqual({
        relationship_type: [],
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

  describe('generateCandidateActions', () => {
    it('should generate actions for candidates', () => {
      const mockCandidates = [
        {
          id: 'candidate-1',
          first_name: 'John',
          last_name: 'Doe',
          relationship_type: 'candidate',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
        {
          id: 'candidate-2',
          first_name: 'Jane',
          last_name: 'Smith',
          relationship_type: 'candidate',
          is_active_looking: false,
          updated_at: '2025-01-02',
        },
      ]

      const actions = dashboardService.generateCandidateActions(mockCandidates)

      expect(actions).toHaveLength(2)
      expect(actions[0]).toMatchObject({
        id: 'candidate-1',
        candidateId: 'candidate-1',
        candidateName: 'John Doe',
        actionType: 'follow_up',
        priority: 'high',
        type: 'candidate',
      })
      expect(actions[1]).toMatchObject({
        id: 'candidate-2',
        candidateId: 'candidate-2',
        candidateName: 'Jane Smith',
        actionType: 'follow_up',
        priority: 'medium',
        type: 'candidate',
      })
    })

    it('should filter out candidates without IDs', () => {
      const mockCandidates = [
        {
          id: 'candidate-1',
          first_name: 'John',
          last_name: 'Doe',
          relationship_type: 'candidate',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
        {
          id: '', // Empty ID should be filtered out
          first_name: 'Jane',
          last_name: 'Smith',
          relationship_type: 'candidate',
          is_active_looking: false,
          updated_at: '2025-01-02',
        },
      ]

      const actions = dashboardService.generateCandidateActions(mockCandidates)

      expect(actions).toHaveLength(1)
      expect(actions[0].candidateId).toBe('candidate-1')
    })

    it('should handle candidates with missing names', () => {
      const mockCandidates = [
        {
          id: 'candidate-1',
          first_name: '',
          last_name: '',
          relationship_type: 'candidate',
          is_active_looking: true,
          updated_at: '2025-01-01',
        },
      ]

      const actions = dashboardService.generateCandidateActions(mockCandidates)

      expect(actions).toHaveLength(1)
      expect(actions[0].candidateName).toBe('Unknown Candidate')
    })
  })

  describe('sortRecommendedActions', () => {
    it('should sort actions by priority then due date', () => {
      const actions = [
        {
          id: '1',
          candidateId: '1',
          candidateName: 'Test 1',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'medium' as const,
          dueDate: '2025-01-03',
          type: 'candidate' as const,
        },
        {
          id: '2',
          candidateId: '2',
          candidateName: 'Test 2',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'high' as const,
          dueDate: '2025-01-02',
          type: 'candidate' as const,
        },
        {
          id: '3',
          candidateId: '3',
          candidateName: 'Test 3',
          actionType: 'follow_up' as const,
          reason: 'Test',
          priority: 'high' as const,
          dueDate: '2025-01-01',
          type: 'candidate' as const,
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