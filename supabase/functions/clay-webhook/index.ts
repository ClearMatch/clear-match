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
  'job-group-posting',
  'layoff',
  'birthday',
  'funding-event',
  'new-job'
];

// Map Clay event types to our database types
const EVENT_TYPE_MAPPING: Record<string, string> = {
  'job-posting': 'job-group-posting',  // Clay sends 'job-posting', we store 'job-group-posting'
};

// Reserved database column names to filter from data JSONB
const RESERVED_FIELDS = [
  'id',
  'contact_id', 
  'organization_id',
  'created_at',
  'updated_at',
  'created_by',
  'type'
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

    // Extract fields and filter reserved ones (use mapped type)
    const { type, email, ...allFields } = body;
    const cleanData: Record<string, any> = {};
    
    // Filter out reserved database column names
    for (const [key, value] of Object.entries(allFields)) {
      if (!RESERVED_FIELDS.includes(key)) {
        cleanData[key] = value;
      }
    }

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

    // Insert event record (use mapped type)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        type: mappedType,  // Use the mapped type here
        contact_id: contactId,
        organization_id: organizationId,
        data: cleanData
      })
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

    // Success response
    const responseBody = {
      success: true,
      event_id: event.id,
      contact_linked: !!contactId,
      filtered_fields: RESERVED_FIELDS.filter(field => field in body)
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