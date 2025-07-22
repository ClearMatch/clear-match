/*
  # Create Organization Members View
  
  Creates a view that exposes profile information for organization members.
  This view simplifies querying member information across the application.
*/

-- Create view for organization members
CREATE OR REPLACE VIEW "public"."organization_members" AS 
SELECT 
    p.id,
    p.organization_id,
    p.first_name,
    p.last_name,
    p.role,
    p.created_at,
    p.updated_at
FROM profiles p;

-- Add comment for documentation
COMMENT ON VIEW "public"."organization_members" IS 'View exposing profile information for organization members';

-- Log completion
SELECT 'Organization Members View Created' AS status;