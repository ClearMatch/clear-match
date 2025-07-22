/*
  # Enable JWT Extension
  
  Enables the pgjwt extension required for JWT token handling in Supabase.
  This extension provides functions for creating and verifying JWT tokens.
*/

-- Enable JWT extension for token handling
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";

-- Log completion
SELECT 'JWT Extension Enabled' AS status;