# Clear Match AI

A comprehensive **Contact Relationship Management (CRM)** platform built for modern recruiting teams. Clear Match AI helps organizations manage candidates, tasks, events, and recruitment workflows efficiently with enterprise-grade security and modern architecture.

## Quick Start

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ClearMatch/clear-match.git
   cd clear-match
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   ```
   http://localhost:3000
   ```

## Architecture & Tech Stack

### **Core Technology Stack**
- **Next.js**: 15.3.5 (Latest stable with App Router)
- **React**: 19.1.0 (Latest with Server Components)
- **TypeScript**: 5.2.2 (Strict mode enabled)
- **Database**: Supabase (PostgreSQL with real-time features)
- **Authentication**: Supabase Auth with Row Level Security (RLS)

### **UI/UX Stack**
- **Styling**: Tailwind CSS 3.3.3 with custom configuration
- **Component Library**: Radix UI primitives (comprehensive set)
- **Design System**: Shadcn/UI components (40+ pre-built components)
- **Icons**: Lucide React (0.446.0)
- **Theming**: Next-themes for dark/light mode support

### **Form & Data Management**
- **Forms**: React Hook Form 7.53.0 with Zod validation
- **Data Fetching**: SWR 2.3.3 for client-side data fetching and caching
- **Validation**: Zod 3.23.8 for schema validation and type safety
- **Date Handling**: date-fns 3.6.0

### **External Integrations**
- **HubSpot API**: @hubspot/api-client 12.1.0 for CRM synchronization
- **Monaco Editor**: @monaco-editor/react 4.7.0 for code editing
- **Rate Limiting**: @upstash/ratelimit with Redis backend

### **Security Stack**
- **Content Security Policy**: Dynamic nonce-based CSP preventing XSS
- **Rate Limiting**: IP-based rate limiting with Redis backend
- **CSRF Protection**: Token-based CSRF protection for all forms and APIs
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: Complete set including HSTS, frame options, content type protection

## Key Features

### **Core Functionality**
- **Dashboard**: Comprehensive activity overview with stats and intelligent recommendations
- **Contact Management**: Full CRUD operations with advanced filtering and search
- **Task Management**: Activity tracking, workflow management, and assignment
- **Event Management**: Event planning, tracking, and coordination
- **Profile Management**: User authentication, settings, and preferences
- **HubSpot Integration**: Bidirectional CRM data synchronization

### **Security Features** 🔐
- **Enterprise-Grade Security**: Comprehensive security hardening implementation
- **Content Security Policy**: Dynamic nonce-based CSP preventing XSS attacks
- **Rate Limiting**: Multi-tier IP-based rate limiting (Auth: 5/min, API: 100/min, Public: 50/min)
- **CSRF Protection**: Token-based CSRF protection for all state-changing operations
- **Input Validation**: Comprehensive sanitization preventing injection attacks
- **File Upload Security**: Size, type, and content validation with malware prevention
- **Environment Validation**: Startup validation ensuring secure configuration

## Project Architecture

### **Next.js Features in Use**
1. **App Router**: Full utilization of Next.js 13+ routing paradigm
2. **Route Groups**: `(auth)` and `(dashboard)` for organized routing
3. **Server Components**: Used for data fetching and server-side rendering
4. **Client Components**: Strategic use with 'use client' directive
5. **Middleware**: Enhanced security middleware for authentication and protection
6. **API Routes**: RESTful API endpoints with comprehensive security
7. **Dynamic Routes**: `[id]` parameters for entity-specific pages
8. **Nested Layouts**: Dashboard layout wrapping protected routes

