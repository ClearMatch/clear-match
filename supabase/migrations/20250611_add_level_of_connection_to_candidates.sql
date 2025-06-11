-- Add nullable text column 'level_of_connection' to 'candidates' table

ALTER TABLE candidates
ADD COLUMN level_of_connection text;
