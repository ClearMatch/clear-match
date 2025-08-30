-- Temporarily leave hubspot_record_id as nullable for development
-- Will be made NOT NULL after HubSpot sync is working and all contacts have record IDs

-- In production deployment, we would:
-- 1. First run HubSpot sync to populate all contacts with hubspot_record_id
-- 2. Then make the column NOT NULL in a separate migration

-- For now, just add comment explaining future requirement
COMMENT ON COLUMN public.contacts.hubspot_record_id IS 'HubSpot record ID for contact correlation - will be required after sync implementation';