-- Add DELETE policy for activities table
CREATE POLICY "Users can delete activities in their organization" ON activities FOR DELETE TO authenticated USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
