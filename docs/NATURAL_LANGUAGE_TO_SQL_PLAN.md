# Natural Language to SQL Implementation Plan (Phase 2)

## Overview

This document outlines the implementation plan for Phase 2 of the Clear Match AI Chat system: converting natural language queries into SQL queries against the Clear Match database.

**Goal**: Enable users to query their recruitment data using natural language questions like "Show me all active candidates" or "What are my activities from last week?"

## Current Database Schema Analysis

Based on the current Supabase schema, we have the following core tables available for querying:

### Core Data Tables
```sql
-- Primary entities
contacts (candidates/clients with comprehensive recruitment data)
activities (tasks, meetings, interactions)
events (job postings, layoffs, birthdays, funding events)
job_postings (specific job opportunities)
tags (categorization system)
organizations (company data isolation)
profiles (user management)

-- Relationship tables
contact_tags (many-to-many contact-tag relationships)

-- System tables
webhook_logs (Clay.com integration logs)
templates (communication templates)
```

### Key Relationships
- **contacts** ↔ **activities** (via contact_id)
- **contacts** ↔ **tags** (via contact_tags junction table)
- **activities** ↔ **job_postings** (via job_posting_id)
- **activities** ↔ **events** (via event_id)
- **events** → **contacts** (via contact_id)
- All tables → **organizations** (RLS isolation via organization_id)

### Clay Webhook Integration
The system already has Clay.com webhook integration storing job posting data in the `events` table with `type='job-group-posting'`. This provides rich data for queries about:
- Job postings by company, role, location
- Contact connections to job opportunities
- Market activity and trends

## Implementation Approach

Based on research of Vanna AI and industry best practices, we'll implement a **hybrid approach** combining:

1. **Schema Context System**: Automated schema introspection for LLM context
2. **Query Template Library**: Pre-defined SQL patterns for common queries
3. **Security Validation Layer**: Multi-layer SQL validation and RLS enforcement
4. **Intelligent Query Planning**: Multi-step query decomposition for complex requests

### Why This Approach?

- **Security First**: Multiple validation layers protect against SQL injection
- **Accuracy**: Schema context + templates achieve ~80% accuracy vs ~3% without context
- **Performance**: Template-based approach is faster than pure LLM generation
- **Maintainability**: Pure TypeScript/JavaScript solution fits existing stack

## Technical Architecture

### 1. Query Processing Pipeline

```typescript
// High-level flow
NaturalLanguageQuery → QueryAnalyzer → SQLGenerator → SecurityValidator → DatabaseExecutor → ResultFormatter
```

### 2. Core Components

#### A. Query Analyzer (`src/lib/sql/QueryAnalyzer.ts`)
**Purpose**: Classify and understand user intent

```typescript
interface QueryAnalysis {
  intent: 'select' | 'count' | 'aggregate' | 'filter' | 'complex';
  entities: string[]; // ['contacts', 'activities', 'tags']
  timeframe?: DateRange;
  filters?: QueryFilter[];
  aggregation?: 'sum' | 'count' | 'avg' | 'max' | 'min';
}

class QueryAnalyzer {
  async analyzeQuery(question: string): Promise<QueryAnalysis>
  async extractEntities(question: string): Promise<string[]>
  async detectTimeframe(question: string): Promise<DateRange | null>
}
```

#### B. Schema Context Manager (`src/lib/sql/SchemaContext.ts`)
**Purpose**: Provide LLM with database schema knowledge

```typescript
interface TableSchema {
  name: string;
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
  indexes: string[];
  policies: RLSPolicy[];
}

class SchemaContext {
  async getSchemaForTables(tables: string[]): Promise<TableSchema[]>
  async generateSchemaPrompt(analysis: QueryAnalysis): Promise<string>
  async getRelevantExamples(intent: string): Promise<SQLExample[]>
}
```

#### C. SQL Generator (`src/lib/sql/SQLGenerator.ts`)
**Purpose**: Convert natural language to SQL using LLM with rich context

```typescript
class SQLGenerator {
  async generateSQL(
    question: string, 
    analysis: QueryAnalysis, 
    schema: TableSchema[]
  ): Promise<GeneratedSQL>
  
  async validateAndRefine(sql: string): Promise<string>
  async addRLSContext(sql: string, userId: string): Promise<string>
}
```

#### D. Security Validator (`src/lib/sql/SecurityValidator.ts`)
**Purpose**: Multi-layer security validation

```typescript
class SecurityValidator {
  async validateSQL(sql: string): Promise<ValidationResult>
  async checkWhitelist(sql: string): Promise<boolean>
  async ensureRLSCompliance(sql: string): Promise<boolean>
  async detectSQLInjection(sql: string): Promise<boolean>
}
```

#### E. Database Executor (`src/lib/sql/DatabaseExecutor.ts`)
**Purpose**: Safely execute validated queries

