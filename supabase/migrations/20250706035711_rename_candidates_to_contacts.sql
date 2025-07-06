-- Migration to rename candidates table to contacts and relationship_type to contact_type
-- This maintains all existing data and relationships

-- First, rename the table
ALTER TABLE candidates RENAME TO contacts;

-- Rename the relationship_type column to contact_type
ALTER TABLE contacts RENAME COLUMN relationship_type TO contact_type;

-- Update the check constraint to use the new column name
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS candidates_relationship_type_check;
ALTER TABLE contacts ADD CONSTRAINT contacts_contact_type_check 
  CHECK (contact_type IN ('candidate', 'client', 'both'));

-- Update foreign key references in other tables
-- Activities table
ALTER TABLE activities RENAME COLUMN candidate_id TO contact_id;

-- Candidate tags table
ALTER TABLE candidate_tags RENAME TO contact_tags;
ALTER TABLE contact_tags RENAME COLUMN candidate_id TO contact_id;

-- Update indexes
DROP INDEX IF EXISTS idx_candidates_organization;
CREATE INDEX idx_contacts_organization ON contacts(organization_id);

DROP INDEX IF EXISTS idx_activities_candidate;
CREATE INDEX idx_activities_contact ON activities(contact_id);

DROP INDEX IF EXISTS idx_candidate_tags_candidate;  
CREATE INDEX idx_contact_tags_contact ON contact_tags(contact_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Authenticated users can view all candidates" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can create candidates" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON contacts;

CREATE POLICY "Authenticated users can view all contacts"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create contacts"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contacts"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (true);

-- Update the update trigger
DROP TRIGGER IF EXISTS update_candidates_updated_at ON contacts;
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Update comments/documentation
COMMENT ON TABLE contacts IS 'Core contact data - can be candidates, clients, or both';
COMMENT ON COLUMN contacts.contact_type IS 'Type of contact: candidate, client, or both';