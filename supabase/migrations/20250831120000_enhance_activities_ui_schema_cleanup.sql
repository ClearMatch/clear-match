-- Migration: Enhance Activities UI - Schema Cleanup and Performance
-- Remove contact-related fields from events table and add idempotency constraints

-- Remove contact-related fields that should not be on events (all currently null)
ALTER TABLE public.events
DROP COLUMN IF EXISTS compensation_target,
DROP COLUMN IF EXISTS compensation_minimum,
DROP COLUMN IF EXISTS workplace_preference,
DROP COLUMN IF EXISTS work_authorization,
DROP COLUMN IF EXISTS work_authorization_notes,
DROP COLUMN IF EXISTS ideal_role_description,
DROP COLUMN IF EXISTS candidate_search_criteria,
DROP COLUMN IF EXISTS current_status_job_search,
DROP COLUMN IF EXISTS relationship_to_job_market,
DROP COLUMN IF EXISTS current_workplace_situation,
DROP COLUMN IF EXISTS additional_notes_on_compensation;

-- Add unique constraint to prevent duplicate Clay events
-- This ensures idempotency for Clay webhook events
ALTER TABLE public.events 
ADD CONSTRAINT events_unique_job_posting 
UNIQUE (contact_id, company_name, job_title, posted_on);

-- Add performance indexes for common Clay data queries
CREATE INDEX IF NOT EXISTS idx_events_company_job ON public.events(company_name, job_title);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_contact_company ON public.events(contact_id, company_name);

-- Add comments to document the schema cleanup
COMMENT ON CONSTRAINT events_unique_job_posting ON public.events IS 'Ensures Clay webhook idempotency - prevents duplicate job posting events for the same contact';
COMMENT ON INDEX idx_events_company_job IS 'Performance index for activities UI displaying company and job data';
COMMENT ON INDEX idx_events_created_at IS 'Performance index for recent events queries';
COMMENT ON INDEX idx_events_contact_company IS 'Performance index for contact-company activity correlations';