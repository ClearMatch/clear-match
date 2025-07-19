-- Migration: Add HubSpot sync fields to contacts table
-- This enables tracking of HubSpot integration status and data synchronization

-- Add HubSpot integration fields to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_id text UNIQUE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_created_date timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS hubspot_modified_date timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sync_source text DEFAULT 'manual';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sync_status text DEFAULT 'pending';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sync_error_message text;

-- Add check constraints for enum-like columns
ALTER TABLE contacts ADD CONSTRAINT contacts_sync_source_check 
  CHECK (sync_source IN ('manual', 'hubspot', 'import'));

ALTER TABLE contacts ADD CONSTRAINT contacts_sync_status_check 
  CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error'));

-- Create indexes for efficient HubSpot operations
CREATE INDEX IF NOT EXISTS idx_contacts_hubspot_id 
  ON contacts(hubspot_id) WHERE hubspot_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_sync_status 
  ON contacts(sync_status);

CREATE INDEX IF NOT EXISTS idx_contacts_hubspot_modified 
  ON contacts(hubspot_modified_date) WHERE hubspot_modified_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_sync_source 
  ON contacts(sync_source);

-- Add comments for documentation
COMMENT ON COLUMN contacts.hubspot_id IS 'HubSpot object ID (hs_object_id) for tracking sync relationship';
COMMENT ON COLUMN contacts.hubspot_created_date IS 'Creation date from HubSpot (createdate property)';
COMMENT ON COLUMN contacts.hubspot_modified_date IS 'Last modified date from HubSpot (lastmodifieddate property)';
COMMENT ON COLUMN contacts.sync_source IS 'Source of contact data: manual, hubspot, or import';
COMMENT ON COLUMN contacts.last_synced_at IS 'Timestamp of last successful sync with HubSpot';
COMMENT ON COLUMN contacts.sync_status IS 'Current sync status: pending, syncing, synced, or error';
COMMENT ON COLUMN contacts.sync_error_message IS 'Error message if sync failed';

-- Fix engagement score constraint issue (detected by diff)
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_engagement_score_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_engagement_score_check 
  CHECK ((engagement_score >= 1) AND (engagement_score <= 10));