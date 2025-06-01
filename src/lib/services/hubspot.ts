import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    work_email?: string;
    phone?: string;
    linkedin_url?: string;
    jobtitle?: string;
    company?: string;
    city?: string;
    state?: string;
    job_function?: string;
    tech_stack?: string;
    industry?: string;
  };
}

interface SyncResult {
  success: boolean;
  error?: Error;
  syncedCount?: number;
}

export class HubSpotService {
  private readonly accessToken: string;
  private readonly organizationId: string;

  constructor(accessToken: string, organizationId: string) {
    this.accessToken = accessToken;
    this.organizationId = organizationId;
  }

  async fetchContacts(): Promise<HubSpotContact[]> {
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/contacts?limit=100', {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch contacts from HubSpot');
    }

    const data = await response.json();
    return data.results;
  }

  private transformContactToCandidate(contact: HubSpotContact, userId: string) {
    const properties = contact.properties;
    return {
      organization_id: this.organizationId,
      first_name: properties.firstname || '',
      last_name: properties.lastname || '',
      personal_email: properties.email || null,
      work_email: properties.work_email || null,
      phone: properties.phone || null,
      linkedin_url: properties.linkedin_url || null,
      current_job_title: properties.jobtitle || null,
      current_company: properties.company || null,
      current_location: properties.city ? {
        city: properties.city,
        category: properties.state || 'Unknown'
      } : null,
      relationship_type: 'candidate',
      functional_role: properties.job_function || null,
      is_active_looking: false,
      tech_stack: properties.tech_stack ? properties.tech_stack.split(';') : [],
      current_industry: properties.industry || null,
      created_by: userId,
      updated_by: userId,
      nurturing_info: {
        source: 'hubspot',
        hubspot_id: contact.id,
        last_sync: new Date().toISOString(),
        properties: properties
      }
    };
  }

  private async createActivityRecords(candidates: any[], userId: string) {
    const activities = candidates.map((candidate: any) => ({
      organization_id: this.organizationId,
      candidate_id: candidate.id,
      type: 'sync',
      description: 'Synced from HubSpot',
      metadata: {
        source: 'hubspot',
        sync_date: new Date().toISOString()
      },
      created_by: userId
    }));

    if (activities.length > 0) {
      const { error: activityError } = await supabase
        .from('activities')
        .insert(activities);

      if (activityError) {
        console.error('Error creating activity records:', activityError);
        throw activityError;
      }
    }
  }

  async syncContacts(userId: string): Promise<SyncResult> {
    try {
      const contacts = await this.fetchContacts();
      console.log(JSON.stringify(contacts));
      const candidates = contacts.map(contact => this.transformContactToCandidate(contact, userId));

      // First, try to find existing candidates by email
      const emails = candidates
        .filter(c => c.personal_email)
        .map(c => c.personal_email);

      const { data: existingCandidates, error: fetchError } = await supabase
        .from('candidates')
        .select('id, personal_email')
        .eq('organization_id', this.organizationId)
        .in('personal_email', emails);

      if (fetchError) {
        throw fetchError;
      }

      // Create a map of email to candidate ID for existing candidates
      const existingMap = new Map(
        existingCandidates?.map(c => [c.personal_email, c.id]) || []
      );

      // Split candidates into updates and inserts
      const toUpdate = candidates.filter(c => 
        c.personal_email && existingMap.has(c.personal_email)
      ).map(c => ({
        ...c,
        id: existingMap.get(c.personal_email)
      }));

      const toInsert = candidates.filter(c => 
        !c.personal_email || !existingMap.has(c.personal_email)
      );

      // Perform updates and inserts
      const updatePromises = toUpdate.map(candidate => 
        supabase
          .from('candidates')
          .update(candidate)
          .eq('id', candidate.id)
      );

      const { error: insertError } = await supabase
        .from('candidates')
        .insert(toInsert);

      if (insertError) {
        throw insertError;
      }

      // Wait for all updates to complete
      const updateResults = await Promise.all(updatePromises);
      const updateErrors = updateResults
        .map(r => r.error)
        .filter((e): e is PostgrestError => e !== null);

      if (updateErrors.length > 0) {
        throw updateErrors[0];
      }

      await this.createActivityRecords(candidates, userId);

      return {
        success: true,
        syncedCount: candidates.length
      };
    } catch (error) {
      console.error('Error syncing contacts:', error);
      return {
        success: false,
        error: error instanceof Error ? error : new Error('Unknown error occurred')
      };
    }
  }
} 