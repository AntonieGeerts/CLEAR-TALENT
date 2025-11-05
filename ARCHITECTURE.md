# CLEAR-TALENT Architecture

## Technology Stack

### Backend
- **Runtime**: Node.js 18+ with TypeScript 5.x
- **Framework**: Express.js 4.x
- **ORM**: Prisma 5.x (type-safe database access)
- **Validation**: Zod (runtime type validation)
- **Authentication**: JWT + bcrypt

### Database
- **Primary DB**: PostgreSQL 15+
- **Vector Store**: pgvector extension (for embeddings)
- **Migration Tool**: Prisma Migrate

### AI Integration
- **LLM Provider**: OpenAI API (GPT-4/GPT-3.5-turbo)
- **Embeddings**: text-embedding-3-small
- **Architecture**: Provider-agnostic abstraction layer
- **Fallback**: Configurable alternative providers (Anthropic, Azure OpenAI)

### Infrastructure
- **Logging**: Winston with structured JSON logs
- **Monitoring**: Audit logs for all AI operations
- **Caching**: Redis (optional for Stage 2+)
- **File Storage**: Local/S3-compatible (for future document processing)

### Security
- **RBAC**: Role-based access control
- **Data Isolation**: Tenant-based data segregation
- **PII Protection**: Automatic PII detection and redaction in AI prompts
- **Audit Trail**: Complete logging of AI interactions

---

## System Architecture (Stage 1 - MVP)

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                       │
│              (Web UI, Mobile, API Consumers)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    API Gateway Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │  Rate Limit  │  │   CORS       │      │
│  │  Middleware  │  │  Middleware  │  │  Middleware  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Application Layer                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Module Controllers                      │    │
│  │  • Competency    • Performance  • L&D               │    │
│  │  • Feedback      • Recruitment  • Appraisal        │    │
│  └─────────────────────┬───────────────────────────────┘    │
│                        │                                      │
│  ┌─────────────────────▼───────────────────────────────┐    │
│  │              Service Layer                           │    │
│  │  • Business Logic  • Validation  • Orchestration   │    │
│  └─────────────────────┬───────────────────────────────┘    │
└────────────────────────┼────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
┌────────▼──────┐ ┌─────▼──────┐ ┌─────▼─────────────────────┐
│   Database    │ │  AI Engine │ │   External Services       │
│   Layer       │ │            │ │                           │
│               │ │            │ │                           │
│ PostgreSQL    │ │ ┌────────┐ │ │ • Email/Notifications     │
│ + pgvector    │ │ │  LLM   │ │ │ • File Storage            │
│               │ │ │ Orches.│ │ │ • Analytics/BI            │
│ • Core Data   │ │ └────┬───┘ │ │                           │
│ • Vectors     │ │      │     │ │                           │
│ • Audit Logs  │ │ ┌────▼───┐ │ │                           │
│               │ │ │Embed.  │ │ │                           │
│               │ │ │Store   │ │ │                           │
└───────────────┘ │ └────────┘ │ └───────────────────────────┘
                  │            │
                  │ ┌────────┐ │
                  │ │ Prompt │ │
                  │ │Template│ │
                  │ │Manager │ │
                  │ └────────┘ │
                  │            │
                  │ ┌────────┐ │
                  │ │Policy &│ │
                  │ │Security│ │
                  │ └────────┘ │
                  └────────────┘
```

---

## Data Model (Stage 1)

### Core Entities

#### Competency Management
```
Competency
├── id (UUID)
├── tenant_id (UUID)
├── name (String)
├── type (ENUM: technical, behavioral, leadership, functional)
├── description (Text)
├── category (String)
├── tags (String[])
├── version (Int)
├── created_by (UUID)
├── created_at (DateTime)
└── updated_at (DateTime)

ProficiencyLevel
├── id (UUID)
├── competency_id (UUID) → Competency
├── name (String: Basic, Intermediate, Advanced, Expert, Master)
├── numeric_level (Int: 1-5)
├── description (Text)
└── sort_order (Int)

BehavioralIndicator
├── id (UUID)
├── competency_id (UUID) → Competency
├── level_id (UUID) → ProficiencyLevel
├── description (Text)
├── examples (Text[])
└── sort_order (Int)

RoleProfile
├── id (UUID)
├── tenant_id (UUID)
├── title (String)
├── department (String)
├── seniority (ENUM: entry, mid, senior, lead, principal)
├── description (Text)
├── version (Int)
├── created_by (UUID)
├── created_at (DateTime)
└── updated_at (DateTime)

