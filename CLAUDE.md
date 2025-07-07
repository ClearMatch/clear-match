# Clear Match AI Assistant Guidelines

## Table of Contents
1. [Project Overview](#project-overview)
2. [Setup & Prerequisites](#setup--prerequisites)
3. [MCP Servers](#mcp-servers)
4. [Development Workflow](#development-workflow)
5. [Issue Management](#issue-management)
6. [Code Standards & Quality](#code-standards--quality)
7. [Security Guidelines](#security-guidelines)
8. [Common Commands](#common-commands)
9. [Testing Guidelines](#testing-guidelines)
10. [Troubleshooting](#troubleshooting)
11. [Deployment](#deployment)

## Project Overview

**Clear Match** is a comprehensive candidate relationship management platform built for modern recruiting teams. The application helps organizations manage candidates, tasks, and recruitment workflows efficiently.

### Tech Stack
- **Frontend**: Next.js 13.5.1 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Row Level Security (RLS)
- **State Management**: SWR for data fetching
- **Form Management**: React Hook Form with Zod validation
- **UI Components**: Custom components built on Radix UI primitives
- **External Integrations**: HubSpot API integration
- **Development Tools**: ESLint, Prettier, TypeScript

### Key Features
- **Dashboard**: Overview of activities, stats, and recommendations
- **Candidate Management**: Full CRUD operations with advanced filtering
- **Task Management**: Activity tracking and workflow management
- **Profile Management**: User authentication and profile settings
- **HubSpot Integration**: Syncing data with HubSpot CRM
- **Responsive Design**: Mobile-first design approach

## Setup & Prerequisites

### Required Tools
- Node.js 18.17.0 or later 
- npm or yarn
- Supabase CLI
- Git

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Supabase local development: `supabase start`
4. Configure environment variables
5. Run migrations: `supabase db reset`
6. Start development server: `npm run dev`

## MCP Servers

You have access to multiple MCP servers to enhance development efficiency:

### GitHub MCP Server
- **Purpose**: GitHub repository management
- **Usage**: Use `gh` commands for issues, PRs, and repository operations
- **When to use**: Creating issues, managing PRs, checking repository status

### Context7 MCP Server
- **Purpose**: Documentation lookup and code examples
- **Functions**:
  - `mcp__context7__resolve-library-id` - Find correct library identifiers
  - `mcp__context7__get-library-docs` - Fetch documentation and examples
- **When to use**: Understanding libraries, frameworks, APIs, especially React, Next.js, Node.js, Supabase, TypeScript
- **Examples**: 
  - Research Next.js App Router patterns
  - Find React Hook Form validation examples
  - Understand Supabase authentication patterns


## Development Workflow

### Branch Management
- **Main Branch**: `main` (production-ready code)
- **Feature Branches**: Use issue number as branch name (e.g., `84` for issues, `feature-123` for features without issues)
- **Branch Creation**: Always branch from latest `main`

### Workflow Steps

#### For New Branches
1. **Setup**: Pull main branch and create new branch with issue number
2. **Development**: Implement features following code standards
3. **Testing**: Run tests and ensure all pass
4. **Quality Checks**: Run linting and type checking
5. **Commit Locally**: Use descriptive commit messages (local commits only)
6. **Request Approval**: Show completed work and ask "Does this look good?"
7. **Wait for User Confirmation**: Do not proceed without explicit approval
8. **Push & PR**: Only after approval, push commits and create PR
9. **Review**: Address feedback and update as needed
10. **Merge**: Use "Squash and Merge" option

#### For Existing Branches
1. **Update Branch**: Always rebase against main before starting work
   ```bash
   git checkout existing-branch
   git fetch origin
   git rebase origin/main
   # OR use merge if rebase causes conflicts
   git merge origin/main
   ```
2. **Verify Build**: Run `npm run build` to ensure no conflicts
3. **Continue Development**: Follow steps 2-9 above

### Commit Message Format
- Use clear, descriptive commit messages
- Reference issue numbers when applicable
- Examples:
  - `feat: add candidate filtering functionality (#84)`
  - `fix: resolve authentication redirect issue (#85)`
  - `docs: update API documentation (#86)`

## Issue Management

### Issue Creation Process
1. **Break down problems** into sub-problems
2. **Ask clarifying questions** if requirements are unclear
3. **Write comprehensive issues** with clear acceptance criteria
4. **Include test plans** for new functionality
5. **Add documentation requirements**
6. **Add issues to Clear Match AI Development Kanban**

### Issue Working Process
1. **Get approval** before starting work
2. **Update existing branches**: If working on existing branch, always rebase/merge against main first
3. **Communicate progress** regularly
4. **Request review** when implementation is complete
   - Show completed work and ask "Does this look good?"
   - Wait for user approval before proceeding
   - Make any requested changes
5. **Create PR only after approval**
   - Push commits to branch
   - Create pull request with comprehensive description
   - Link to original issue
6. **Address feedback** promptly
7. **Iterate** based on user feedback

### 🚨 Important: Never push commits or create PRs without explicit user approval
Claude should always ask "Does this look good?" and wait for confirmation before:
- Pushing commits to remote repository
- Creating pull requests
- Making any changes that affect the remote repository

### Pull Request Management
1. **Create descriptive PRs** with clear titles and descriptions
2. **Wait for GitHub Actions** to complete
3. **Address code review feedback**
4. **Ensure all checks pass**
5. **Add "Needs Review" label** when ready
6. **Move to "Needs Review" lane** in project board

## Code Standards & Quality

### TypeScript Standards
- **Strict Mode**: Always use TypeScript strict mode
- **Type Definitions**: Define proper types for all props and functions
- **No Any**: Avoid `any` type, use proper typing
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use enums for constants with multiple values

### React/Next.js Standards
- **App Router**: Use Next.js 13+ App Router patterns
- **Server Components**: Prefer Server Components when possible
- **Client Components**: Use 'use client' directive only when necessary
- **Async Components**: Use async/await for Server Components
- **Error Boundaries**: Implement proper error handling

### Component Structure
```typescript
// Example component structure
interface ComponentProps {
  title: string;
  onAction: (data: ActionData) => void;
}

export default function Component({ title, onAction }: ComponentProps) {
  // Component implementation
}
```

### Database Patterns
- **RLS Policies**: Always implement Row Level Security
- **Type Safety**: Use Supabase generated types
- **Error Handling**: Implement proper error handling for database operations
- **Migrations**: Use Supabase migrations for schema changes

### Styling Standards
- **Tailwind CSS**: Use utility-first approach
- **Component Variants**: Use class-variance-authority for component variants
- **Responsive Design**: Mobile-first design approach
- **Accessibility**: Ensure WCAG compliance

## Security Guidelines

### RLS Policy Management
- **Always implement RLS**: Every table must have Row Level Security enabled
- **Test policies thoroughly**: Use multiple user contexts to verify access controls
- **Principle of least privilege**: Grant minimal necessary permissions
- **Regular audits**: Review and update policies as features evolve

### API Security
- **Route protection**: Implement authentication checks in API routes
- **Input validation**: Use Zod schemas for all incoming data
- **Rate limiting**: Implement rate limiting for public endpoints
- **Error handling**: Never expose sensitive information in error messages

```typescript
// Example protected API route
export async function GET(request: Request) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Proceed with authenticated logic
}
```

### Middleware Authentication (Critical Setup)

#### File Placement Requirements
- **Location**: Place middleware.ts in `src/middleware.ts` (NOT in project root)
- **Next.js 15+ Requirement**: App Router projects require middleware in src/ directory
- **Restart Required**: Always restart dev server after middleware changes

#### Implementation Features
- **Supabase Integration**: Uses Supabase SSR client for session validation
- **Route Protection**: Protects all routes except `/auth` by default
- **Smart Redirects**: Redirects to `/auth?redirectTo=<original-path>` for pages
- **API Security**: Returns 401 Unauthorized for unauthenticated API requests
- **Performance Monitoring**: Tracks execution time with warnings for slow operations (>100ms)

#### Error Handling Scenarios
- **Missing Config**: Returns 503 Service Unavailable for missing environment variables
- **Unauthenticated**: Redirects pages to auth, returns 401 for API routes
- **Auth Errors**: Comprehensive error responses with user-friendly messages
- **Security Headers**: Adds performance and security headers to responses

#### Testing Checklist
- ✅ Signed out user accessing protected page → Redirect to auth with redirectTo
- ✅ Signed out user accessing API → 401 Unauthorized response
- ✅ Signed in user → Normal access with security headers
- ✅ Missing environment variables → Service unavailable error
- ✅ Performance monitoring → Logs warnings for slow operations

### Environment Security
- **Never commit secrets**: Use environment variables for all sensitive data
- **Validate environment**: Check required environment variables on startup
- **Separate environments**: Use different keys for dev/staging/production
- **Key rotation**: Regularly rotate API keys and secrets

### Frontend Security
- **Client-side validation**: Always validate on both client and server
- **Sanitize inputs**: Prevent XSS attacks through proper input sanitization
- **HTTPS only**: Ensure all communications use HTTPS
- **CSP headers**: Implement Content Security Policy headers

### Database Security
- **Parameterized queries**: Always use parameterized queries to prevent SQL injection
- **Connection security**: Use SSL connections to database
- **Backup encryption**: Ensure database backups are encrypted
- **Access logging**: Enable audit logging for sensitive operations

### Security Review Checklist
- [ ] RLS policies implemented and tested
- [ ] API routes protected with authentication
- [ ] Input validation with Zod schemas
- [ ] Environment variables properly configured
- [ ] No sensitive data in client-side code
- [ ] CORS configured appropriately
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting implemented where needed

## Common Commands

### Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Supabase Commands
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/supabase.ts

# Create migration
supabase db diff -f migration_name

# Apply migrations
supabase db push
```

### Git Commands
```bash
# Create feature branch
git checkout -b [issue-number]

# Commit with message
git commit -m "feat: descriptive message"

# Push branch
git push origin [branch-name]

# Create PR
gh pr create --title "Title" --body "Description"
```

## Testing Guidelines

### Testing Strategy
- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **API Tests**: Test API endpoints and database operations

### Testing Standards
- **Coverage Requirements**: Maintain minimum 80% code coverage
- **Test Naming**: Use descriptive test names following `should [expected behavior] when [condition]` pattern
- **Mock Data**: Use consistent mock data patterns across tests
- **Database Testing**: Use test database with proper cleanup between tests

### Testing Tools
- **Jest**: Unit testing framework
- **React Testing Library**: Component testing
- **MSW**: API mocking
- **Note**: Playwright is not used in this project due to removal issues

### Test Patterns
```typescript
// Example test structure with proper naming
describe('CandidateList Component', () => {
  it('should display candidates when data is loaded', () => {
    const mockCandidates = [
      { id: 1, name: 'John Doe', email: 'john@example.com' }
    ];
    
    render(<CandidateList candidates={mockCandidates} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('should show loading state when data is being fetched', () => {
    render(<CandidateList candidates={[]} loading={true} />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});

// Database test pattern
describe('Candidate API', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
    await seedTestData();
  });
  
  it('should create candidate with valid data', async () => {
    const candidateData = { name: 'Jane Doe', email: 'jane@example.com' };
    const response = await createCandidate(candidateData);
    
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject(candidateData);
  });
});
```

## Troubleshooting

### Common Issues

#### Authentication Issues
- **401 Unauthorized**: Check RLS policies and user permissions
- **Redirect Loops**: Verify auth configuration in middleware
- **Session Expired**: Implement proper token refresh logic

#### Database Issues
- **Connection Errors**: Check Supabase connection string
- **RLS Violations**: Review row level security policies
- **Migration Failures**: Check migration syntax and dependencies

#### Build Issues
- **TypeScript Errors**: Fix type definitions and imports
- **Module Resolution**: Check tsconfig.json paths
- **Missing Dependencies**: Run `npm install`
- **Vercel Build Failures**: Often caused by outdated branches; rebase/merge against main first
- **Duplicate Directory Issues**: Remove any duplicate directories (e.g., `mcp-testing/`)
- **Type Mismatches**: Ensure consistent typing between forms, constants, and APIs

#### Performance Issues
- **Slow Queries**: Optimize database queries and add indexes
- **Large Bundle**: Implement code splitting and lazy loading
- **Memory Leaks**: Check for unsubscribed listeners

### Debug Techniques
- **Console Logging**: Use structured logging
- **React DevTools**: Inspect component state
- **Network Tab**: Monitor API requests
- **Supabase Dashboard**: Check database queries

## Deployment

### Environment Configuration
- **Development**: Local Supabase instance
- **Staging**: Staging Supabase project
- **Production**: Production Supabase project

### Deployment Process
1. **Merge to main**: Ensure all tests pass
2. **Deploy migrations**: Apply database changes
3. **Deploy application**: Use Vercel or preferred platform
4. **Monitor**: Check for errors and performance

### Environment Variables
```bash
# Required environment variables
# Note: Never commit these values to the repository
# Use .env.local for local development
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
HUBSPOT_API_KEY=your_hubspot_api_key
```

---

## Response Format

When working on issues, provide responses in this format:

```markdown
## Current Status
- Issue: #[number] - [title]
- Branch: [branch-name]
- Progress: [current-step]

## Actions Taken
- [List of completed actions]

## Next Steps
- [Planned next actions]

## Questions/Blockers
- [Any questions or blockers]
```

---

**Remember**: Always prioritize code quality, user experience, and maintainability. When in doubt, ask for clarification and use the Context7 MCP server to research best practices.