```typescript
class DatabaseExecutor {
  async executeQuery(sql: string, params: any[]): Promise<QueryResult>
  async executeWithTimeout(sql: string, timeout: number): Promise<QueryResult>
  async logQuery(sql: string, result: QueryResult, userId: string): Promise<void>
}
```

### 3. Security Layers

#### Layer 1: Input Sanitization
- Query length limits (max 500 characters)
- Character whitelist (alphanumeric + basic punctuation)
- Rate limiting per user

#### Layer 2: SQL Parsing & Validation
```typescript
import { parse } from 'node-sql-parser';

const whitelistedTables = [
  'contacts', 'activities', 'events', 'job_postings', 
  'tags', 'contact_tags', 'profiles'
];

const whitelistedOperations = ['SELECT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN'];

async function validateSQL(sql: string): Promise<ValidationResult> {
  try {
    const ast = parse(sql);
    
    // Validate only SELECT operations
    if (ast.type !== 'select') {
      throw new Error('Only SELECT queries allowed');
    }
    
    // Validate table access
    const tables = extractTablesFromAST(ast);
    const unauthorizedTables = tables.filter(t => !whitelistedTables.includes(t));
    
    if (unauthorizedTables.length > 0) {
      throw new Error(`Unauthorized table access: ${unauthorizedTables.join(', ')}`);
    }
    
    return { valid: true, sql };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

#### Layer 3: RLS Enforcement
```typescript
async function enforceRLS(sql: string, userId: string): Promise<string> {
  const userOrgId = await getUserOrganizationId(userId);
  
  // Automatically inject organization_id filters
  const modifiedSQL = sql.replace(
    /FROM\s+(\w+)/gi,
    `FROM $1 WHERE $1.organization_id = '${userOrgId}'`
  );
  
  return modifiedSQL;
}
```

#### Layer 4: Query Execution Limits
- Query timeout: 30 seconds maximum
- Result set limit: 1000 rows maximum
- Memory usage monitoring
- Query complexity analysis

## Query Template Library

### Common Query Patterns

```typescript
const queryTemplates = {
  // Contact queries
  'list_contacts': {
    pattern: /(?:show|list|find|get).*contacts?/i,
    sql: `
      SELECT id, first_name, last_name, personal_email, work_email, 
             current_job_title, current_company, engagement_score
      FROM contacts 
      WHERE organization_id = $1
      ORDER BY updated_at DESC
      LIMIT 100
    `
  },
  
  // Activity queries  
  'recent_activities': {
    pattern: /(?:recent|latest|last).*activities?/i,
    sql: `
      SELECT a.*, c.first_name, c.last_name 
      FROM activities a
      LEFT JOIN contacts c ON a.contact_id = c.id
      WHERE a.organization_id = $1 
        AND a.created_at >= NOW() - INTERVAL '7 days'
      ORDER BY a.created_at DESC
      LIMIT 50
    `
  },
  
  // Job posting queries
  'job_postings_by_company': {
    pattern: /job.*post.*(?:at|from|by)\s+(.+)/i,
    sql: `
      SELECT e.data->>'position' as position,
             e.data->>'company_name' as company_name,
             e.data->>'posted_on' as posted_date,
             e.data->>'metro_area' as locations
      FROM events e
      WHERE e.type = 'job-group-posting' 
        AND e.organization_id = $1
        AND e.data->>'company_name' ILIKE '%' || $2 || '%'
      ORDER BY (e.data->>'posted_on')::timestamp DESC
      LIMIT 20
    `
  },
  
  // Count queries
  'count_contacts': {
    pattern: /how many contacts?/i,
    sql: `
      SELECT COUNT(*) as total_contacts
      FROM contacts 
      WHERE organization_id = $1
    `
  }
};
```

### Template Matching System
```typescript
class TemplateResolver {
  async findMatchingTemplate(question: string): Promise<QueryTemplate | null> {
    for (const [key, template] of Object.entries(queryTemplates)) {
      if (template.pattern.test(question)) {
        return { key, ...template };
      }
    }
    return null;
  }
  
