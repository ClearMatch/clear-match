-- Add contact correlation fields for HubSpot integration
-- Issue #212: Correlate contacts with events using HubSpot record IDs

-- Add contact_record_id field to events table for correlation with HubSpot
ALTER TABLE public.events
ADD COLUMN contact_record_id VARCHAR;

-- Add hubspot_record_id field to contacts table  
ALTER TABLE public.contacts
ADD COLUMN hubspot_record_id VARCHAR;

-- Add unique constraint on hubspot_record_id to prevent duplicates
ALTER TABLE public.contacts
ADD CONSTRAINT contacts_hubspot_record_id_unique UNIQUE (hubspot_record_id);

-- Create index on contact_record_id for fast event->contact lookups
CREATE INDEX idx_events_contact_record_id ON public.events(contact_record_id);

-- Create index on hubspot_record_id for fast lookups during sync
CREATE INDEX idx_contacts_hubspot_record_id ON public.contacts(hubspot_record_id);

-- Add additional Clay event fields as dedicated columns
ALTER TABLE public.events
ADD COLUMN job_title VARCHAR,
ADD COLUMN company_headcount INTEGER,
ADD COLUMN alert_creation_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for commonly queried Clay fields (skip existing ones)
-- idx_events_company_name already exists
-- idx_events_posted_on already exists
CREATE INDEX idx_events_alert_creation_date ON public.events(alert_creation_date);

-- Comment on new fields
COMMENT ON COLUMN public.events.contact_record_id IS 'HubSpot record ID from Clay events for contact correlation';
COMMENT ON COLUMN public.contacts.hubspot_record_id IS 'HubSpot record ID for contact correlation';
COMMENT ON COLUMN public.events.job_title IS 'Job title from Clay job posting events';
COMMENT ON COLUMN public.events.company_headcount IS 'Company employee count from Clay events';
COMMENT ON COLUMN public.events.alert_creation_date IS 'Alert creation date from Clay events';