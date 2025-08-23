# Clay.com Integration

This document describes how to configure Clay.com to send webhook data to Clear Match.

## Overview

Clear Match receives event data from Clay workflows via a secure webhook endpoint. Events are stored in the `events` table with flexible JSONB data storage.

## Webhook Endpoint

- **URL**: `https://your-project.supabase.co/functions/v1/clay-webhook`
- **Method**: POST
- **Authentication**: API key via `x-api-key` header
- **Content-Type**: `application/json`

## Configuration in Clay

### 1. Add HTTP API Action

In your Clay workflow:
1. Click "Add Step" or "+" button
2. Search for "HTTP API" and select it
3. Configure the following settings:

### 2. HTTP API Settings

- **Method**: POST
- **URL**: `https://your-project.supabase.co/functions/v1/clay-webhook`
- **Headers**:
  ```
  Content-Type: application/json
  x-api-key: your_generated_api_key_here
  ```

### 3. Request Body

The body must be valid JSON with a required `type` field. Example:

```json
{
  "type": "job-group-posting",
  "email": "{{record.email}}",
  "company": "{{record.company}}",
  "job_title": "{{record.job_title}}",
  "location": "{{record.location}}",
  "posting_url": "{{record.url}}",
  "salary_range": "{{record.salary}}",
  "discovered_date": "{{current_timestamp}}",
  "source": "clay-automation"
}
```

## Required Fields

### `type` (required)
Must be one of these exact values:
- `none`
- `job-group-posting`
- `layoff`
- `birthday`
- `funding-event`
- `new-job`

### `email` (optional)
If provided, Clear Match will attempt to link the event to an existing contact by email address.

## Data Handling

### Field Filtering
These reserved database field names are automatically filtered out before storage:
- `id`
- `contact_id`
- `organization_id`
- `created_at`
- `updated_at`
- `created_by`
- `type` (extracted separately)

### Data Storage
- All other fields are stored in the `data` JSONB column
- Supports nested objects and arrays
- No schema restrictions on the data content

## Example Clay Workflows

### Job Posting Discovery
```json
{
  "type": "job-group-posting",
  "email": "{{contact.email}}",
  "company": "{{company.name}}",
  "job_title": "{{job.title}}",
  "department": "{{job.department}}",
  "location": "{{job.location}}",
  "posting_url": "{{job.url}}",
  "posting_date": "{{job.posted_date}}",
  "salary_min": "{{job.salary_min}}",
  "salary_max": "{{job.salary_max}}",
  "requirements": "{{job.requirements}}",
  "discovered_via": "clay-job-board-scraping"
}
```

### Company Funding Event
```json
{
  "type": "funding-event",
  "company": "{{company.name}}",
  "company_domain": "{{company.domain}}",
  "funding_round": "{{funding.round}}",
  "amount_usd": "{{funding.amount}}",
  "lead_investor": "{{funding.lead}}",
  "announcement_date": "{{funding.date}}",
  "news_source": "{{news.source}}",
  "news_url": "{{news.url}}"
}
```

### Employee Layoff News
```json
{
  "type": "layoff",
  "company": "{{company.name}}",
  "employees_affected": "{{layoff.count}}",
  "percentage_workforce": "{{layoff.percentage}}",
  "announcement_date": "{{layoff.date}}",
  "reason": "{{layoff.reason}}",
  "news_source": "{{news.source}}",
  "news_url": "{{news.url}}",
  "departments_affected": "{{layoff.departments}}"
}
```

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "event_id": "550e8400-e29b-41d4-a716-446655440000",
  "contact_linked": true,
  "filtered_fields": ["id", "created_at"]
}
```

### Error Response (400/401/500)
```json
{
  "error": "Invalid event type: custom-type",
  "allowed_types": ["none", "job-group-posting", "layoff", "birthday", "funding-event", "new-job"]
}
```

## Environment Variables

The following environment variables must be configured in Supabase:

```bash
CLAY_WEBHOOK_API_KEY=your_secure_api_key
CLAY_ORGANIZATION_ID=your_organization_uuid
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Monitoring

### Webhook Logs
All requests are logged in the `webhook_logs` table with:
- Request headers and payload
- Response status and body
- Processing time
- Error details (if any)
- Associated event ID (if created)

### Event Data
Events appear in the existing events UI with:
- Event type
- Associated contact (if email matched)
- Full Clay data in the data field
- Standard timestamps and organization

## Troubleshooting

### Common Issues

1. **401 Unauthorized**
   - Check API key is correct
   - Verify `x-api-key` header is set

2. **400 Invalid Type**
   - Ensure `type` field uses exact allowed values
   - Check for typos in event type

3. **400 Missing Type**
   - Verify `type` field is included in JSON body
   - Check JSON syntax is valid

4. **Contact Not Linked**
   - Email may not match existing contact
   - Email comparison is case-insensitive
   - Contact must exist in same organization

### Testing

Use the provided test commands in `test-clay-webhook.md` to validate the integration before configuring Clay workflows.

## Security

- API key authentication required
- HTTPS-only endpoint
- Input validation on all fields
- Organization isolation enforced
- Comprehensive request logging
- No sensitive data exposure in error messages