### **Project Structure**
```
clear-match/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes (login/signup)
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   └── api/               # API route handlers with security
│   ├── components/            # React components
│   │   ├── ui/                # 40+ reusable UI primitives (Shadcn/UI)
│   │   ├── Contact/           # Contact management components
│   │   ├── dashboard/         # Dashboard-specific components
│   │   ├── Layout/            # Layout and navigation components
│   │   └── [Feature]/         # Feature-based component organization
│   ├── lib/                   # Utility libraries and security
│   │   ├── security.ts        # Security utilities (CSP, sanitization)
│   │   ├── rate-limit.ts      # Rate limiting with Redis
│   │   ├── csrf.ts            # CSRF protection utilities
│   │   ├── api-utils.ts       # Enhanced API utilities with validation
│   │   └── env.ts             # Environment variable validation
│   ├── hooks/                 # Custom React hooks
│   └── middleware.ts          # Enhanced security middleware
├── supabase/                  # Database configuration
│   ├── migrations/            # Database schema migrations (22 files)
│   └── config.toml           # Supabase configuration
├── docs/                      # Documentation
│   └── SECURITY.md           # Comprehensive security guide
└── tests/                     # Test files and coverage reports
```

### **Database Schema**
**Multi-tenant Architecture** with organization-based isolation:

```sql
-- Core entities with Row Level Security (RLS)
organizations          # Multi-tenant support with RLS policies
profiles               # User profiles linked to auth.users
contacts               # Contact data (evolved from candidates)
activities             # Tasks and interactions with priority/status
contact_tags           # Flexible tagging system
tags                   # Tag definitions and metadata
templates              # Message and form templates
events                 # Event management and tracking
job_postings          # Job posting management
```

**Key Database Features:**
- ✅ **Row Level Security**: Comprehensive RLS policies for multi-tenant security
- ✅ **UUID Primary Keys**: All tables use UUIDs for better scalability
- ✅ **Audit Trail**: created_at, updated_at, created_by tracking
- ✅ **JSONB Fields**: Flexible schema for complex data and metadata
- ✅ **Data Integrity**: CHECK constraints and foreign key relationships

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

### Project Structure

```
clear-match/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   └── api/               # API route handlers
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI components (40+)
│   │   ├── Contact/           # Contact management features
│   │   ├── dashboard/         # Dashboard components
│   │   └── Layout/            # Layout components
│   ├── lib/                   # Utility libraries and security
│   ├── hooks/                 # Custom React hooks
│   └── middleware.ts          # Security middleware
├── supabase/                  # Database configuration
│   ├── migrations/            # Database schema migrations
│   └── config.toml           # Supabase configuration
├── docs/                      # Documentation
└── tests/                     # Test files
```

## Security 🔐

Clear Match AI implements **enterprise-grade security hardening** with comprehensive protection against modern web application threats:

### **Implemented Security Features**

| Feature | Status | Description |
|---------|--------|-------------|
| **Content Security Policy** | ✅ Active | Dynamic nonce-based CSP preventing XSS attacks |
| **Rate Limiting** | ✅ Active | Multi-tier IP-based rate limiting with Redis backend |
| **CSRF Protection** | ✅ Active | Token-based CSRF protection for all forms and APIs |
| **Input Validation** | ✅ Active | Comprehensive sanitization preventing injection attacks |
| **Security Headers** | ✅ Active | Complete set including HSTS, frame options, content type protection |
| **Environment Validation** | ✅ Active | Startup validation ensuring secure configuration |
| **File Upload Security** | ✅ Active | Size, type, and content validation with malware prevention |
| **Password Security** | ✅ Active | Strong password requirements and validation |

### **Security Architecture**

**Middleware-Level Protection:**
- 🛡️ **Authentication**: Supabase SSR integration with session validation
- 🛡️ **Route Protection**: All routes protected except explicit public routes
- 🛡️ **Performance Monitoring**: Request duration tracking with warnings
- 🛡️ **Error Handling**: Comprehensive error responses without information leakage

**API Security:**
- 🔒 **CSRF Validation**: All state-changing requests require valid CSRF tokens
- 🔒 **Input Sanitization**: XSS and injection prevention on all inputs
- 🔒 **Rate Limiting**: Different limits for auth (5/min), API (100/min), public (50/min)
- 🔒 **File Upload Protection**: Comprehensive file validation and sanitization

