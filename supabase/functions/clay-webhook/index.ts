import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Allowed event types (matching database constraint)
const ALLOWED_EVENT_TYPES = [
  'none',
  'job-posting',  // Updated to match Clay's actual event type
  'layoff',
  'birthday',
  'funding-event',
  'new-job'
];

// Map Clay event types to our database types
// Clay sends 'job-posting' and we now store it as 'job-posting' (no mapping needed)
const EVENT_TYPE_MAPPING: Record<string, string> = {
  // No mapping needed - Clay's 'job-posting' matches our database constraint
};

// Map Clay payload fields to database columns - comprehensive mapping for all Clay fields
const CLAY_FIELD_MAPPING: Record<string, string> = {
  // Job details
  'position': 'position',
  'posted_on': 'posted_on', 
  'metro_area': 'metro_area',
  'company_name': 'company_name',
  'company_website': 'company_website',
  'job_listing_url': 'job_listing_url',
  'company_location': 'company_location',
  
  // Compensation fields  
  'compensation_target': 'compensation_target',
  'compensation_minimum': 'compensation_minimum',
  'additional_notes_on_compensation': 'additional_notes_on_compensation',
  
  // Work preferences
  'workplace_preference': 'workplace_preference',
  'work_authorization': 'work_authorization',
  'work_authorization_notes': 'work_authorization_notes',
  
  // Job search context
  'ideal_role_description': 'ideal_role_description',
  'candidate_search_criteria': 'candidate_search_criteria',
  'current_status_job_search': 'current_status_job_search',
  'relationship_to_job_market': 'relationship_to_job_market',
  'current_workplace_situation': 'current_workplace_situation',
  
  // Contact fields (kept for backwards compatibility if needed)
  'contact_name': 'contact_name',
  'contact_linkedin': 'contact_linkedin',
};

// Reserved database column names to filter from data JSONB
// These fields have dedicated columns and should not be stored in JSONB
const RESERVED_FIELDS = [
  // Database system fields
  'id',
  'contact_id',
  'organization_id',
  'created_at',
  'updated_at',
  'created_by',
  'type',
  'email',
  
  // Existing Clay fields with dedicated columns
  'job_title',
  'company_headcount',
  'alert_creation_date',
  
  // All Clay fields mapped to dedicated columns
  'position',
  'posted_on',
  'metro_area',
  'company_name',
  'company_website',
  'job_listing_url',
  'company_location',
  'compensation_target',
  'compensation_minimum',
  'additional_notes_on_compensation',
  'workplace_preference',
  'work_authorization',
  'work_authorization_notes',
  'ideal_role_description',
  'candidate_search_criteria',
  'current_status_job_search',
  'relationship_to_job_market',
  'current_workplace_situation',
  'contact_name',
  'contact_linkedin',
];

interface WebhookLog {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  payload: any;
  response_status: number | null;
  response_body: any;
  error: string | null;
  processing_time_ms: number | null;
  event_id: string | null;
}

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Helper function to parse and validate dates
function parseDate(dateString: string): string | null {
  try {
    const parsedDate = new Date(dateString);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date format:', dateString);
      return null;
    }
    return parsedDate.toISOString();
  } catch (error) {
    console.warn('Date parsing error:', error);
    return null;
  }
}

// Clay event types with their importance scores
// Keep Clay event types as-is, assign importance based on business value
const CLAY_EVENT_IMPORTANCE: Record<string, number> = {
  'job-posting': 10,        // Highest - new opportunities
  'funding-event': 8,       // High - company growth signals
  'layoff': 9,              // High - immediate outreach opportunity
  'new-job': 8,             // High - relationship status change
  'birthday': 6,            // Medium - personal touch opportunity
  'none': 4                 // Low - generic events
};

// Calculate event priority using Clay event importance with modifiers
function calculateEventPriority(clayEventType: string, eventData: any): number {
  // Get base importance for Clay event type
  let baseImportance = CLAY_EVENT_IMPORTANCE[clayEventType] || 4;
  let modifiers = 0;
  
  // Recent events modifier (< 7 days)
  if (eventData.posted_on || eventData.alert_creation_date) {
    const eventDate = new Date(eventData.posted_on || eventData.alert_creation_date);
    const daysSinceEvent = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceEvent < 7) {
      modifiers += 1;
    }
  }
  
  // Large company modifier (>1000 employees)
  if (eventData.company_headcount && parseInt(eventData.company_headcount) > 1000) {
    modifiers += 1;
  }
  
  // Senior position modifier
  const seniorKeywords = ['Senior', 'Lead', 'Principal', 'Director', 'VP', 'Chief', 'Head'];
  if (eventData.position || eventData.job_title) {
    const title = (eventData.position || eventData.job_title).toLowerCase();
    if (seniorKeywords.some(keyword => title.includes(keyword.toLowerCase()))) {
      modifiers += 1;
    }
  }
  
  return baseImportance + modifiers;
}

