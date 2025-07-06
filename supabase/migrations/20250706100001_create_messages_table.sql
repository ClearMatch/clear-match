-- Create messages table for SMS functionality
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  activity_id uuid REFERENCES activities(id) NOT NULL,
  sender_id uuid REFERENCES profiles(id) NOT NULL,
  contact_id uuid REFERENCES contacts(id) NOT NULL,
  direction text CHECK (direction IN ('outbound', 'inbound')) DEFAULT 'outbound',
  phone_from text NOT NULL,
  phone_to text NOT NULL,
  message_body text NOT NULL,
  status text CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received')) DEFAULT 'pending',
  twilio_message_sid text,
  twilio_status text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_messages_activity ON messages(activity_id);
CREATE INDEX idx_messages_contact ON messages(contact_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_organization ON messages(organization_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view messages in their organization"
  ON messages FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can create messages in their organization"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update messages in their organization"
  ON messages FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Add trigger for updating timestamps
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Add comments for documentation
COMMENT ON TABLE messages IS 'SMS messages sent through the system';
COMMENT ON COLUMN messages.direction IS 'Direction of message: outbound (sent) or inbound (received)';
COMMENT ON COLUMN messages.status IS 'Message status: pending, sent, delivered, failed, or received';
COMMENT ON COLUMN messages.twilio_message_sid IS 'Twilio message SID for tracking';
COMMENT ON COLUMN messages.twilio_status IS 'Status returned by Twilio';
COMMENT ON COLUMN messages.error_message IS 'Error message if sending failed';