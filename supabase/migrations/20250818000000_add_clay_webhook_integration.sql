/*
  # Add Clay.com Webhook Integration

  1. Add data JSONB column to events table for flexible Clay payloads
  2. Create webhook_logs table for monitoring and debugging
  3. Add performance indexes
  4. Configure RLS policies for webhook_logs
*/

-- Add data column to events table for Clay webhook payloads
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS data JSONB;

-- Create webhook_logs table for monitoring and debugging
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB,
  payload JSONB,
  response_status INTEGER,
  response_body JSONB,
  error TEXT,
  processing_time_ms INTEGER,
  event_id UUID REFERENCES events(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_data_gin ON events USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status ON webhook_logs(response_status);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_id ON webhook_logs(event_id);

-- Enable RLS on webhook_logs table
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for webhook_logs table
-- Users can only view webhook logs for events in their organization
CREATE POLICY "Users can view webhook logs in their organization"
  ON webhook_logs
  FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM events 
      WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
    OR event_id IS NULL  -- Allow viewing logs without associated events
  );

-- Create policy to allow service role to insert webhook logs
CREATE POLICY "Service role can insert webhook logs"
  ON webhook_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comments for documentation
COMMENT ON COLUMN events.data IS 'Flexible JSONB storage for Clay webhook payloads and other event data';
COMMENT ON TABLE webhook_logs IS 'Audit log for all webhook requests, used for monitoring and debugging';
COMMENT ON COLUMN webhook_logs.processing_time_ms IS 'Time taken to process the webhook request in milliseconds';
COMMENT ON COLUMN webhook_logs.event_id IS 'Reference to created event, NULL if webhook failed';