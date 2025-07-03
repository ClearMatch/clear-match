/*
  # Add Activities Table Policies
  
  The activities table has RLS enabled but no policies, which blocks all operations.
  This migration adds the necessary policies for activities.
*/

-- Add policies for activities table
DO $$
BEGIN
    -- Policy for SELECT (viewing activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Authenticated users can view activities'
    ) THEN
        CREATE POLICY "Authenticated users can view activities"
        ON activities FOR SELECT
        TO authenticated
        USING (true);
    END IF;
    
    -- Policy for INSERT (creating activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Authenticated users can create activities'
    ) THEN
        CREATE POLICY "Authenticated users can create activities"
        ON activities FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
    
    -- Policy for UPDATE (updating activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Authenticated users can update activities'
    ) THEN
        CREATE POLICY "Authenticated users can update activities"
        ON activities FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
    
    -- Policy for DELETE (deleting activities)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND policyname = 'Authenticated users can delete activities'
    ) THEN
        CREATE POLICY "Authenticated users can delete activities"
        ON activities FOR DELETE
        TO authenticated
        USING (true);
    END IF;
END $$;