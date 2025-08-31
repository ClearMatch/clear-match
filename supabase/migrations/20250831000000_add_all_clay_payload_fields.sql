-- Add all Clay job-posting payload fields as dedicated database columns
-- This replaces storing everything in JSONB with structured, queryable columns

-- Add all remaining Clay job-posting fields to events table
ALTER TABLE public.events

-- Job and company details (already have some)
ADD COLUMN IF NOT EXISTS metro_area VARCHAR,
ADD COLUMN IF NOT EXISTS company_website VARCHAR,
ADD COLUMN IF NOT EXISTS company_location VARCHAR,
ADD COLUMN IF NOT EXISTS job_listing_url VARCHAR,

-- Compensation fields
ADD COLUMN compensation_target VARCHAR,
ADD COLUMN compensation_minimum VARCHAR,

-- Work preferences
ADD COLUMN workplace_preference VARCHAR,
ADD COLUMN work_authorization VARCHAR,
ADD COLUMN work_authorization_notes TEXT,

-- Job search context
ADD COLUMN ideal_role_description TEXT,
ADD COLUMN candidate_search_criteria TEXT,
ADD COLUMN current_status_job_search VARCHAR,
ADD COLUMN relationship_to_job_market VARCHAR,
ADD COLUMN current_workplace_situation VARCHAR,
ADD COLUMN additional_notes_on_compensation TEXT;

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_events_metro_area ON public.events(metro_area);
CREATE INDEX IF NOT EXISTS idx_events_workplace_preference ON public.events(workplace_preference);
CREATE INDEX IF NOT EXISTS idx_events_work_authorization ON public.events(work_authorization);
CREATE INDEX IF NOT EXISTS idx_events_compensation_target ON public.events(compensation_target);

-- Add comments to document the Clay field mappings
COMMENT ON COLUMN public.events.metro_area IS 'Major metro area from Clay job posting events ({{Major Metro}})';
COMMENT ON COLUMN public.events.company_website IS 'Company domain from Clay events ({{Company Domain}})';
COMMENT ON COLUMN public.events.company_location IS 'Company location from Clay events ({{Locality}})';
COMMENT ON COLUMN public.events.job_listing_url IS 'Job LinkedIn URL from Clay events ({{Job LinkedIn Url}})';
COMMENT ON COLUMN public.events.compensation_target IS 'Target compensation from Clay events ({{Compensation Target}})';
COMMENT ON COLUMN public.events.compensation_minimum IS 'Minimum compensation from Clay events ({{Compensation Minimum}})';
COMMENT ON COLUMN public.events.workplace_preference IS 'Work preference from Clay events ({{Work Preference}})';
COMMENT ON COLUMN public.events.work_authorization IS 'Work authorization status from Clay events ({{Work Authorization}})';
COMMENT ON COLUMN public.events.work_authorization_notes IS 'Work authorization notes from Clay events ({{Work Authorization Notes}})';
COMMENT ON COLUMN public.events.ideal_role_description IS 'Ideal role description from Clay events ({{Ideal Role Description}})';
COMMENT ON COLUMN public.events.candidate_search_criteria IS 'Candidate search criteria from Clay events ({{Candidate Search Criteria}})';
COMMENT ON COLUMN public.events.current_status_job_search IS 'Current job search status from Clay events ({{Current Status Of Job Search Process}})';
COMMENT ON COLUMN public.events.relationship_to_job_market IS 'Relationship to job market from Clay events ({{Relationship To Job Market}})';
COMMENT ON COLUMN public.events.current_workplace_situation IS 'Current workplace situation from Clay events ({{Current Workplace Situation}})';
COMMENT ON COLUMN public.events.additional_notes_on_compensation IS 'Additional compensation notes from Clay events ({{Additional Notes On Compensation}})';