**Database Security:**
- 🏢 **Multi-tenant Isolation**: Row Level Security (RLS) policies
- 🏢 **Organization-based Access**: Data access limited to user's organization
- 🏢 **Audit Trail**: All changes tracked with timestamps and user attribution

### **Security Configuration**

**Environment Security:**
```bash
# All environment variables validated on startup
SESSION_SECRET=32-character-minimum-secret      # Required
UPSTASH_REDIS_REST_URL=redis-url               # Production rate limiting
UPSTASH_REDIS_REST_TOKEN=redis-token           # Production rate limiting
```

**Development vs Production:**
- **Development**: Memory-based rate limiting, relaxed CSP for development tools
- **Production**: Redis-based rate limiting, strict CSP, comprehensive monitoring

### **Security Testing & Monitoring**

**Built-in Security Testing:**
```typescript
// Security test scenarios included
SecurityTestScenarios.testCSP()                    // Test CSP effectiveness
SecurityTestScenarios.testRateLimit('/api/test')   // Test rate limiting
SecurityTestScenarios.testCSRF('/api/test')        // Test CSRF protection
SecurityTestScenarios.testInputValidation('/api/test') // Test input validation
```

**Security Headers:**
```
X-Frame-Options: DENY                          # Prevent clickjacking
X-Content-Type-Options: nosniff                # Prevent MIME sniffing
X-XSS-Protection: 1; mode=block               # Browser XSS filtering
Strict-Transport-Security: max-age=31536000    # Force HTTPS
Content-Security-Policy: [dynamic-nonce]       # Prevent XSS attacks
```

**CSP Configuration for Monaco Editor:**
The Content Security Policy includes `'unsafe-eval'` specifically to support the Monaco Editor component, which requires JavaScript evaluation for syntax highlighting and code execution. This is a controlled exception for the trusted Monaco Editor and does not compromise overall application security.

For comprehensive security configuration, deployment guidelines, and troubleshooting:
**📖 [Complete Security Documentation](./docs/SECURITY.md)**

## Documentation

- **[🔐 Security Guide](./docs/SECURITY.md)** - Comprehensive security configuration, deployment guidelines, and best practices
- **[📋 Environment Setup](./.env.example)** - Complete environment variable configuration template

### **Component Architecture Patterns**

**Feature-based Organization:**
```typescript
// Components organized by business domain
src/components/Contact/
├── ContactList/       # List views with filtering and pagination
├── CreateContact/     # Multi-step contact creation forms
├── EditContact/       # Edit functionality with validation
├── ShowContact/       # Detail views with tabbed interface
└── Common/            # Shared contact components and utilities
```

**Form Management Patterns:**
```typescript
// React Hook Form with Zod validation
const form = useForm<ContactFormData>({
  resolver: zodResolver(contactSchema),
  defaultValues: { /* ... */ }
})

// Built-in security validation
const validatedData = validateString(input, 'Name', 100, true)
```

**Data Fetching Patterns:**
```typescript
// SWR with error handling and caching
const { data, error, isLoading } = useSWR(
  `/api/contacts/${id}`,
  fetcher,
  { revalidateOnFocus: false }
)
```

## Implementation Status

### **Phase 1: Core Platform ✅ COMPLETED**
- ✅ Next.js 15 App Router implementation with TypeScript
- ✅ Supabase integration with Row Level Security (RLS)
- ✅ Authentication system with Supabase Auth
- ✅ Contact management (evolved from candidate management)
- ✅ Dashboard with activity overview and recommendations
- ✅ Task and event management systems
- ✅ Profile management and settings
- ✅ HubSpot API integration for CRM synchronization
- ✅ Comprehensive UI component library (40+ Shadcn/UI components)
- ✅ Form management with React Hook Form and Zod validation
- ✅ Responsive design with Tailwind CSS

