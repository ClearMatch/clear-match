-- This migration was originally executed manually
-- It adds the level_of_connection column to the candidates table

ALTER TABLE candidates ADD COLUMN level_of_connection text;
