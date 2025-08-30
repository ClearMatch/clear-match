import { describe, it, expect } from '@jest/globals';

// Test the priority calculation logic
describe('Clay Webhook Activity Generation', () => {
  // Priority calculation using Clay event types directly
  describe('Priority Calculation', () => {
    // Clay event types with their importance scores
    const CLAY_EVENT_IMPORTANCE: Record<string, number> = {
      'job-posting': 10,        // Highest - new opportunities
      'funding-event': 8,       // High - company growth signals
      'layoff': 9,              // High - immediate outreach opportunity
      'new-job': 8,             // High - relationship status change
      'birthday': 6,            // Medium - personal touch opportunity
      'none': 4                 // Low - generic events
    };

    const calculateEventPriority = (
      clayEventType: string,
      engagementScore: number,
      jobTitle?: string,
      companyHeadcount?: number,
      postedDate?: string
    ): number => {
      // Get base importance for Clay event type
      let baseImportance: number = CLAY_EVENT_IMPORTANCE[clayEventType] || 4;
      
      // Apply priority modifiers
      let modifiers = 0;
      
      if (postedDate) {
        const postDate = new Date(postedDate);
        const daysDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) modifiers += 1; // Recent events
      }
      
      if (companyHeadcount && companyHeadcount > 1000) {
        modifiers += 1; // Large companies
      }
      
      if (jobTitle) {
        const seniorTitles = ['Senior', 'Lead', 'Principal', 'Director'];
        if (seniorTitles.some(title => jobTitle.includes(title))) {
          modifiers += 1; // Senior positions
        }
      }
      
      // Calculate score using existing system: engagement × (base_importance + modifiers)
      const calculatedScore = engagementScore * (baseImportance + modifiers);
      
      // Map to 1-4 priority system
      if (calculatedScore >= 80) return 4; // Critical
      if (calculatedScore >= 60) return 3; // High
      if (calculatedScore >= 40) return 2; // Medium
      return 1; // Low
    };

    it('should calculate correct priority for job-posting events', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 500);
      // job-posting (importance: 10)
      // 8 × 10 = 80 → Priority 4 (Critical)
      expect(priority).toBe(4);
    });

    it('should apply senior position modifier', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Senior Software Engineer', 500);
      // job-posting (importance: 10) + senior modifier (+1)
      // 8 × (10 + 1) = 88 → Priority 4 (Critical)
      expect(priority).toBe(4);
    });

    it('should apply large company modifier', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 1500);
      // job-posting (importance: 10) + large company modifier (+1)
      // 8 × (10 + 1) = 88 → Priority 4 (Critical)
      expect(priority).toBe(4);
    });

    it('should apply recent event modifier', () => {
      const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 500, recentDate);
      // job-posting (importance: 10) + recent modifier (+1)
      // 8 × (10 + 1) = 88 → Priority 4 (Critical)
      expect(priority).toBe(4);
    });

    it('should calculate medium priority for funding events', () => {
      const priority = calculateEventPriority('funding-event', 6, 'Manager', 800);
      // funding-event (importance: 8)
      // 6 × 8 = 48 → Priority 2 (Medium)
      expect(priority).toBe(2);
    });

    it('should handle low engagement scores', () => {
      const priority = calculateEventPriority('birthday', 4, 'Intern', 50);
      // birthday (importance: 6)
      // 4 × 6 = 24 → Priority 1 (Low)
      expect(priority).toBe(1);
    });
  });

  describe('Subject Generation', () => {
    const generateActivitySubject = (eventType: string, eventData: any): string => {
      switch (eventType) {
        case 'job-posting':
          return `Follow up: ${eventData.position || eventData.job_title || 'Job opportunity'} at ${eventData.company_name || 'Unknown Company'}`;
        case 'funding-event':
          return `Follow up: Funding event at ${eventData.company_name || 'Unknown Company'}`;
        case 'layoff':
          return `Follow up: Layoff event at ${eventData.company_name || 'Unknown Company'}`;
        case 'new-job':
          return `Follow up: New job at ${eventData.company_name || 'Unknown Company'}`;
        case 'birthday':
          return 'Follow up: Birthday contact opportunity';
        default:
          return 'Follow up: Contact opportunity';
      }
    };

    it('should generate correct subject for job-posting', () => {
      const subject = generateActivitySubject('job-posting', {
        position: 'Software Engineer',
        job_title: 'Senior Software Engineer',
        company_name: 'Augment Code'
      });
      expect(subject).toBe('Follow up: Software Engineer at Augment Code');
    });

    it('should fallback to job_title if position not available', () => {
      const subject = generateActivitySubject('job-posting', {
        job_title: 'Senior Software Engineer',
        company_name: 'Augment Code'
      });
      expect(subject).toBe('Follow up: Senior Software Engineer at Augment Code');
    });
  });

  describe('Due Date Calculation', () => {
    const calculateDueDate = (eventType: string): Date => {
      const now = new Date();
      const dueDate = new Date(now);
      
      switch (eventType) {
        case 'job-posting':
          dueDate.setDate(now.getDate() + 2); // 2 days for job postings
          break;
        case 'funding-event':
        case 'layoff':
        case 'new-job':
        case 'birthday':
        default:
          dueDate.setDate(now.getDate() + 7); // 7 days for other events
          break;
      }
      
      return dueDate;
    };

    it('should set due date to +2 days for job-posting events', () => {
      const dueDate = calculateDueDate('job-posting');
      const expected = new Date();
      expected.setDate(expected.getDate() + 2);
      
      expect(dueDate.getDate()).toBe(expected.getDate());
    });

    it('should set due date to +7 days for other events', () => {
      const dueDate = calculateDueDate('funding-event');
      const expected = new Date();
      expected.setDate(expected.getDate() + 7);
      
      expect(dueDate.getDate()).toBe(expected.getDate());
    });
  });
});