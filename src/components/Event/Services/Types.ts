export interface EventData {
  id: string;
  contact_id: string;
  organization_id: string;
  type: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  candidates: {
    id: string;
    first_name: string;
    last_name: string;
  };
  profiles: {
    id: string;
    first_name: string;
    last_name: string;
  };
  organizations: {
    id: string;
    name: string;
  };
}