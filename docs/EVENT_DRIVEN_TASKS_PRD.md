# Event-Driven Task Management System - Product Requirements Document

## Executive Summary

Clear Match needs an automated system that transforms incoming client events (job postings, career updates, etc.) into prioritized tasks based on relationship strength (engagement score) and event importance. This system will help recruiting teams focus on high-value activities by automatically ranking and creating tasks when relevant events occur.

## Problem Statement

Recruiting teams struggle to prioritize their outreach when managing hundreds of client relationships. They need a system that:
- Automatically captures important client events from multiple sources
- Creates tasks with intelligent priority based on relationship strength and event importance
- Ensures high-value opportunities (strong relationships + important events) get immediate attention
- Prevents low-value activities from cluttering their workflow

## Solution Overview

An event-driven task management system that:
1. Ingests events from Clay (initially job postings only)
2. Calculates task priority using: **Engagement Score (1-10) × Event Importance (1-10)**
3. Automatically creates tasks with appropriate priority levels
4. Presents tasks in order of calculated priority

## Technical Architecture

### Data Model Updates

#### 1. Event Types Enum Update
Update the events table type constraint to include new event types:
- `new-job-posting` (5.0 → 10)
- `open-to-work` (4.5 → 9)
- `laid-off` (4.5 → 9)
- `funding-news` (4.0 → 8)
- `company-layoffs` (4.0 → 8)
- `birthday` (4.0 → 8)
- `m-and-a-activity` (3.0 → 6)
- `email-reply-received` (3.0 → 6)
- `holiday` (2.0 → 4)
- `personal-interest-tag` (2.0 → 4)
- `dormant-status` (1.0 → 2)

#### 2. Database Schema Changes
```sql
-- Add fields to events table
ALTER TABLE events 
ADD COLUMN external_id VARCHAR(255) UNIQUE,
ADD COLUMN metadata JSONB,
ADD COLUMN source VARCHAR(50) DEFAULT 'manual';

-- Update engagement score constraint on contacts
ALTER TABLE contacts 
DROP CONSTRAINT candidates_engagement_score_check,
ADD CONSTRAINT contacts_engagement_score_check CHECK (engagement_score BETWEEN 1 AND 10);

-- Add index for duplicate detection
CREATE INDEX idx_events_external_id ON events(external_id);
```

#### 3. Event Importance Mapping (Code Constant)
```typescript
export const EVENT_IMPORTANCE_SCORES: Record<EventType, number> = {
  'new-job-posting': 10,
  'open-to-work': 9,
  'laid-off': 9,
  'funding-news': 8,
  'company-layoffs': 8,
  'birthday': 8,
  'm-and-a-activity': 6,
  'email-reply-received': 6,
  'holiday': 4,
  'personal-interest-tag': 4,
  'dormant-status': 2,
  'none': 1
};
```

### Priority Calculation System

#### Priority Formula
```
Calculated Priority = Engagement Score (1-10) × Event Importance (1-10)
Result Range: 1-100
```

#### Mapping to Task Priority (1-6)
- 85-100 → 1 (High)
- 68-84 → 2 (High-Medium)
- 51-67 → 3 (Medium)
- 34-50 → 4 (Low-Medium)
- 17-33 → 5 (Low)
- 1-16 → 6 (Very Low)

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up core infrastructure for event processing

1. **Database Migration**
   - Update event types enum
   - Add external_id and metadata fields
   - Update engagement score range (1-5 → 1-10)
   - Create necessary indexes

2. **Core Constants & Types**
   - Create EVENT_IMPORTANCE_SCORES constant
   - Update TypeScript types for new event types
   - Create priority calculation utilities

3. **Clay Webhook Endpoint**
   - Create `/api/webhooks/clay` endpoint
   - Implement authentication/validation
   - Parse job posting data structure
   - Store raw data in metadata field

### Phase 2: Event Processing (Week 2-3)
**Goal**: Build automated task creation from events

1. **Event Processing Pipeline**
   - Duplicate detection using external_id
   - Change detection for updates
   - Event normalization from Clay format
   - Error handling and retry logic

2. **Task Creation Service**
   - Calculate priority from engagement × importance
   - Generate task subject/description templates
   - Set appropriate due dates
   - Link tasks to source events

3. **Background Job System**
   - Queue for processing Clay webhooks
   - Batch processing for multiple events
   - Error reporting and monitoring

### Phase 3: UI Enhancements (Week 3-4)
**Goal**: Surface event-driven tasks effectively

1. **Task List Updates**
   - Show calculated priority score
   - Add visual indicators for priority levels
   - Display linked event information
   - Sort by calculated priority by default