// Generate subject line based on event type
function generateActivitySubject(eventType: string, eventData: any): string {
  switch (eventType) {
    case 'job-posting':
      const position = eventData.position || eventData.job_title || 'Position';
      const company = eventData.company_name || 'Company';
      return `Follow up: ${position} opening at ${company}`;
    
    case 'funding-event':
      const fundingCompany = eventData.company_name || 'Company';
      return `Follow up: Funding event at ${fundingCompany}`;
    
    case 'layoff':
      const layoffCompany = eventData.company_name || 'Company';
      return `Outreach opportunity: Layoffs at ${layoffCompany}`;
    
    case 'new-job':
      const newJobCompany = eventData.company_name || 'new company';
      return `Congratulate on new position at ${newJobCompany}`;
    
    case 'birthday':
      return 'Send birthday wishes';
    
    default:
      return `Follow up on ${eventType} event`;
  }
}

// Generate activity content based on event type
function generateActivityContent(eventType: string, eventData: any): string {
  const baseInfo = [
    eventData.company_name && `Company: ${eventData.company_name}`,
    eventData.position && `Position: ${eventData.position}`,
    eventData.job_title && `Job Title: ${eventData.job_title}`,
    eventData.company_location && `Location: ${eventData.company_location}`,
    eventData.posted_on && `Posted: ${new Date(eventData.posted_on).toLocaleDateString()}`,
  ].filter(Boolean).join(', ');
  
  switch (eventType) {
    case 'job-posting':
      return `New job posting detected for this contact. ${baseInfo}. Consider reaching out about this opportunity or similar roles at the company.`;
    
    case 'funding-event':
      return `Funding activity detected for this contact's company. ${baseInfo}. This may indicate growth opportunities and increased hiring needs.`;
    
    case 'layoff':
      return `Layoff event detected at contact's company. ${baseInfo}. Consider reaching out with support and new opportunities.`;
    
    case 'new-job':
      return `Contact has started a new position. ${baseInfo}. Great opportunity to congratulate and reconnect.`;
    
    case 'birthday':
      return `Contact's birthday. Personal touch opportunity to strengthen relationship.`;
    
    default:
      return `${eventType} event detected. ${baseInfo}. Review and determine appropriate follow-up action.`;
  }
}

// Calculate due date based on event type
function calculateDueDate(eventType: string): string {
  const now = new Date();
  let daysToAdd = 7; // Default 7 days
  
  switch (eventType) {
    case 'job-posting':
      daysToAdd = 2; // Urgent - job postings need quick follow-up
      break;
    case 'funding-event':
      daysToAdd = 3; // High priority - funding indicates growth
      break;
    case 'layoff':
      daysToAdd = 1; // Very urgent - support needed quickly
      break;
    case 'new-job':
      daysToAdd = 3; // Moderate urgency - congratulate soon
      break;
    case 'birthday':
      daysToAdd = 0; // Same day if possible
      break;
    default:
      daysToAdd = 7; // Standard follow-up
  }
  
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString().split('T')[0]; // Return just the date part
}

