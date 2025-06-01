-- Add unique constraint for organization_id and personal_email
ALTER TABLE candidates
ADD CONSTRAINT candidates_organization_email_unique UNIQUE (organization_id, personal_email)
WHERE personal_email IS NOT NULL; 