### **Phase 2: Security Hardening ✅ COMPLETED**
- ✅ Content Security Policy (CSP) with dynamic nonce generation
- ✅ Multi-tier rate limiting with Redis backend and memory fallback
- ✅ CSRF protection for all forms and API routes
- ✅ Comprehensive input validation and sanitization
- ✅ Security headers (HSTS, frame options, content type protection)
- ✅ Environment variable validation with startup checks
- ✅ File upload security with type, size, and content validation
- ✅ Enhanced password requirements and validation
- ✅ Security testing suite with 20+ comprehensive tests
- ✅ Complete security documentation and deployment guides

### **Current Status**
- **Build Status**: ✅ All builds passing
- **Test Coverage**: ✅ 33/33 tests passing (20 security + 13 feature tests)
- **Security**: ✅ Enterprise-grade security fully implemented
- **Performance**: ✅ Fast builds (<1s), optimized bundle sizes
- **Documentation**: ✅ Comprehensive security and setup guides
- **Production Ready**: ✅ Ready for deployment with proper configuration

### **Technology Evolution**
- **Database**: Successfully evolved from "candidates" to "contacts" schema
- **Security**: Upgraded from basic authentication to enterprise-grade security
- **Architecture**: Migrated to Next.js 15 App Router with full TypeScript
- **Testing**: Comprehensive test suite with security-focused testing
- **Middleware**: Enhanced from basic auth to multi-layer security protection

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run security tests specifically
npm test src/lib/__tests__/security.test.ts
```

### **Test Coverage & Quality**

**Current Test Status:**
- **Test Suites**: 4 passing
- **Total Tests**: 33 passing
- **Security Tests**: 20 comprehensive security tests
- **Component Tests**: 8 React component tests  
- **Service Tests**: 5 service layer tests

**Test Coverage Areas:**
- ✅ **Security Utilities**: CSP, CSRF, rate limiting, input validation, sanitization
- ✅ **Component Testing**: React Testing Library with comprehensive mocking
- ✅ **Service Layer**: Dashboard services, data fetching, API utilities
- ✅ **API Testing**: Request/response validation, error handling

**Test Infrastructure:**
- **Framework**: Jest 30.0.4 with Next.js integration
- **Environment**: jsdom with comprehensive Next.js mocking
- **Security Testing**: Built-in security test scenarios and utilities
- **Coverage Reports**: LCOV and HTML coverage reports generated

## Environment Configuration

The application uses separate database instances for each environment to ensure proper isolation:

### Environment URLs
- **Production**: https://clear-match-sigma.vercel.app
- **Staging**: https://clear-match-git-staging-clear-match.vercel.app

### Environment Architecture
- **Local Development**: Uses local Supabase (Docker) or a dedicated development Supabase project
- **Staging**: Has its own Supabase project and database for testing
- **Production**: Completely isolated production Supabase project

## Local Supabase Development Setup

### Prerequisites

Before setting up local Supabase, ensure you have:
- **Docker Desktop**: Download and install from [docker.com](https://www.docker.com/products/docker-desktop/)
- **Node.js**: Version 18.17.0 or later
- **Git**: For cloning and version control

### Step 1: Install Supabase CLI

```bash
# Install via npm (recommended)
npm install -g supabase

# Or install via Homebrew (macOS)
brew install supabase/tap/supabase

# Verify installation
supabase --version
```

### Step 2: Start Local Supabase

```bash
# Navigate to your project directory
cd clear-match

# Start all Supabase services locally
supabase start

# This will start:
# - PostgreSQL database
# - PostgREST API server
# - Supabase Auth
# - Supabase Storage
# - Realtime server
# - Supabase Studio (local dashboard)
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://localhost:54321
     GraphQL URL: http://localhost:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@localhost:54322/postgres
      Studio URL: http://localhost:54323
    Inbucket URL: http://localhost:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: [your-anon-key]
service_role key: [your-service-role-key]
```

### Step 3: Configure Environment Variables

Create your local environment file:

```bash
# Copy the example environment file
cp .env.example .env.local
```

Update `.env.local` with your local Supabase credentials:

```bash
# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key-from-supabase-start-output]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key-from-supabase-start-output]

# Other required variables
HUBSPOT_API_KEY=your-hubspot-key
SESSION_SECRET=your-32-character-secret-for-csrf-protection