// Generate activity from event data
async function generateActivityFromEvent(
  supabase: any, 
  event: any, 
  contactId: string, 
  organizationId: string, 
  engagementScore: number
): Promise<string | null> {
  try {
    const eventImportance = calculateEventPriority(event.type, event);
    
    // Use existing priority calculation system: engagement_score × event_importance
    // Map result to 1-4 priority system (activities use 1-4, not 1-6)
    const calculatedScore = engagementScore * eventImportance;
    let activityPriority = 1; // Default to Low
    if (calculatedScore >= 80) activityPriority = 4; // Critical
    else if (calculatedScore >= 60) activityPriority = 3; // High
    else if (calculatedScore >= 40) activityPriority = 2; // Medium
    else activityPriority = 1; // Low
    
    const activityData = {
      type: event.type, // Keep Clay event type directly
      contact_id: contactId,
      event_id: event.id,
      organization_id: organizationId,
      priority: activityPriority,
      status: 'todo', // This matches the activities_status_check constraint
      subject: generateActivitySubject(event.type, event),
      content: generateActivityContent(event.type, event),
      due_date: calculateDueDate(event.type),
      created_by: null // System-generated
    };
    
    console.log('Creating activity with data:', {
      event_type: event.type,
      calculated_score: calculatedScore,
      priority: activityData.priority,
      subject: activityData.subject,
      due_date: activityData.due_date,
      event_id: event.id,
      contact_id: contactId
    });
    
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert(activityData)
      .select('id')
      .single();
    
    if (activityError) {
      console.error('Activity creation error:', activityError);
      return null;
    }
    
    console.log(`Activity created successfully: ${activity.id}`);
    return activity.id;
    
  } catch (error) {
    console.error('Error generating activity from event:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let webhookLog: WebhookLog = {
    endpoint: '/clay-webhook',
    method: req.method,
    headers: {},
    payload: null,
    response_status: null,
    response_body: null,
    error: null,
    processing_time_ms: null,
    event_id: null,
  };

  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      webhookLog.response_status = 405;
      webhookLog.error = 'Method not allowed';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract and validate API key
    const apiKey = req.headers.get('x-api-key');
    const expectedApiKey = Deno.env.get('CLAY_WEBHOOK_API_KEY');
    
    if (!expectedApiKey) {
      webhookLog.response_status = 500;
      webhookLog.error = 'CLAY_WEBHOOK_API_KEY not configured';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (apiKey !== expectedApiKey) {
      webhookLog.response_status = 401;
      webhookLog.error = 'Unauthorized - invalid API key';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    let body: any;
    let rawText = '';
    try {
      rawText = await req.text();
      
      // Log request details for debugging
      console.log('Request headers:', Object.fromEntries(req.headers.entries()));
      console.log('Raw request body length:', rawText.length);
      console.log('Raw request body (first 500 chars):', rawText.substring(0, 500));
      
      // Check for empty body
      if (!rawText || rawText.trim().length === 0) {
        webhookLog.response_status = 400;
        webhookLog.error = 'Empty request body';
        webhookLog.headers = Object.fromEntries(req.headers.entries());
        await logWebhook(webhookLog);
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body',
            hint: 'Ensure Clay HTTP API is configured to send JSON in the request body'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Aggressive sanitization of undefined values
      // Use simple global replace for all undefined patterns
      let sanitizedText = rawText
        .replace(/:\s*undefined/g, ': null')  // Object values
        .replace(/,\s*undefined/g, ', null')  // Array/object middle values
        .replace(/\[\s*undefined/g, '[null')  // Array start
        .replace(/undefined\s*\]/g, 'null]')  // Array end
        .replace(/undefined\s*}/g, 'null}')  // Object end
        .replace(/"undefined"/g, 'null');     // String "undefined"
      
      // Log if we made changes
      if (rawText !== sanitizedText) {
        console.log('Sanitized JSON (changes made, first 500 chars):', sanitizedText.substring(0, 500));
      }
      
      body = JSON.parse(sanitizedText);
      webhookLog.payload = body;
      webhookLog.headers = Object.fromEntries(req.headers.entries());
    } catch (parseError: any) {
      webhookLog.response_status = 400;
      webhookLog.error = `Invalid JSON: ${parseError.message}`;
      console.error('JSON parse error:', parseError.message);
      console.error('Failed to parse text (first 1000 chars):', rawText.substring(0, 1000));
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON payload',
          details: parseError.message,
          hint: 'Check Clay field mappings for undefined values'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate required type field
    if (!body.type || typeof body.type !== 'string') {
      webhookLog.response_status = 400;
      webhookLog.error = 'Missing or invalid required field: type';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ 
          error: 'Missing required field: type',
          allowed_types: [...ALLOWED_EVENT_TYPES, ...Object.keys(EVENT_TYPE_MAPPING)]
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Map Clay event types to our database types
    const mappedType = EVENT_TYPE_MAPPING[body.type] || body.type;

    // Validate event type
    if (!ALLOWED_EVENT_TYPES.includes(mappedType)) {
      webhookLog.response_status = 400;
      webhookLog.error = `Invalid event type: ${body.type}`;
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ 
          error: `Invalid event type: ${body.type}`,
          allowed_types: [...ALLOWED_EVENT_TYPES, ...Object.keys(EVENT_TYPE_MAPPING)]
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      webhookLog.response_status = 500;
      webhookLog.error = 'Supabase configuration missing';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get organization ID
    const organizationId = Deno.env.get('CLAY_ORGANIZATION_ID');
    if (!organizationId) {
      webhookLog.response_status = 500;
      webhookLog.error = 'CLAY_ORGANIZATION_ID not configured';
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract fields and process them based on event type
    const { type, email, ...allFields } = body;
    const structuredData: Record<string, any> = {};
    const jsonbData: Record<string, any> = {};
    
    // Enhanced data processing for job-posting events
    if (mappedType === 'job-posting') {
      console.log('Processing job-posting event with structured field mapping');
      
      // Process Clay fields into structured columns vs JSONB
      for (const [clayField, dbColumn] of Object.entries(CLAY_FIELD_MAPPING)) {
        if (clayField in allFields && allFields[clayField] !== null && allFields[clayField] !== undefined) {
          let fieldValue = allFields[clayField];
          
          // Special handling for posted_on date field
          if (clayField === 'posted_on' && typeof fieldValue === 'string') {
            const parsedDate = parseDate(fieldValue);
            if (parsedDate) {
              structuredData[dbColumn] = parsedDate;
            } else {
              // If date parsing fails, store in JSONB instead
              jsonbData[clayField] = fieldValue;
            }
          }
          // Special handling for URL fields
          else if (['company_website', 'job_listing_url', 'contact_linkedin'].includes(clayField) && typeof fieldValue === 'string') {
            if (isValidUrl(fieldValue)) {
              structuredData[dbColumn] = fieldValue;
            } else {
              console.warn(`Invalid URL for ${clayField}: ${fieldValue}, storing in JSONB`);
              jsonbData[clayField] = fieldValue;
            }
          }
          // Regular text fields
          else {
            structuredData[dbColumn] = fieldValue;
          }
        }
      }
      
      // Store remaining fields in JSONB (no duplication)
      for (const [key, value] of Object.entries(allFields)) {
        if (!CLAY_FIELD_MAPPING.hasOwnProperty(key) && !RESERVED_FIELDS.includes(key)) {
          jsonbData[key] = value;
        }
      }
    } else {
      // For non-job events, keep current behavior (everything in JSONB)
      console.log(`Processing ${mappedType} event - storing all data in JSONB`);
      for (const [key, value] of Object.entries(allFields)) {
        if (!RESERVED_FIELDS.includes(key)) {
          jsonbData[key] = value;
        }
      }
    }
    
    console.log('Structured fields:', Object.keys(structuredData));
    console.log('JSONB fields:', Object.keys(jsonbData));

    // Lookup contact by HubSpot record ID (primary method) or email (fallback)
    let contactId: string | null = null;
    let contactLookupMethod: string | null = null;
    let contactData: any = null;
    
    // Primary: Lookup by contact_record_id (HubSpot record ID)
    if (body.contact_record_id && typeof body.contact_record_id === 'string') {
      try {
        console.log(`Looking up contact by HubSpot record ID: ${body.contact_record_id}`);
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, engagement_score')
          .eq('hubspot_id', body.contact_record_id.trim())
          .eq('organization_id', organizationId)
          .single();
        
        if (contactError) {
          if (contactError.code === 'PGRST116') {
            // No contact found with this HubSpot record ID - this is an invalid state
            console.warn(`No contact found with HubSpot record ID: ${body.contact_record_id}`);
            webhookLog.response_status = 400;
            webhookLog.error = `Invalid state: No contact found with HubSpot record ID: ${body.contact_record_id}`;
            await logWebhook(webhookLog);
            return new Response(
              JSON.stringify({ 
                error: 'Contact correlation failed',
                details: `No contact found with HubSpot record ID: ${body.contact_record_id}`,
                hint: 'Ensure HubSpot sync has been run and contact exists in database'
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          } else {
            console.warn('Contact lookup by HubSpot record ID error:', contactError);
          }
        } else {
          contactId = contact?.id || null;
          contactData = contact;
          contactLookupMethod = 'hubspot_id';
          console.log(`Contact found via HubSpot record ID: ${contactId}, engagement score: ${contact?.engagement_score}`);
        }
      } catch (contactLookupError) {
        console.warn('Contact lookup by HubSpot record ID failed:', contactLookupError);
      }
    }
    
    // Fallback: Lookup by email if HubSpot record ID lookup failed
    if (!contactId && email && typeof email === 'string') {
      try {
        console.log(`Fallback: Looking up contact by email: ${email}`);
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id, engagement_score')
          .eq('email', email.toLowerCase().trim())
          .eq('organization_id', organizationId)
          .single();
        
        if (contactError && contactError.code !== 'PGRST116') {
          // PGRST116 is "not found", which is ok
          console.warn('Contact lookup by email error:', contactError);
        }
        
        contactId = contact?.id || null;
        if (contactId) {
          contactData = contact;
          contactLookupMethod = 'email';
          console.log(`Contact found via email fallback: ${contactId}, engagement score: ${contact?.engagement_score}`);
        }
      } catch (contactLookupError) {
        console.warn('Contact lookup by email failed:', contactLookupError);
        // Continue without linking contact
      }
    }

    // Prepare event data with both structured fields and JSONB
    const eventData = {
      type: mappedType,  // Use the mapped type here
      contact_id: contactId,
      // Contact correlation handled via contact_id lookup using hubspot_id
      organization_id: organizationId,
      data: Object.keys(jsonbData).length > 0 ? jsonbData : null, // Only store JSONB if there's data
      // Add all structured fields dynamically
      ...structuredData,
      // Add new Clay fields to dedicated columns
      job_title: body.job_title || null,
      company_headcount: body.company_headcount ? parseInt(body.company_headcount) : null,
      alert_creation_date: body.alert_creation_date ? parseDate(body.alert_creation_date) : null
    };
    
    console.log('Inserting event with data:', {
      type: eventData.type,
      contact_id: eventData.contact_id,
      structured_fields: Object.keys(structuredData),
      jsonb_fields: Object.keys(jsonbData),
      has_jsonb_data: eventData.data !== null
    });

    // Insert event record with enhanced data structure
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select('id')
      .single();

    if (eventError) {
      webhookLog.response_status = 500;
      webhookLog.error = `Database error: ${eventError.message}`;
      await logWebhook(webhookLog);
      return new Response(
        JSON.stringify({ error: 'Failed to save event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate activity from event (Phase 5: Automatic Activity Creation)
    let activityCreated = false;
    let activityError = null;
    
    try {
      if (event?.id && contactData?.id && contactData?.engagement_score !== undefined) {
        const activityId = await generateActivityFromEvent(
          supabase,
          { ...eventData, id: event.id },
          contactData.id,
          eventData.organization_id,
          contactData.engagement_score
        );
        
        if (activityId) {
          activityCreated = true;
          console.log(`Activity created: ${activityId} for event: ${event.id}`);
        }
      }
    } catch (error) {
      activityError = error instanceof Error ? error.message : 'Unknown activity creation error';
      console.error('Activity creation failed:', activityError);
      // Don't fail the webhook for activity creation errors - log and continue
    }

    // Enhanced success response with contact correlation details
    const responseBody = {
      success: true,
      event_id: event.id,
      contact_linked: !!contactId,
      contact_correlation: {
        method: contactLookupMethod,
        hubspot_id: body.contact_record_id || null,
        contact_id: contactId
      },
      activity_creation: {
        attempted: !!contactData?.id,
        success: activityCreated,
        error: activityError,
        engagement_score: contactData?.engagement_score || null
      },
      fields_processed: {
        structured_fields: Object.keys(structuredData),
        jsonb_fields: Object.keys(jsonbData),
        new_clay_fields: ['job_title', 'company_headcount', 'alert_creation_date'].filter(field => body[field]),
        filtered_fields: RESERVED_FIELDS.filter(field => field in body)
      },
      event_type_mapped: body.type !== mappedType ? `${body.type} → ${mappedType}` : null,
      data_processing: {
        total_fields: Object.keys(allFields).length,
        structured_count: Object.keys(structuredData).length + 3, // +3 for new Clay fields
        jsonb_count: Object.keys(jsonbData).length,
        reserved_filtered: RESERVED_FIELDS.filter(field => field in body).length
      }
    };

    webhookLog.event_id = event.id;
    webhookLog.response_status = 200;
    webhookLog.response_body = responseBody;
    webhookLog.processing_time_ms = Date.now() - startTime;
    
    await logWebhook(webhookLog);

    return new Response(
      JSON.stringify(responseBody),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    webhookLog.response_status = 500;
    webhookLog.error = `Unexpected error: ${error.message}`;
    webhookLog.processing_time_ms = Date.now() - startTime;
    
    await logWebhook(webhookLog);
    
    console.error('Webhook processing error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function logWebhook(log: WebhookLog): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Cannot log webhook: Supabase configuration missing');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('webhook_logs')
      .insert(log);
    
    if (error) {
      console.error('Failed to log webhook:', error);
    }
  } catch (logError) {
    console.error('Webhook logging error:', logError);
  }
}