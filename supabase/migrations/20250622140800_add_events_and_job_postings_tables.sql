/*
  # Add Events and Job Postings Tables

  1. Create events table
    - Linked to candidates (contact_id)
    - Type field with specific allowed values
    - Organization-based access control

  2. Create job_postings table
    - Linked to events (event_id)
    - Status field with specific allowed values
    - Organization-based access control

  3. Update activities table
    - Add job_posting_id column
    - Update event_id to be UUID and foreign key
*/

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id uuid REFERENCES candidates(id),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  type text NOT NULL DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Add check constraint for event type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
        AND table_name = 'events'
        AND column_name = 'type'
        AND constraint_name = 'events_type_check'
    ) THEN
        ALTER TABLE events
        ADD CONSTRAINT events_type_check
        CHECK (type IN ('none', 'job-group-posting', 'layoff', 'birthday', 'funding-event', 'new-job'));
    END IF;
END $$;

-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  posting_date date,
  salary_range jsonb,
  event_id uuid REFERENCES events(id),
  status text NOT NULL DEFAULT 'none',
  organization_id uuid NOT NULL REFERENCES organizations(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Add check constraint for job_posting status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
        AND table_name = 'job_postings'
        AND column_name = 'status'
        AND constraint_name = 'job_postings_status_check'
    ) THEN
        ALTER TABLE job_postings
        ADD CONSTRAINT job_postings_status_check
        CHECK (status IN ('none', 'not_contracted', 'under_contract'));
    END IF;
END $$;

-- Add constraint to ensure only events with type 'job-group-posting' can have job_postings
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'public'
        AND table_name = 'job_postings'
        AND constraint_name = 'job_postings_event_type_check'
    ) THEN
        ALTER TABLE job_postings
        ADD CONSTRAINT job_postings_event_type_check
        CHECK (
            event_id IS NULL OR 
            event_id IN (
                SELECT id FROM events WHERE type = 'job-group-posting'
            )
        );
    END IF;
END $$;

-- Add job_posting_id to activities table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'job_posting_id'
    ) THEN
        ALTER TABLE activities
        ADD COLUMN job_posting_id uuid REFERENCES job_postings(id);
    END IF;
END $$;

-- Update event_id in activities table to be UUID and foreign key
-- First, create a temporary column
DO $$
BEGIN
    -- Check if the event_id column is still an integer
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'activities'
        AND column_name = 'event_id'
        AND data_type = 'integer'
    ) THEN
        -- Add a new column for the UUID
        ALTER TABLE activities
        ADD COLUMN event_id_new uuid REFERENCES events(id);
        
        -- Drop the old integer column
        ALTER TABLE activities
        DROP COLUMN event_id;
        
        -- Rename the new column to event_id
        ALTER TABLE activities
        RENAME COLUMN event_id_new TO event_id;
    END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Users can view events in their organization"
  ON events
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create events in their organization"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update events in their organization"
  ON events
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Create policies for job_postings table
CREATE POLICY "Users can view job_postings in their organization"
  ON job_postings
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create job_postings in their organization"
  ON job_postings
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update job_postings in their organization"
  ON job_postings
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_contact ON events(contact_id);
CREATE INDEX IF NOT EXISTS idx_events_organization ON events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_job_postings_event ON job_postings(event_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_organization ON job_postings(organization_id);
CREATE INDEX IF NOT EXISTS idx_activities_job_posting ON activities(job_posting_id);

-- Create triggers for updating timestamps
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
