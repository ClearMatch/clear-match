-- Create test records with structured Clay webhook data
-- This script creates sample job-posting events with structured fields populated

-- First, get the organization ID (assuming there's at least one organization)
WITH org_data AS (
  SELECT id as org_id FROM organizations LIMIT 1
)
-- Insert test job-posting events with full structured data
INSERT INTO events (
  organization_id,
  type,
  position,
  company_name,
  company_location,
  metro_area,
  contact_name,
  contact_linkedin,
  company_website,
  job_listing_url,
  posted_on,
  data,
  created_at
)
SELECT 
  org_data.org_id,
  'job-posting',
  position_data.position,
  position_data.company_name,
  position_data.company_location,
  position_data.metro_area,
  position_data.contact_name,
  position_data.contact_linkedin,
  position_data.company_website,
  position_data.job_listing_url,
  position_data.posted_on,
  position_data.data,
  NOW() - (position_data.days_ago || ' days')::interval
FROM org_data,
(VALUES 
  -- Test Record 1: Full structured data, no JSONB
  (
    'Senior React Developer',
    'TechCorp Solutions',
    'San Francisco, CA',
    'San Francisco Bay Area;Silicon Valley;California',
    'Sarah Johnson',
    'https://linkedin.com/in/sarah-johnson-tech',
    'https://techcorp-solutions.com',
    'https://linkedin.com/jobs/view/3891234567',
    '2025-08-15T10:30:00Z'::timestamptz,
    NULL, -- No additional JSONB data
    '1'
  ),
  -- Test Record 2: Mixed data (structured + JSONB)
  (
    'Full Stack Engineer',
    'StartupHub Inc',
    'New York, NY',
    'New York City;Manhattan;New York Metro',
    'Michael Chen',
    'https://linkedin.com/in/michael-chen-dev',
    'https://startuphub.io',
    'https://jobs.startuphub.io/fullstack-engineer-2025',
    '2025-08-20T14:20:00Z'::timestamptz,
    '{"salary_range": "$120k-180k", "remote_option": true, "benefits": ["health", "dental", "401k"], "tech_stack": ["React", "Node.js", "PostgreSQL"]}'::jsonb,
    '3'
  ),
  -- Test Record 3: Remote position
  (
    'DevOps Engineer',
    'CloudFirst Technologies',
    'Austin, TX',
    'Austin;Texas;Remote Friendly',
    'Alex Rodriguez',
    'https://linkedin.com/in/alex-rodriguez-devops',
    'https://cloudfirst.tech',
    'https://cloudfirst.tech/careers/devops-engineer',
    '2025-08-18T09:15:00Z'::timestamptz,
    '{"remote": "100%", "timezone": "US Central", "travel_required": "10%", "team_size": 8}'::jsonb,
    '2'
  ),
  -- Test Record 4: Senior position with equity info
  (
    'Staff Software Engineer',
    'GrowthCorp',
    'Seattle, WA',
    'Seattle;Pacific Northwest;Washington State',
    'Emily Davis',
    'https://linkedin.com/in/emily-davis-engineer',
    'https://growthcorp.com',
    'https://boards.greenhouse.io/growthcorp/jobs/7234567890',
    '2025-08-22T16:45:00Z'::timestamptz,
    '{"seniority": "Staff", "equity": "0.1-0.3%", "team": "Platform Engineering", "years_experience": "8+"}'::jsonb,
    '4'
  ),
  -- Test Record 5: Backend specialist
  (
    'Backend Python Developer',
    'DataFlow Systems',
    'Denver, CO',
    'Denver;Colorado;Mountain Time',
    'James Wilson',
    'https://linkedin.com/in/james-wilson-python',
    'https://dataflow-systems.com',
    'https://apply.workable.com/dataflow/j/A1B2C3D4E5/',
    '2025-08-19T11:00:00Z'::timestamptz,
    '{"specialization": "Python/Django", "databases": ["PostgreSQL", "Redis"], "cloud": "AWS", "team_lead_opportunity": true}'::jsonb,
    '5'
  ),
  -- Test Record 6: Frontend specialist with design focus
  (
    'Senior Frontend Developer',
    'DesignFirst Studio',
    'Los Angeles, CA',
    'Los Angeles;Southern California;California',
    'Maria Garcia',
    'https://linkedin.com/in/maria-garcia-frontend',
    'https://designfirst.studio',
    'https://designfirst.studio/careers/senior-frontend-dev',
    '2025-08-16T13:30:00Z'::timestamptz,
    '{"focus": "React + Design Systems", "figma_required": true, "design_collaboration": "heavy", "portfolio_review": true}'::jsonb,
    '6'
  )
) AS position_data(
  position, company_name, company_location, metro_area, contact_name, 
  contact_linkedin, company_website, job_listing_url, posted_on, data, days_ago
);

-- Also create some non-job events to test mixed display
WITH org_data AS (
  SELECT id as org_id FROM organizations LIMIT 1
)
INSERT INTO events (
  organization_id,
  type,
  data,
  created_at
)
SELECT 
  org_data.org_id,
  event_data.type,
  event_data.data,
  NOW() - (event_data.days_ago || ' days')::interval
FROM org_data,
(VALUES 
  -- Birthday event
  (
    'birthday',
    '{"person_name": "John Smith", "birthday_date": "1985-03-15", "department": "Engineering", "celebration_planned": true}'::jsonb,
    '7'
  ),
  -- Funding event
  (
    'funding-event',
    '{"company_name": "NextGen AI", "funding_amount": "$50M", "funding_round": "Series B", "lead_investor": "Venture Capital Partners"}'::jsonb,
    '10'
  ),
  -- New job event
  (
    'new-job',
    '{"person_name": "Alice Johnson", "new_company": "Tech Innovators", "previous_company": "Legacy Corp", "position": "Senior PM"}'::jsonb,
    '2'
  )
) AS event_data(type, data, days_ago);

-- Display summary of created records
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN position IS NOT NULL THEN 1 END) as structured_positions,
  COUNT(CASE WHEN data IS NOT NULL THEN 1 END) as with_jsonb_data
FROM events 
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY type
ORDER BY type;

-- Show a sample of the new job-posting records
SELECT 
  position,
  company_name,
  company_location,
  metro_area,
  contact_name,
  CASE WHEN data IS NOT NULL THEN 'Has JSONB' ELSE 'No JSONB' END as jsonb_status,
  created_at
FROM events 
WHERE type = 'job-posting' 
AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;