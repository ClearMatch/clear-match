-- Add phone field to profiles table for SMS functionality
ALTER TABLE profiles ADD COLUMN phone text;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone IS 'Phone number for SMS messaging functionality';