  async extractParameters(question: string, template: QueryTemplate): Promise<any[]> {
    const matches = question.match(template.pattern);
    return matches ? matches.slice(1) : [];
  }
}
```

## LLM Integration Strategy

### Context-Aware SQL Generation

```typescript
async function generateSQLWithContext(question: string, userId: string): Promise<string> {
  const analysis = await analyzeQuery(question);
  const schema = await getRelevantSchema(analysis.entities);
  const examples = await getQueryExamples(analysis.intent);
  
  const prompt = `
You are a SQL expert for a recruitment management system. Generate a PostgreSQL query for this question.

IMPORTANT RULES:
- Only SELECT statements allowed
- Always include organization_id filter
- Use parameterized queries ($1, $2, etc.)
- Limit results to 100 rows unless specified
- Use proper JOINs for related data

AVAILABLE TABLES:
${schema.map(table => generateTableDescription(table)).join('\n')}

EXAMPLE QUERIES:
${examples.map(ex => `Q: ${ex.question}\nSQL: ${ex.sql}`).join('\n\n')}

QUESTION: ${question}

Return only the SQL query, no explanations.
  `;
  
  const response = await callLLM(prompt);
  return response.trim();
}
```

### Schema Description Generator
```typescript
function generateTableDescription(table: TableSchema): string {
  return `
${table.name}:
  Columns: ${table.columns.map(col => `${col.name} (${col.type})`).join(', ')}
  Key Relationships: ${table.relationships.map(rel => 
    `${rel.foreignTable} via ${rel.foreignKey}`
  ).join(', ')}
  `;
}
```

## API Integration

### Enhanced Chat API Route (`src/app/api/chat/route.ts`)

```typescript
// Add SQL query capability to existing chat route
export async function POST(request: Request) {
  const { message, enableSQL = false } = await request.json();
  
  // Existing authentication and rate limiting...
  
  if (enableSQL && detectSQLQuery(message)) {
    try {
      const sqlResult = await processSQLQuery(message, user.id);
      
      const enhancedPrompt = `
        User asked: ${message}
        
        I found this data in our system:
        ${formatSQLResults(sqlResult)}
        
        Please provide insights and answer their question based on this data.
      `;
      
      // Continue with existing LLM processing...
      
    } catch (error) {
      console.error('SQL processing error:', error);
      // Fall back to regular chat without SQL data
    }
  }
  
  // Regular chat processing continues...
}
```

### SQL Query Processing Function
```typescript
async function processSQLQuery(question: string, userId: string): Promise<QueryResult> {
  // 1. Try template matching first (fastest)
  const template = await templateResolver.findMatchingTemplate(question);
  if (template) {
    const params = await templateResolver.extractParameters(question, template);
    return await executeTemplateQuery(template, [userId, ...params]);
  }
  
  // 2. Fall back to LLM generation
  const sql = await generateSQLWithContext(question, userId);
  
  // 3. Validate and secure
  const validation = await securityValidator.validateSQL(sql);
  if (!validation.valid) {
    throw new Error(`Query validation failed: ${validation.error}`);
  }
  
  // 4. Execute safely
  const result = await databaseExecutor.executeQuery(validation.sql, [userId]);
  
  // 5. Log for monitoring
  await logQuery(sql, result, userId);
  
  return result;
}
```

## Example User Queries & Expected SQL

### Contact Management Queries

**Q**: "Show me all active candidates"
**Generated SQL**:
```sql
SELECT id, first_name, last_name, personal_email, current_job_title, 
       current_company, engagement_score
FROM contacts 
WHERE organization_id = $1 
  AND contact_type IN ('candidate', 'both')
  AND is_active_looking = true
ORDER BY engagement_score DESC, updated_at DESC
LIMIT 100;
```

**Q**: "Find contacts with Python experience"
**Generated SQL**:
```sql
SELECT id, first_name, last_name, personal_email, current_job_title,
       current_company, tech_stack
FROM contacts 
WHERE organization_id = $1 
  AND 'Python' = ANY(tech_stack)
ORDER BY engagement_score DESC
LIMIT 100;
```

### Activity Analysis Queries

**Q**: "What are my activities from last week?"
**Generated SQL**:
```sql
SELECT a.type, a.description, a.created_at, a.status,
       c.first_name, c.last_name, c.current_company
FROM activities a
LEFT JOIN contacts c ON a.contact_id = c.id
WHERE a.organization_id = $1
  AND a.created_at >= NOW() - INTERVAL '7 days'
  AND a.created_by = (SELECT id FROM profiles WHERE id = $2)
ORDER BY a.created_at DESC
LIMIT 100;
```

**Q**: "How many interviews did we conduct this month?"
**Generated SQL**:
```sql
SELECT COUNT(*) as interview_count,
       COUNT(DISTINCT contact_id) as unique_candidates
FROM activities 
WHERE organization_id = $1
  AND type = 'interview'
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  AND status = 'done';
```

### Job Market Analysis

**Q**: "Show me recent job postings from tech companies"
**Generated SQL**:
```sql
SELECT e.data->>'position' as position,
       e.data->>'company_name' as company_name,
       e.data->>'posted_on' as posted_date,
       e.data->>'metro_area' as locations,
       e.data->>'job_listing_url' as job_url
FROM events e
WHERE e.type = 'job-group-posting' 
  AND e.organization_id = $1
  AND e.created_at >= NOW() - INTERVAL '30 days'
  AND (e.data->>'company_name' ILIKE '%tech%' 
       OR e.data->>'position' ILIKE '%engineer%'
       OR e.data->>'position' ILIKE '%developer%')