RoleCompetency (Join table)
├── id (UUID)
├── role_profile_id (UUID) → RoleProfile
├── competency_id (UUID) → Competency
├── required_level_id (UUID) → ProficiencyLevel
└── is_mandatory (Boolean)
```

#### User & Tenant Management
```
Tenant
├── id (UUID)
├── name (String)
├── slug (String, unique)
├── settings (JSON)
│   ├── ai_enabled (Boolean)
│   ├── data_residency (String)
│   ├── language (String)
│   └── custom_prompts (JSON)
└── created_at (DateTime)

User
├── id (UUID)
├── tenant_id (UUID) → Tenant
├── email (String, unique)
├── password_hash (String)
├── first_name (String)
├── last_name (String)
├── role (ENUM: admin, hr_manager, manager, employee)
├── department (String)
├── position (String)
├── ai_opt_out (Boolean)
└── created_at (DateTime)
```

#### AI Integration
```
AIPromptTemplate
├── id (UUID)
├── name (String)
├── module (ENUM: competency, review, feedback, jd, learning)
├── prompt_type (String)
├── template (Text)
├── variables (JSON)
└── version (Int)

AIAuditLog
├── id (UUID)
├── tenant_id (UUID)
├── user_id (UUID)
├── module (String)
├── action (String)
├── prompt (Text)
├── response (Text)
├── tokens_used (Int)
├── latency_ms (Int)
├── status (ENUM: success, error, filtered)
└── created_at (DateTime)

EmbeddingVector
├── id (UUID)
├── tenant_id (UUID)
├── entity_type (ENUM: competency, role, document)
├── entity_id (UUID)
├── content (Text)
├── vector (Vector(1536)) -- pgvector
├── metadata (JSON)
└── created_at (DateTime)
```

---

## AI Engine Architecture

### LLM Orchestrator
**Purpose**: Central hub for all AI operations

**Responsibilities**:
- Manage LLM provider connections (OpenAI, Anthropic, etc.)
- Handle prompt template rendering
- Rate limiting and request queuing
- Error handling and retries
- Response caching (Stage 2+)
- Token usage tracking

**Key Components**:
```typescript
class LLMOrchestrator {
  // Provider management
  selectProvider(preferences: ProviderPreferences): LLMProvider

  // Core operations
  generateCompletion(prompt: string, options: CompletionOptions): Promise<string>
  generateEmbedding(text: string): Promise<number[]>

  // Batch operations
  batchComplete(prompts: string[]): Promise<string[]>

  // Streaming
  streamCompletion(prompt: string): AsyncIterator<string>
}
```

### Prompt Template Manager
**Purpose**: Maintain and render prompt templates

**Features**:
- Template versioning
- Variable substitution
- Localization support
- A/B testing capability (Stage 2+)

**Template Categories**:
- `competency/suggest-from-jd`: Parse JD and suggest competencies
- `competency/generate-indicators`: Create behavioral indicators
- `competency/define-levels`: Generate proficiency levels
- `review/improve-text`: Enhance review feedback
- `review/summarize`: Summarize feedback
- `goal/suggest`: Generate SMART goals
- `learning/generate-idp`: Create development plans

### Security & Policy Layer

**PII Detection & Redaction**:
- Automatic detection of emails, phone numbers, SSN, etc.
- Configurable redaction rules per tenant
- Logging of redaction events

**Data Residency**:
- Tenant-level configuration
- Provider selection based on region
- Data locality enforcement

**Opt-out Controls**:
- User-level AI opt-out flag
- Automatic filtering of opt-out users from AI processing
- Manual workflow fallback

---

## API Design (Stage 1)

### Base URL
```
/api/v1
```

### Authentication
```
POST   /auth/login
POST   /auth/logout
POST   /auth/refresh
GET    /auth/me
```

### Competency Library
```
# Core CRUD
GET    /competencies
GET    /competencies/:id
POST   /competencies
PUT    /competencies/:id
DELETE /competencies/:id

# AI-powered operations
POST   /competencies/ai/suggest-from-jd
  Body: { jobDescription: string, roleTitle: string, department: string }
  Returns: { competencies: Competency[], confidence: number }

POST   /competencies/:id/ai/generate-indicators
  Body: { levelId: string, count: number }
  Returns: { indicators: BehavioralIndicator[] }

POST   /competencies/:id/ai/generate-levels
  Body: { count: number }
  Returns: { levels: ProficiencyLevel[] }
```

### Role Profiles
```
GET    /roles
GET    /roles/:id
POST   /roles
PUT    /roles/:id
DELETE /roles/:id

