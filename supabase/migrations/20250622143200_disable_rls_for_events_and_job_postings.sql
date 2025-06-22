/*
  # Disable RLS for events and job_postings tables

  This migration disables Row Level Security (RLS) for the events and job_postings tables.
*/

-- Disable RLS on events table
ALTER TABLE events DISABLE ROW LEVEL SECURITY;

-- Disable RLS on job_postings table
ALTER TABLE job_postings DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies for events table
DROP POLICY IF EXISTS "Users can view events in their organization" ON events;
DROP POLICY IF EXISTS "Users can create events in their organization" ON events;
DROP POLICY IF EXISTS "Users can update events in their organization" ON events;

-- Drop RLS policies for job_postings table
DROP POLICY IF EXISTS "Users can view job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can create job_postings in their organization" ON job_postings;
DROP POLICY IF EXISTS "Users can update job_postings in their organization" ON job_postings;
