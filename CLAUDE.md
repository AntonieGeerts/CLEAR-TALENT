# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CLEAR-TALENT is an enterprise HR platform with AI-powered performance management, featuring intelligent competency libraries, goal/OKR suggestions, skill-gap detection, and automated workflow assistance. Built with TypeScript/Node.js, Express, Prisma ORM, PostgreSQL with pgvector, and OpenAI GPT-4 integration.

**Current State**: Stage 2 complete (AI-Assisted Workflows). Features include AI competency library builder, role-based templates, goal/OKR generation, skill-gap detection, IDPs, sentiment analysis, and learning path suggestions.

## Development Commands

### Essential Commands
```bash
# Development server (hot reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Production server
npm start

# Database operations
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate          # Create and apply migration
npm run prisma:migrate:deploy   # Apply migrations (production)
npm run prisma:studio          # Open database GUI
npm run prisma:seed            # Seed database with test data

# Testing
npm test                       # Run all tests
npm run test:watch             # Watch mode
npm run test:coverage          # Generate coverage report

# Code quality
npm run lint                   # Lint TypeScript files
npm run lint:fix               # Auto-fix linting issues
npm run format                 # Format with Prettier
```

### Utility Scripts
```bash
# Data management
npm run deduplicate:competencies  # Remove duplicate competencies
npm run add-goal-template        # Install AI goal prompt template
```

### Single Test Execution
```bash
# Run specific test file
npx jest src/path/to/test.test.ts

# Run tests matching pattern
npx jest --testNamePattern="test name pattern"

# Watch specific file
npx jest src/path/to/test.test.ts --watch
```

## Architecture Overview

### Core System Design

**Multi-Tenant Architecture**: Tenant-based data isolation with row-level security. All domain entities (competencies, roles, reviews) are scoped to `tenantId`.

**AI Engine (Singleton Pattern)**: Central `LLMOrchestrator` coordinates all AI operations:
- Provider abstraction layer (currently OpenAI, designed for multi-provider)
- Prompt template management with versioning
- PII detection/redaction before AI processing
- Comprehensive audit logging for all AI interactions
- Rate limiting and retry logic with exponential backoff

**Service Layer Architecture**: Business logic separated into domain services:
- `services/ai/` - AI orchestration, prompt management, audit logging
- `services/auth/` - JWT authentication and authorization
- `services/competency/` - Competency library management
- `services/role/` - Role profile and template management
- `services/organizational-goals/` - Goal/OKR AI generation

### Key Architectural Patterns

**Singleton Pattern**: `LLMOrchestrator.getInstance()` ensures single AI provider instance across application lifecycle.

**Strategy Pattern**: `AIProvider` interface allows switching between OpenAI, Anthropic, Azure OpenAI without changing business logic.

**Repository Pattern**: Prisma client provides type-safe data access layer with automatic migrations.

**Middleware Pipeline**: Express middleware chain handles authentication → RBAC → rate limiting → request logging → error handling.

### Data Flow

1. **Request** → API Routes (`src/routes/`) → Authentication Middleware
2. **Controller** → Input validation (Zod schemas) → Service Layer
3. **Service** → Business logic → Prisma ORM → PostgreSQL
4. **AI Flow** → LLMOrchestrator → PII Redaction → OpenAI API → Audit Log → Response

### Critical Components

**Prompt Management** (`services/ai/prompt-manager.ts`):
- Templates stored in `AIPromptTemplate` table
- Variable substitution with type safety
- Versioning support for A/B testing

**PII Protection** (`utils/pii-detector.ts`):
- Automatic detection of emails, phone numbers, SSN, etc.
- Configurable per-tenant via `PII_REDACTION_ENABLED`
- Redacted data never sent to external AI providers

**Audit System** (`services/ai/audit-service.ts`):
- Every AI operation logged with prompt, response, tokens, latency
- Status tracking: success, error, filtered (PII blocked)
- Required for compliance and usage monitoring

## Database Schema Key Points

### Multi-Tenancy
All tenant-scoped models include `tenantId` foreign key with cascading deletes. System admins (`UserRole.SYSTEM_ADMIN`) have `tenantId: null`.

### Competency Hierarchy
```
Competency (e.g., "Leadership")
  └─ ProficiencyLevel (Basic, Intermediate, Advanced, Expert, Master)
      └─ BehavioralIndicator (Observable behaviors at each level)
```

### Role-Based Templates
```
RoleProfile (e.g., "Senior Software Engineer")
  └─ RoleCompetency (Join table)
      ├─ competency_id
      ├─ required_level_id (target proficiency)
      └─ is_mandatory (boolean)
```

### Embeddings
`EmbeddingVector` table stores pgvector embeddings (1536 dimensions) for semantic search of competencies, roles, and documents.

## Environment Configuration

### Required Variables
```bash
DATABASE_URL         # PostgreSQL connection with pgvector
OPENAI_API_KEY      # OpenAI API access
JWT_SECRET          # Token signing secret
```

### AI Configuration
```bash
AI_ENABLED=true                    # Global AI toggle
OPENAI_MODEL=gpt-4o-mini          # Model selection
PII_REDACTION_ENABLED=true        # PII protection
AI_RATE_LIMIT_PER_MINUTE=60       # Rate limiting
```

