/*
  # Add Clay Webhook Columns to Events Table
  
  This migration adds structured columns to the events table to support Clay webhook integration
  for job-listing events. These columns will replace the current JSONB-only approach with
  structured data for better querying and indexing.
  
  ## Changes:
  1. Add structured columns for job listing data from Clay webhooks
  2. Add indexes for performance optimization
  3. Maintain backward compatibility with existing JSONB data
  
  ## Clay Payload Structure:
  Based on production data analysis, Clay sends job listing events with:
  - position: Job title
  - posted_on: When the job was posted (ISO date)
  - metro_area: Geographic areas (semicolon-separated)
  - company_name: Company name
  - contact_name: Contact person name
  - company_website: Company website URL
  - job_listing_url: Direct link to job posting
  - company_location: Company location
  - contact_linkedin: LinkedIn profile URL of contact
*/

-- Add structured columns for Clay webhook job listing data
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS position text,
ADD COLUMN IF NOT EXISTS posted_on timestamptz,
ADD COLUMN IF NOT EXISTS metro_area text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS company_website text,
ADD COLUMN IF NOT EXISTS job_listing_url text,
ADD COLUMN IF NOT EXISTS company_location text,
ADD COLUMN IF NOT EXISTS contact_linkedin text;

-- Add indexes for performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_events_position ON events(position);
CREATE INDEX IF NOT EXISTS idx_events_posted_on ON events(posted_on);
CREATE INDEX IF NOT EXISTS idx_events_company_name ON events(company_name);
CREATE INDEX IF NOT EXISTS idx_events_contact_name ON events(contact_name);

-- Add composite index for job listing queries (type + posted_on)
CREATE INDEX IF NOT EXISTS idx_events_job_listing_queries 
ON events(type, posted_on) 
WHERE type = 'job-group-posting';

-- Add comment to document the change
COMMENT ON COLUMN events.position IS 'Job title from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.posted_on IS 'Job posting date from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.metro_area IS 'Geographic areas from Clay webhook, semicolon-separated (job-listing events)';
COMMENT ON COLUMN events.company_name IS 'Company name from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.contact_name IS 'Contact person name from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.company_website IS 'Company website URL from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.job_listing_url IS 'Direct link to job posting from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.company_location IS 'Company location from Clay webhook (job-listing events)';
COMMENT ON COLUMN events.contact_linkedin IS 'LinkedIn profile URL from Clay webhook (job-listing events)';