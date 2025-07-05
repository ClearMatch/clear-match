-- Add SELECT policy for activities table
CREATE POLICY "Users can view activities in their organization" ON activities FOR SELECT TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