# Optional: Redis for rate limiting (use memory fallback in development)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

### Step 4: Apply Database Migrations

```bash
# Reset database and apply all migrations
supabase db reset

# Or apply migrations individually
supabase db push
```

### Step 5: Access Local Services

Once running, you can access:

- **Supabase Studio**: http://localhost:54323 (Database management UI)
- **API**: http://localhost:54321 (REST API)
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Inbucket**: http://localhost:54324 (Email testing)

### Step 6: Start the Application

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open application
open http://localhost:3000
```

## Local Development Workflow

### Daily Development

```bash
# Start Supabase (if not already running)
supabase start

# Start the application
npm run dev

# When done for the day
supabase stop
```

### Database Management

```bash
# View database status
supabase status

# Reset database (destroys all data)
supabase db reset

# Create a new migration
supabase db diff -f migration_name

# Apply pending migrations
supabase db push

# Generate TypeScript types
supabase gen types typescript --local > src/types/supabase.ts
```

### Useful Supabase CLI Commands

```bash
# View all services status
supabase status

# View logs for specific service
supabase logs db
supabase logs api
supabase logs auth

# Stop all services
supabase stop

# Remove all containers and volumes (complete reset)
supabase stop --no-backup
```

## Troubleshooting Local Setup

### Common Issues and Solutions

**1. Docker not running**
```
Error: Cannot connect to the Docker daemon
```
**Solution**: Start Docker Desktop and ensure it's running.

**2. Port conflicts**
```
Error: Port 54321 is already in use
```
**Solution**: Stop conflicting services or change ports in `supabase/config.toml`.

**3. Database connection issues**
```
Error: database "postgres" does not exist
```
**Solution**: Run `supabase db reset` to recreate the database.

**4. Migration errors**
```
Error: relation "public.profiles" does not exist
```
**Solution**: Ensure all migrations are applied with `supabase db reset`.

**5. Environment variable issues**
```
Error: Invalid API key
```
**Solution**: Copy the exact keys from `supabase start` output to your `.env.local`.

### Performance Tips

- **Use SSD storage** for better database performance
- **Allocate sufficient RAM** to Docker (minimum 4GB recommended)
- **Close unnecessary services** when not developing to save resources

### Configuration Steps

1. **Local Development** - Copy `.env.example` to `.env.local` and configure:
```bash
# Local/Development Database
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key
HUBSPOT_API_KEY=your-hubspot-key
SESSION_SECRET=your-32-character-secret

# Optional (Redis for production rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

2. **Staging Environment** - Configure in Vercel Dashboard (Preview environment):
- Create a separate Supabase project for staging
- Add all required environment variables with staging-specific values

3. **Production Environment** - Configure in Vercel Dashboard (Production environment):
- Create a separate Supabase project for production
- Add all required environment variables with production-specific values

## Deployment

### Vercel (Recommended)

1. **Connect repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Set up Upstash Redis** for production rate limiting
4. **Deploy** - automatic deployments on push to main

### Other Platforms

The application is compatible with any Node.js hosting platform that supports:
- Next.js 15+ with App Router
- Edge Runtime for middleware
- Environment variable configuration

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow security guidelines** in `docs/SECURITY.md`
4. **Write tests** for new functionality
5. **Commit changes** (`git commit -m 'Add amazing feature'`)
6. **Push to branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- ✅ **Security First**: All new code must follow security best practices
- ✅ **Test Coverage**: Write tests for new functionality
- ✅ **TypeScript**: Use strict TypeScript configuration
- ✅ **Code Quality**: Follow ESLint and Prettier configuration
- ✅ **Documentation**: Update documentation for new features

## License

This project is proprietary software. All rights reserved.

## Support

For support and questions:
- **Security Issues**: See [Security Documentation](./docs/SECURITY.md)
- **General Issues**: Create a GitHub issue
- **Feature Requests**: Create a GitHub issue with enhancement label

---

**Built with ❤️ by the Clear Match AI team**// Trigger redeployment