### CORS Configuration
For frontend integration, add frontend URLs to `CORS_ORIGIN`:
```bash
CORS_ORIGIN=https://your-frontend.vercel.app,http://localhost:5173
```

## API Design Patterns

### Base URL Structure
```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/ai/{action}
```

### Authentication
All endpoints except `/api/v1/auth/login` require JWT Bearer token:
```
Authorization: Bearer <jwt-token>
```

### AI Endpoint Pattern
AI-powered operations follow consistent naming:
```typescript
POST /api/v1/competencies/ai/suggest-from-jd
POST /api/v1/competencies/:id/ai/generate-indicators
POST /api/v1/roles/:id/ai/suggest-goals
POST /api/v1/workflows/ai/analyze-skill-gaps
```

### Request/Response Format
```typescript
// AI Request
{
  "text": "input text",
  "context": "performance_review | goal_setting | etc",
  "options": { /* AI-specific parameters */ }
}

// AI Response
{
  "success": true,
  "data": { /* generated content */ },
  "metadata": {
    "tokensUsed": 1234,
    "latencyMs": 567,
    "model": "gpt-4o-mini"
  }
}
```

## Testing Strategy

### Test Organization
```
src/
  services/
    ai/
      orchestrator.ts
      orchestrator.test.ts    # Unit tests for AI orchestration
    competency/
      competency-service.ts
      competency-service.test.ts
```

### Test Configuration
- **Framework**: Jest with ts-jest
- **Environment**: Node.js test environment
- **Coverage**: Configured to exclude test files, type definitions
- **Location**: Co-located with source files (`.test.ts` suffix)

### Mock Strategy
Mock external dependencies (Prisma, OpenAI) in unit tests. For integration tests, use test database with `DATABASE_URL` override.

## Security Considerations

### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  SYSTEM_ADMIN      // CLEARTalent global admin
  ADMIN             // Client HR owner
  DEPARTMENT_HEAD   // Strategic leader
  MANAGER           // People leader
  EMPLOYEE          // Individual contributor
  REVIEWER          // Feedback provider
}
```

Middleware checks: `requireAuth` → `requireRole([UserRole.ADMIN])` → Business logic.

### Tenant Isolation
All queries automatically filter by `tenantId` from JWT token claims. Never trust client-provided tenant IDs.

### PII Protection
Before sending text to AI:
1. Run through `PIIDetector.detectAndRedact()`
2. Log redaction event in audit trail
3. Fail safely if PII detected and `PII_REDACTION_ENABLED=true`

### Rate Limiting
- Global: 100 requests per 15 minutes per IP
- AI endpoints: 60 requests per minute per tenant
- Configurable via environment variables

## Common Development Patterns

### Adding New AI Operation
1. Define prompt template in `AIPromptTemplate` table
2. Implement service method using `LLMOrchestrator`:
   ```typescript
   const orchestrator = LLMOrchestrator.getInstance();
   const result = await orchestrator.generateCompletion(
     'template-name',
     variables,
     { tenantId, userId, module: 'competency', action: 'generate' }
   );
   ```
3. Add audit logging (automatic via orchestrator)
4. Create controller endpoint
5. Register route in appropriate routes file

### Database Migrations
1. Modify `prisma/schema.prisma`
2. Run `npm run prisma:migrate` (creates migration file)
3. Review generated SQL in `prisma/migrations/`
4. Test migration with `npx prisma migrate reset` (dev only)
5. Commit migration files to version control

### Multi-Tenant Development
Always scope queries by tenant:
```typescript
// Correct
await prisma.competency.findMany({
  where: { tenantId: user.tenantId }
});

// Incorrect - exposes cross-tenant data
await prisma.competency.findMany();
```

## Troubleshooting

### Database Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Check database connection
npx prisma db pull

# Fix migration drift
npx prisma migrate resolve --applied "migration-name"
```

### AI Provider Issues
- Check `AI_ENABLED=true` in environment
- Verify `OPENAI_API_KEY` is valid
- Review AI audit logs: `SELECT * FROM ai_audit_logs ORDER BY created_at DESC LIMIT 10;`
- Check rate limits and token usage

### Type Generation
After schema changes:
```bash
npm run prisma:generate  # Regenerate Prisma client types
npm run build           # Rebuild TypeScript
```

## Development Workflow

1. **Feature Branch**: `git checkout -b feature/my-feature`
2. **Database Changes**: Update schema → migrate → generate client
3. **Implementation**: Service layer → Controller → Route registration
4. **Testing**: Write tests → run `npm test`
5. **Code Quality**: `npm run lint:fix && npm run format`
6. **Commit**: Descriptive commit messages
7. **Push**: `git push origin feature/my-feature`

## Important Files

- `src/index.ts` - Application entry point, middleware setup
- `src/routes/index.ts` - Central route registration
- `src/config/index.ts` - Configuration loader with type safety
- `src/services/ai/orchestrator.ts` - AI provider coordination
- `src/middleware/auth.ts` - JWT authentication logic
- `prisma/schema.prisma` - Database schema definition
- `prisma/seed.ts` - Test data seeding

## API Base URL

- **Development**: `http://localhost:3000/api/v1`
- **Production**: Configured via deployment platform (Railway/Vercel/AWS)

Health check: `GET /api/v1/health`
