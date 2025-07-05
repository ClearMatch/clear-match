-- Add UPDATE policy for activities table
CREATE POLICY "Users can update activities in their organization" ON activities FOR UPDATE TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