2. **Event-Task Relationship**
   - Show event details on task page
   - Link to original job posting
   - Display event metadata
   - Show priority calculation breakdown

3. **Dashboard Integration**
   - Update activity feed to use real data
   - Show high-priority tasks prominently
   - Add event type filters
   - Display daily task statistics

### Phase 4: Polish & Testing (Week 4)
**Goal**: Ensure reliability and usability

1. **Testing**
   - Unit tests for priority calculation
   - Integration tests for webhook processing
   - E2E tests for task creation flow
   - Load testing for bulk event processing

2. **Monitoring & Observability**
   - Webhook processing metrics
   - Task creation success rates
   - Priority distribution analytics
   - Error tracking and alerting

3. **Documentation**
   - API documentation for Clay webhook
   - User guide for event-driven tasks
   - Admin guide for managing event types
   - Troubleshooting guide

## Success Metrics

1. **Efficiency Metrics**
   - Time from event receipt to task creation < 30 seconds
   - 99% uptime for webhook endpoint
   - < 1% duplicate task creation rate

2. **Business Metrics**
   - Increase in high-priority task completion rate
   - Reduction in missed opportunities
   - Improved response time to job postings
   - Higher engagement with strong relationships

3. **User Satisfaction**
   - Reduced manual task creation time
   - Better task prioritization accuracy
   - Clearer focus on high-value activities

## Future Enhancements

1. **Phase 5: LinkedIn Integration**
   - Direct LinkedIn API integration
   - Real-time career update monitoring
   - Profile view notifications

2. **Phase 6: Advanced Analytics**
   - Engagement score auto-adjustment based on interactions
   - Event importance ML-based optimization
   - ROI tracking for different event types

3. **Phase 7: Workflow Automation**
   - Auto-assign tasks based on team capacity
   - Email template suggestions based on event type
   - Follow-up sequence automation

## Technical Considerations

### Security
- Webhook authentication using API keys
- Rate limiting on webhook endpoint
- Input validation for all Clay data
- PII handling compliance

### Performance
- Async processing for webhooks
- Database query optimization
- Caching for frequently accessed data
- Pagination for large event batches

### Reliability
- Webhook retry mechanism
- Idempotent event processing
- Transaction integrity for task creation
- Audit logging for all events

## Acceptance Criteria

1. **Event Processing**
   - [ ] Clay webhook receives and stores job posting events
   - [ ] Duplicate events are detected and handled appropriately
   - [ ] Events create tasks with correct priority calculation

2. **Task Management**
   - [ ] Tasks display calculated priority scores
   - [ ] Tasks sort by priority by default
   - [ ] Tasks link to source events

3. **User Experience**
   - [ ] Users can see why a task has specific priority
   - [ ] High-priority tasks are visually distinct
   - [ ] Event details are accessible from tasks

## Dependencies

- Clay webhook documentation and API access
- Database migration tooling
- Background job processing system (consider Supabase Edge Functions)
- Updated TypeScript types from Supabase

## Risks & Mitigation

1. **Risk**: High volume of events overwhelming the system
   - **Mitigation**: Implement rate limiting and batch processing

2. **Risk**: Incorrect priority calculations leading to missed opportunities
   - **Mitigation**: Extensive testing and ability to manually adjust priorities

3. **Risk**: Clay API changes breaking integration
   - **Mitigation**: Version webhook endpoints and maintain backwards compatibility

## Appendix: Sample Data Structures

### Clay Webhook Payload
```json
{
  "records": [
    {
      "company_name": "Kikoff",
      "company_website": "kikoff.com",
      "contact_name": "Mihir Iyer",
      "contact_personal_email": "iyermihir@gmail.com",
      "contact_phone": "+14083550236",
      "contact_title": "Software Engineer",
      "job_posting_link": "https://www.linkedin.com/jobs/view/software-engineer-recent-grad-2026-at-kikoff-4257356193",
      "job_posting_title": "Software Engineer - Recent Grad 2026",
      "posting_date": "2025-06-28T12:00:00.000Z"
    }
  ]
}
```

### Task Creation Example
```typescript
// Input
engagement_score: 8
event_importance: 10 (new-job-posting)

// Calculation
priority_score = 8 × 10 = 80
task_priority = 2 (High-Medium)

// Generated Task
{
  subject: "Follow up: Software Engineer role at Kikoff",
  description: "Mihir Iyer posted a new Software Engineer position at Kikoff. Review the job posting and reach out to discuss potential candidates.",
  priority: 2,
  status: "todo",
  due_date: "2025-07-01", // 3 days for high-priority
  contact_id: "contact-uuid",
  event_id: "event-uuid"
}
```