ORDER BY (e.data->>'posted_on')::timestamp DESC
LIMIT 50;
```

## Implementation Phases

### Phase 2.1: Foundation (Week 1)
**Deliverables**:
- [ ] Core SQL processing pipeline
- [ ] Security validation system  
- [ ] Schema context generation
- [ ] Basic query templates (10 common patterns)

**Files to Create**:
```
src/lib/sql/
├── types.ts              # TypeScript interfaces
├── QueryAnalyzer.ts      # Intent classification
├── SchemaContext.ts      # Database schema introspection
├── SecurityValidator.ts  # Multi-layer validation
├── DatabaseExecutor.ts   # Safe query execution
├── TemplateResolver.ts   # Pattern matching for common queries
└── index.ts             # Public API exports
```

### Phase 2.2: LLM Integration (Week 2)  
**Deliverables**:
- [ ] LLM-based SQL generation with schema context
- [ ] Template fallback system
- [ ] Query result formatting
- [ ] Error handling and recovery

**Files to Modify**:
```
src/app/api/chat/route.ts  # Add SQL processing capability
src/components/ChatInterface.tsx  # Handle SQL result display
```

### Phase 2.3: Advanced Features (Week 3)
**Deliverables**:
- [ ] Multi-step query planning for complex questions
- [ ] Query result visualization (charts, tables)
- [ ] Query history and optimization
- [ ] Performance monitoring

### Phase 2.4: Testing & Polish (Week 4)
**Deliverables**:
- [ ] Comprehensive test suite (unit + integration)
- [ ] Performance benchmarking
- [ ] Security audit
- [ ] Documentation and user guide

## Success Metrics

### Technical Metrics
- **Query Accuracy**: >85% for template queries, >70% for LLM-generated queries
- **Response Time**: <3 seconds average for simple queries, <10 seconds for complex
- **Security**: 0 successful SQL injection attempts
- **Uptime**: >99% availability

### User Experience Metrics  
- **Query Success Rate**: >80% of queries return meaningful results
- **User Satisfaction**: >4.0/5.0 rating for SQL query feature
- **Adoption Rate**: >60% of active users try SQL querying within first month

### Business Impact Metrics
- **Time Savings**: Average 5 minutes saved per data query vs manual dashboard navigation
- **Insight Discovery**: 25% increase in data-driven recruitment decisions
- **Feature Usage**: SQL queries represent >30% of total chat interactions

## Risk Mitigation

### Technical Risks
**Risk**: SQL injection attacks
**Mitigation**: Multi-layer validation, parameterized queries, strict whitelisting

**Risk**: Poor query performance affecting system
**Mitigation**: Query timeout limits, complexity analysis, result set limits

**Risk**: LLM generating incorrect SQL
**Mitigation**: Template-first approach, validation layers, user feedback loops

### Business Risks  
**Risk**: Users frustrated by incorrect results
**Mitigation**: Clear error messages, example queries, progressive enhancement

**Risk**: Over-reliance on AI reducing SQL skills
**Mitigation**: Show generated SQL to users, educational hints, query explanations

## Monitoring & Analytics

### Query Performance Dashboard
- Average response times by query type
- Most common query patterns
- Error rates and types
- User satisfaction scores

### Security Monitoring
- Failed validation attempts
- Unusual query patterns
- Rate limiting triggers
- Performance anomalies

### Usage Analytics
- Most popular query types
- User engagement with SQL features
- Conversion from chat to SQL queries
- Feature adoption over time

## Future Enhancements (Phase 3+)

### Advanced Query Features
- **Natural Language Joins**: "Show me contacts and their recent activities"
- **Temporal Queries**: "Compare this month's activities to last month"
- **Aggregate Insights**: "What's the average engagement score by industry?"

### Visualization Integration
- **Auto-Charts**: Generate charts for numerical query results
- **Export Options**: CSV, Excel, PDF report generation
- **Dashboard Creation**: Save successful queries as dashboard widgets

### Machine Learning Integration
- **Query Suggestion Engine**: Recommend relevant queries based on user context
- **Anomaly Detection**: Highlight unusual patterns in query results
- **Predictive Analytics**: "Based on current trends, predict next quarter's metrics"

---

**Next Steps**: 
1. Get approval for this implementation plan
2. Set up development environment with required dependencies
3. Begin Phase 2.1 implementation starting with core SQL processing pipeline
4. Create first PR with foundation components for review

**Estimated Timeline**: 4 weeks for complete Phase 2 implementation
**Resource Requirements**: 1 full-time developer
**Dependencies**: Existing chat system (Phase 1), Supabase database, OpenRouter API access