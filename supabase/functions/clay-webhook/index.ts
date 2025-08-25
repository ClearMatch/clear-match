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

// Map Clay payload fields to database columns
const CLAY_FIELD_MAPPING: Record<string, string> = {
  'position': 'position',
  'posted_on': 'posted_on',
  'metro_area': 'metro_area',
  'company_name': 'company_name',
  'contact_name': 'contact_name',
  'company_website': 'company_website',
  'job_listing_url': 'job_listing_url',
  'company_location': 'company_location',
  'contact_linkedin': 'contact_linkedin',
};

// Reserved database column names to filter from data JSONB
const RESERVED_FIELDS = [
  'id',
  'contact_id', 
  'organization_id',
  'created_at',
  'updated_at',
  'created_by',
  'type',
  'email' // Add email to reserved fields since it's used for contact lookup
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

    // Lookup contact by email if provided
    let contactId: string | null = null;
    if (email && typeof email === 'string') {
      try {
        const { data: contact, error: contactError } = await supabase
          .from('contacts')
          .select('id')
          .eq('email', email.toLowerCase().trim())
          .eq('organization_id', organizationId)
          .single();
        
        if (contactError && contactError.code !== 'PGRST116') {
          // PGRST116 is "not found", which is ok
          console.warn('Contact lookup error:', contactError);
        }
        
        contactId = contact?.id || null;
      } catch (contactLookupError) {
        console.warn('Contact lookup failed:', contactLookupError);
        // Continue without linking contact
      }
    }

    // Prepare event data with both structured fields and JSONB
    const eventData = {
      type: mappedType,  // Use the mapped type here
      contact_id: contactId,
      organization_id: organizationId,
      data: Object.keys(jsonbData).length > 0 ? jsonbData : null, // Only store JSONB if there's data
      // Add all structured fields dynamically
      ...structuredData
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

    // Enhanced success response with processing details
    const responseBody = {
      success: true,
      event_id: event.id,
      contact_linked: !!contactId,
      contact_strategy: contactId ? 'email' : null,
      structured_fields_processed: Object.keys(structuredData),
      jsonb_fields_stored: Object.keys(jsonbData),
      filtered_fields: RESERVED_FIELDS.filter(field => field in body),
      event_type_mapped: body.type !== mappedType ? `${body.type} → ${mappedType}` : null,
      data_processing: {
        total_fields: Object.keys(allFields).length,
        structured_count: Object.keys(structuredData).length,
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