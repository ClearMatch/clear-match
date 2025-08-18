# Clay Webhook Testing Guide

This document provides curl commands and examples for testing the Clay webhook integration.

## Environment Setup

Before testing, ensure these environment variables are set in your Supabase Edge Function:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CLAY_WEBHOOK_API_KEY=your_generated_api_key
CLAY_ORGANIZATION_ID=your_organization_uuid
```

## Test Cases

### 1. Valid Job Posting Event

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "type": "job-group-posting",
    "email": "recruiter@company.com",
    "company": "Acme Corp",
    "job_title": "Senior Software Engineer",
    "location": "Remote",
    "posting_url": "https://jobs.company.com/123",
    "salary_min": 120000,
    "salary_max": 180000,
    "discovered_date": "2024-08-18T10:30:00Z",
    "source": "clay-automation"
  }'
```

Expected Response:
```json
{
  "success": true,
  "event_id": "uuid-here",
  "contact_linked": true,
  "filtered_fields": []
}
```

### 2. Event Without Email (No Contact Linking)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "type": "funding-event",
    "company": "StartupCorp",
    "funding_round": "Series A",
    "amount": 15000000,
    "lead_investor": "VC Partners",
    "announcement_date": "2024-08-18"
  }'
```

Expected Response:
```json
{
  "success": true,
  "event_id": "uuid-here",
  "contact_linked": false,
  "filtered_fields": []
}
```

### 3. Event With Reserved Fields (Should Be Filtered)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "type": "layoff",
    "company": "TechCorp",
    "employees_affected": 500,
    "id": "should-be-filtered",
    "organization_id": "should-be-filtered",
    "created_at": "should-be-filtered",
    "contact_id": "should-be-filtered"
  }'
```

Expected Response:
```json
{
  "success": true,
  "event_id": "uuid-here",
  "contact_linked": false,
  "filtered_fields": ["id", "organization_id", "created_at", "contact_id"]
}
```

### 4. Invalid Event Type (Should Fail)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "type": "invalid-type",
    "data": "some data"
  }'
```

Expected Response (400):
```json
{
  "error": "Invalid event type: invalid-type",
  "allowed_types": ["none", "job-group-posting", "layoff", "birthday", "funding-event", "new-job"]
}
```

### 5. Missing Type Field (Should Fail)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{
    "company": "TestCorp",
    "data": "missing type field"
  }'
```

Expected Response (400):
```json
{
  "error": "Missing required field: type",
  "allowed_types": ["none", "job-group-posting", "layoff", "birthday", "funding-event", "new-job"]
}
```

### 6. Invalid API Key (Should Fail)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: wrong-key" \
  -d '{
    "type": "none",
    "test": "unauthorized"
  }'
```

Expected Response (401):
```json
{
  "error": "Unauthorized"
}
```

### 7. Invalid JSON (Should Fail)

```bash
curl -X POST https://your-project.supabase.co/functions/v1/clay-webhook \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key_here" \
  -d '{"type": "none", invalid json'
```

Expected Response (400):
```json
{
  "error": "Invalid JSON payload"
}
```

## Monitoring

### Check Webhook Logs

Query the `webhook_logs` table to see all requests:

```sql
SELECT 
  created_at,
  method,
  response_status,
  processing_time_ms,
  error,
  event_id IS NOT NULL as event_created
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### Check Created Events

Query the `events` table to see Clay events:

```sql
SELECT 
  id,
  type,
  contact_id IS NOT NULL as has_contact,
  data,
  created_at
FROM events 
WHERE data IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 10;
```

### Event Type Distribution

```sql
SELECT 
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN contact_id IS NOT NULL THEN 1 END) as with_contact
FROM events 
WHERE data IS NOT NULL 
GROUP BY type 
ORDER BY count DESC;
```

## Notes

- All successful requests should return 200 status
- Contact linking depends on finding an existing contact with matching email
- Reserved database fields are automatically filtered from the data JSONB
- All requests are logged to `webhook_logs` for debugging
- Processing time is tracked for performance monitoring