POST   /roles/:id/competencies
DELETE /roles/:id/competencies/:competencyId

# AI-powered
POST   /roles/ai/create-from-jd
  Body: { jobDescription: string }
  Returns: { role: RoleProfile, linkedCompetencies: Competency[] }
```

### AI Text Operations
```
POST   /ai/text/improve
  Body: { text: string, context: string, style: 'constructive'|'specific' }
  Returns: { improvedText: string }

POST   /ai/text/summarize
  Body: { text: string, maxLength: number }
  Returns: { summary: string }

POST   /ai/text/rewrite
  Body: { text: string, tone: 'formal'|'casual'|'constructive' }
  Returns: { rewrittenText: string }
```

### Admin & Configuration
```
GET    /admin/ai/audit-logs
GET    /admin/ai/usage-stats
PUT    /admin/ai/settings
GET    /admin/ai/prompt-templates
PUT    /admin/ai/prompt-templates/:id
```

---

## Security Considerations

### Authentication & Authorization
- JWT tokens with refresh mechanism
- Role-based access control (RBAC)
- Tenant isolation at database and API level
- Rate limiting per user and per tenant

### AI-Specific Security
- Input validation and sanitization
- Prompt injection prevention
- Output filtering for sensitive data
- Audit logging for all AI operations
- User consent for AI processing
- Data retention policies

### Data Protection
- Encryption at rest (database level)
- Encryption in transit (TLS 1.3)
- PII anonymization in AI prompts
- Secure API key storage (environment variables)
- Regular security audits

---

## Deployment Architecture

### Development
```
Local PostgreSQL + pgvector
Local Redis (optional)
Environment variables for API keys
```

### Staging/Production
```
Managed PostgreSQL (RDS/Cloud SQL/Azure Database)
Managed Redis (ElastiCache/Cloud Memorystore)
Container deployment (Docker + K8s/ECS/Cloud Run)
Secrets management (AWS Secrets Manager/Azure Key Vault/GCP Secret Manager)
Load balancer + Auto-scaling
CDN for static assets
```

---

## Monitoring & Observability

### Metrics
- API response times
- AI operation latency
- Token usage and costs
- Error rates
- Database query performance

### Logging
- Structured JSON logs
- Log levels: ERROR, WARN, INFO, DEBUG
- Correlation IDs for request tracing
- AI operation audit trail

### Alerts
- High error rates
- AI service downtime
- Token budget exceeded
- Unusual usage patterns
- Security events

---

## Stage 1 Implementation Priorities

1. **Core Infrastructure** (Week 1)
   - Project setup and dependencies
   - Database schema and migrations
   - Authentication system
   - Basic CRUD APIs

2. **AI Engine** (Week 2)
   - LLM orchestrator
   - Prompt template system
   - OpenAI integration
   - Embedding generation

3. **Competency Library** (Week 3)
   - Competency CRUD
   - AI-powered JD parsing
   - Behavioral indicator generation
   - Role profile creation

4. **AI Text Operations** (Week 4)
   - Review text improvement
   - Summarization
   - Tone adjustment

5. **Security & Governance** (Week 5)
   - Audit logging
   - PII redaction
   - User opt-out controls
   - Admin dashboard

---

## Future Enhancements (Stage 2-4)

### Stage 2
- Performance review workflows
- Goal/OKR management
- Skill gap detection
- Learning path recommendations
- Sentiment analysis

### Stage 3
- Predictive analytics
- Risk profiling
- Compensation guidance
- Promotion recommendations

### Stage 4
- Continuous learning and model fine-tuning
- Cross-system integrations
- Organization-level analytics
- Scenario planning

---

## Technology Alternatives Considered

| Component | Selected | Alternatives Considered |
|-----------|----------|------------------------|
| Backend Language | TypeScript/Node.js | Python (FastAPI), Go, Java/Kotlin |
| ORM | Prisma | TypeORM, Drizzle, Sequelize |
| LLM Provider | OpenAI | Anthropic Claude, Azure OpenAI, Local LLMs |
| Vector DB | pgvector | Pinecone, Weaviate, Qdrant |
| Cache | Redis | Memcached, In-memory |
| API Style | REST | GraphQL, gRPC |

**Rationale for Selections**:
- **TypeScript/Node.js**: Strong ecosystem, type safety, async handling
- **Prisma**: Type-safe, modern, excellent DX, migration support
- **OpenAI**: Market leader, extensive docs, reliable API
- **pgvector**: Reduces infrastructure complexity, ACID guarantees
- **Redis**: Industry standard, versatile, mature
- **REST**: Simple, widely understood, excellent tooling
