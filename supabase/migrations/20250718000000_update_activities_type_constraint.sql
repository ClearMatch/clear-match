-- Update activities type constraint to include all event types from GitHub issue #138
-- This migration updates the CHECK constraint to allow all the new event types

-- First, drop the existing constraint
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;

-- Add new constraint with all event types from issue #138
ALTER TABLE activities
ADD CONSTRAINT activities_type_check
CHECK (type IN (
  -- Original types
  'none', 'email', 'call', 'video', 'text',
  
  -- New event types from GitHub issue #138
  'new-job-posting',
  'open-to-work',
  'laid-off',
  'interview',
  'funding-news',
  'company-layoffs',
  'birthday',
  'meeting',
  'm-and-a-activity',
  'email-reply-received',
  'follow-up',
  'holiday',
  'personal-interest-tag',
  'dormant-status'
));

-- Comment explaining the constraint
COMMENT ON CONSTRAINT activities_type_check ON activities IS 
'Constraint allowing all activity types from GitHub issue #138 event-driven task management system';