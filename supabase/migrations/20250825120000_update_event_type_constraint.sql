-- Update events table to use Clay's actual event type "job-posting" instead of "job-group-posting"
-- This aligns our database constraint with what Clay webhook actually sends

-- First, update existing data from job-group-posting to job-posting
UPDATE events 
SET type = 'job-posting' 
WHERE type = 'job-group-posting';

-- Drop the old constraint
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_type_check;

-- Add new constraint with Clay's actual event type
ALTER TABLE events ADD CONSTRAINT events_type_check 
CHECK (type = ANY (ARRAY[
    'none'::text, 
    'job-posting'::text,  -- Changed from job-group-posting to job-posting (Clay's actual type)
    'layoff'::text, 
    'birthday'::text, 
    'funding-event'::text, 
    'new-job'::text
]));

-- Update the comment to reflect the change
COMMENT ON COLUMN events.type IS 'Event type matching Clay webhook types: job-posting (not job-group-posting), layoff, birthday, funding-event, new-job, none';