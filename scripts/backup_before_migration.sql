-- Backup Script - Run before Single-Tenant Consolidation Migration
-- This script creates a comprehensive backup of all organization-related data
-- Author: Claude AI Assistant
-- Date: 2025-07-11

-- Create backup tables with original data
DO $$
BEGIN
    RAISE NOTICE 'Creating backup tables before single-tenant consolidation...';
    
    -- Backup organizations table
    DROP TABLE IF EXISTS backup_organizations;
    CREATE TABLE backup_organizations AS 
    SELECT * FROM organizations;
    
    -- Backup profiles table
    DROP TABLE IF EXISTS backup_profiles;
    CREATE TABLE backup_profiles AS 
    SELECT * FROM profiles;
    
    -- Backup contacts table
    DROP TABLE IF EXISTS backup_contacts;
    CREATE TABLE backup_contacts AS 
    SELECT * FROM contacts;
    
    -- Backup activities table
    DROP TABLE IF EXISTS backup_activities;
    CREATE TABLE backup_activities AS 
    SELECT * FROM activities;
    
    -- Backup events table
    DROP TABLE IF EXISTS backup_events;
    CREATE TABLE backup_events AS 
    SELECT * FROM events;
    
    -- Backup templates table
    DROP TABLE IF EXISTS backup_templates;
    CREATE TABLE backup_templates AS 
    SELECT * FROM templates;
    
    -- Backup tags table
    DROP TABLE IF EXISTS backup_tags;
    CREATE TABLE backup_tags AS 
    SELECT * FROM tags;
    
    -- Backup contact_tags table
    DROP TABLE IF EXISTS backup_contact_tags;
    CREATE TABLE backup_contact_tags AS 
    SELECT * FROM contact_tags;
    
    -- Backup job_postings table
    DROP TABLE IF EXISTS backup_job_postings;
    CREATE TABLE backup_job_postings AS 
    SELECT * FROM job_postings;
    
    RAISE NOTICE 'Backup completed successfully';
    RAISE NOTICE 'Backup tables created:';
    RAISE NOTICE '  - backup_organizations';
    RAISE NOTICE '  - backup_profiles';
    RAISE NOTICE '  - backup_contacts';
    RAISE NOTICE '  - backup_activities';
    RAISE NOTICE '  - backup_events';
    RAISE NOTICE '  - backup_templates';
    RAISE NOTICE '  - backup_tags';
    RAISE NOTICE '  - backup_contact_tags';
    RAISE NOTICE '  - backup_job_postings';
END $$;