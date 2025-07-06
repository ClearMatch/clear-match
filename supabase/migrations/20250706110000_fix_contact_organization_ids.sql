-- Fix contacts with null organization_id
-- This migration assigns all contacts to the first available organization
-- In a production environment, this would need more careful consideration

-- First, let's see what organizations exist
DO $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Get the first organization ID from the profiles table
  SELECT DISTINCT organization_id INTO default_org_id 
  FROM profiles 
  WHERE organization_id IS NOT NULL 
  LIMIT 1;
  
  -- If we found an organization, update all contacts with null organization_id
  IF default_org_id IS NOT NULL THEN
    UPDATE contacts 
    SET organization_id = default_org_id 
    WHERE organization_id IS NULL;
    
    RAISE NOTICE 'Updated % contacts to organization %', 
      (SELECT COUNT(*) FROM contacts WHERE organization_id = default_org_id),
      default_org_id;
  ELSE
    RAISE NOTICE 'No organization found in profiles table';
  END IF;
END $$;