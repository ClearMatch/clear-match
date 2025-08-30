import { describe, it, expect } from '@jest/globals';

// Test the priority calculation logic
describe('Clay Webhook Activity Generation', () => {
  // Priority calculation formula: min(10, contact_engagement_score × event_priority_weight / 10)
  describe('Priority Calculation', () => {
    const EVENT_PRIORITIES: Record<string, number> = {
      'job-posting': 7,
      'funding-event': 8,
      'layoff': 6,
      'new-job': 5,
      'birthday': 3,
      'none': 1
    };

    const calculateEventPriority = (
      eventType: string,
      engagementScore: number,
      jobTitle?: string,
      companyHeadcount?: number,
      postedDate?: string
    ): number => {
      let baseWeight: number = EVENT_PRIORITIES[eventType] ?? EVENT_PRIORITIES['none'] as number;
      
      // Apply priority modifiers
      if (postedDate) {
        const postDate = new Date(postedDate);
        const daysDiff = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysDiff < 7) baseWeight += 1; // Recent events
      }
      
      if (companyHeadcount && companyHeadcount > 1000) {
        baseWeight += 1; // Large companies
      }
      
      if (jobTitle) {
        const seniorTitles = ['Senior', 'Lead', 'Principal', 'Director'];
        if (seniorTitles.some(title => jobTitle.includes(title))) {
          baseWeight += 1; // Senior positions
        }
      }
      
      // Calculate final priority with formula
      return Math.min(10, Math.round(engagementScore * baseWeight / 10));
    };

    it('should calculate correct priority for job-posting events', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 500);
      expect(priority).toBe(Math.min(10, Math.round(8 * 7 / 10))); // 8 * 7 / 10 = 5.6 → 6
    });

    it('should apply senior position modifier', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Senior Software Engineer', 500);
      expect(priority).toBe(Math.min(10, Math.round(8 * 8 / 10))); // 8 * (7+1) / 10 = 6.4 → 6
    });

    it('should apply large company modifier', () => {
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 1500);
      expect(priority).toBe(Math.min(10, Math.round(8 * 8 / 10))); // 8 * (7+1) / 10 = 6.4 → 6
    });

    it('should apply recent event modifier', () => {
      const recentDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
      const priority = calculateEventPriority('job-posting', 8, 'Software Engineer', 500, recentDate);
      expect(priority).toBe(Math.min(10, Math.round(8 * 8 / 10))); // 8 * (7+1) / 10 = 6.4 → 6
    });

    it('should cap priority at 10', () => {
      const priority = calculateEventPriority('funding-event', 10, 'Senior Director', 2000);
      expect(priority).toBe(10); // Would be 10 * (8+1+1) / 10 = 10
    });

    it('should handle low engagement scores', () => {
      const priority = calculateEventPriority('birthday', 2, 'Intern', 50);
      expect(priority).toBe(Math.min(10, Math.round(2 * 3 / 10))); // 2 * 3 / 10 = 0.6 → 1
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