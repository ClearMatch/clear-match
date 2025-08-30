import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Types for HubSpot API response
interface HubSpotContact {
  id: string;
  properties: {
    hs_object_id: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    jobtitle?: string;
    company?: string;
    industry?: string;
    linkedinbio?: string;
    website?: string;
    createdate?: string;
    lastmodifieddate?: string;
    [key: string]: string | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

interface HubSpotContactsResponse {
  results: HubSpotContact[];
  paging?: {
    next?: {
      after: string;
    };
  };
}

// Field mapping from HubSpot to our database
const FIELD_MAPPING = {
  'hs_object_id': 'hubspot_id',
  'firstname': 'first_name',
  'lastname': 'last_name',
  'email': 'personal_email',
  'phone': 'phone',
  'jobtitle': 'current_job_title',
  'company': 'current_company',
  'industry': 'current_industry',
  'linkedinbio': 'linkedin_url',
  'website': 'github_url', // Using website field for additional social URLs
  'createdate': 'hubspot_created_date',
  'lastmodifieddate': 'hubspot_modified_date'
} as const;

// Transform HubSpot contact to our database format
function transformHubSpotContact(hubspotContact: HubSpotContact, organizationId: string) {
  const contact: any = {
    organization_id: organizationId,
    sync_source: 'hubspot',
    sync_status: 'synced',
    last_synced_at: new Date().toISOString(),
  };

  // Map HubSpot properties to our fields
  for (const [hubspotField, dbField] of Object.entries(FIELD_MAPPING)) {
    const value = hubspotContact.properties[hubspotField];
    if (value !== undefined && value !== null && value !== '') {
      if (hubspotField === 'createdate' || hubspotField === 'lastmodifieddate') {
        // Convert HubSpot timestamp to ISO string
        contact[dbField] = new Date(parseInt(value)).toISOString();
      } else {
        contact[dbField] = value;
      }
    }
  }

  // Add hubspot_record_id for contact correlation (same as hs_object_id)
  if (hubspotContact.properties.hs_object_id) {
    contact.hubspot_record_id = hubspotContact.properties.hs_object_id;
  }

  // Ensure required fields have defaults
  if (!contact.first_name && !contact.last_name) {
    contact.first_name = 'Unknown';
    contact.last_name = 'Contact';
  }

  return contact;
}

// Fetch contacts from HubSpot API
async function fetchHubSpotContacts(apiKey: string, after?: string): Promise<HubSpotContactsResponse> {
  const url = new URL('https://api.hubapi.com/crm/v3/objects/contacts');
  
  // Add query parameters
  url.searchParams.set('limit', '100');
  url.searchParams.set('properties', Object.keys(FIELD_MAPPING).join(','));
  
  if (after) {
    url.searchParams.set('after', after);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HubSpot API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Batch upsert contacts to Supabase
async function upsertContacts(supabase: any, contacts: any[]): Promise<number> {
  if (contacts.length === 0) return 0;

  const { data, error } = await supabase
    .from('contacts')
    .upsert(contacts, {
      onConflict: 'hubspot_record_id',
      ignoreDuplicates: false
    })
    .select('id');

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return data?.length || 0;
}

// Main Edge Function handler
Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get environment variables
    const hubspotApiKey = Deno.env.get('HUBSPOT_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!hubspotApiKey || !supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Parse request body
    const { organizationId } = await req.json();
    
    if (!organizationId) {
      return new Response(
        JSON.stringify({ error: 'Organization ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let totalSynced = 0;
    let after: string | undefined;
    let batchCount = 0;

    // Paginate through all HubSpot contacts
    do {
      try {
        batchCount++;
        
        const hubspotResponse = await fetchHubSpotContacts(hubspotApiKey, after);
        
        if (hubspotResponse.results.length === 0) {
          break;
        }

        // Transform HubSpot contacts to our format
        const contacts = hubspotResponse.results.map(contact => 
          transformHubSpotContact(contact, organizationId)
        );

        // Upsert to database
        const upsertedCount = await upsertContacts(supabase, contacts);
        totalSynced += upsertedCount;

        // Update pagination
        after = hubspotResponse.paging?.next?.after;

        // Add small delay to respect rate limits
        if (after) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (batchError) {
        // Stop processing on batch errors
        throw batchError;
      }
    } while (after);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synced ${totalSynced} contacts from HubSpot`,
        totalSynced,
        batchesProcessed: batchCount,
        organizationId
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});