-- Add INSERT policy for activities table
CREATE POLICY "Users can create activities in their organization" ON activities FOR INSERT TO authenticated WITH CHECK (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
