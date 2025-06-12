/*
  # Initial CRM Schema Setup

  1. Tables
    - organizations (multi-tenant support)
    - users (linked to organizations)
    - candidates (core candidate data)
    - candidate_activities (tracking interactions)
    - candidate_tags (tagging system)
    - tags (tag definitions)
    - templates (message/form templates)
    
  2. Security
    - RLS policies for multi-tenant isolation
    - Organization-based access control
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table for multi-tenant support
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Profiles table extends auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  first_name text,
  last_name text,
  role text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  personal_email text,
  work_email text,
  phone text,
  linkedin_url text,
  github_url text,
  other_social_urls jsonb,
  resume_url text,
  relationship_type text CHECK (relationship_type IN ('candidate', 'client', 'both')),
  functional_role text,
  current_location jsonb,
  current_job_title text,
  past_job_titles text[],
  current_industry text,
  past_industries text[],
  tech_stack text[],
  compensation_expectations jsonb,
  current_company text,
  past_companies text[],
  current_company_size text,
  past_company_sizes text[],
  must_haves text[],
  schools jsonb,
  workplace_preferences jsonb,
  urgency_level text,
  is_active_looking boolean DEFAULT false,
  motivation_factors text[],
  employment_status text,
  visa_requirements jsonb,
  nurturing_info jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id uuid REFERENCES candidates(id),
  organization_id uuid REFERENCES organizations(id),
  type text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id),
  name text NOT NULL,
  color text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Candidate tags junction table
CREATE TABLE IF NOT EXISTS candidate_tags (
  candidate_id uuid REFERENCES candidates(id),
  tag_id uuid REFERENCES tags(id),
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  PRIMARY KEY (candidate_id, tag_id)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id),
  name text NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  variables jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id),
  updated_by uuid REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view profiles in their organization"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can view candidates in their organization"
  ON candidates
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create candidates in their organization"
  ON candidates
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update candidates in their organization"
  ON candidates
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_candidates_organization ON candidates(organization_id);
CREATE INDEX idx_activities_candidate ON activities(candidate_id);
CREATE INDEX idx_activities_organization ON activities(organization_id);
CREATE INDEX idx_candidate_tags_candidate ON candidate_tags(candidate_id);
CREATE INDEX idx_templates_organization ON templates(organization_id);

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating timestamps
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();