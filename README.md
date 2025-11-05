# CLEAR-TALENT

Performance Management & Development System (PMDS) with AI Integration

## Overview

CLEAR-TALENT is a comprehensive cloud-based HR platform that leverages AI to transform performance management, learning & development, feedback, recruitment, and appraisal processes. The platform features an intelligent competency library, AI-powered insights, and automated workflow assistance.

## Features (Stage 1 - MVP)

### AI Competency Library Builder
- Parse job descriptions and automatically suggest relevant competencies
- Generate behavioral indicators across multiple proficiency levels
- Create role profiles with linked competencies
- Multi-language support for global organizations

### AI-Powered Text Operations
- Improve review feedback (make constructive, specific, structured)
- Summarize long-form feedback and comments
- Rewrite content with different tones and styles

### Security & Governance
- Role-based access control (RBAC)
- Tenant-based data isolation
- Complete audit trail for all AI operations
- PII detection and redaction
- User opt-out controls

## Technology Stack

- **Backend**: Node.js 18+ with TypeScript 5.x
- **Framework**: Express.js
- **Database**: PostgreSQL 15+ with pgvector
- **ORM**: Prisma
- **AI/LLM**: OpenAI API (GPT-4)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ with pgvector extension
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CLEAR-TALENT
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Set up the database:
```bash
# Create database
createdb clear_talent

# Enable pgvector extension
psql clear_talent -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

## Development

Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/v1`

## Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create a new migration
npm run prisma:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## API Documentation

### Authentication

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

### Competency Library

#### List Competencies
```http
GET /api/v1/competencies
Authorization: Bearer <token>
```

#### Create Competency
```http
POST /api/v1/competencies
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Communication",
  "type": "behavioral",
  "description": "Ability to convey information effectively",
  "category": "Soft Skills"
}
```

#### AI: Suggest Competencies from Job Description
```http
POST /api/v1/competencies/ai/suggest-from-jd
Authorization: Bearer <token>
Content-Type: application/json

{
  "jobDescription": "We are looking for a Senior Software Engineer...",
  "roleTitle": "Senior Software Engineer",
  "department": "Engineering"
}
```

#### AI: Generate Behavioral Indicators
```http
POST /api/v1/competencies/:id/ai/generate-indicators
Authorization: Bearer <token>
Content-Type: application/json

{
  "levelId": "uuid-of-proficiency-level",
  "count": 5
}
```

### AI Text Operations

#### Improve Text
```http
POST /api/v1/ai/text/improve
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "The employee did a good job on the project.",
  "context": "performance review",
  "style": "specific"
}
```

#### Summarize Text
```http
POST /api/v1/ai/text/summarize
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Long feedback text...",
  "maxLength": 200
}
```

## Project Structure

```
CLEAR-TALENT/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Seed data
├── src/
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Express middleware
│   ├── services/             # Business logic
│   │   ├── ai/              # AI engine services
│   │   ├── competency/      # Competency services
│   │   └── auth/            # Authentication services
│   ├── models/              # Data models & types
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── index.ts             # Application entry point
├── logs/                    # Application logs
├── tests/                   # Test files
├── .env.example            # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── ARCHITECTURE.md         # Detailed architecture documentation
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: Secret for JWT token signing
- `AI_ENABLED`: Enable/disable AI features globally
- `PII_REDACTION_ENABLED`: Enable PII redaction in AI prompts

## Security

- All API endpoints require authentication (except `/auth/login`)
- JWT tokens expire after 7 days (configurable)
- Passwords are hashed using bcrypt
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- PII detection and redaction in AI prompts
- Complete audit trail for AI operations

## Development Roadmap

### Stage 1 - AI Foundations (Current)
- ✅ Central AI engine setup
- ✅ AI Competency Library Builder
- ✅ AI JD parser
- ✅ AI behavioral indicators generator
- ✅ AI review text helper
- ✅ Security & logging

### Stage 2 - AI-Assisted Workflows (Planned)
- Role-based competency templates
- AI goal/OKR suggestions
- Skill-gap detection
- AI-generated Individual Development Plans
- Sentiment & theme extraction
- Learning path suggestions

### Stage 3 - Predictive Insights (Future)
- Performance risk profiling
- Attrition risk indicators
- Calibration support
- Promotion & succession planning
- Compensation guidance

### Stage 4 - Automation & Continuous Learning (Future)
- Auto-updating competencies
- Closed-loop learning
- Cross-system integration
- Organization capability heatmaps

## Contributing

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make your changes
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Commit your changes: `git commit -m "Add my feature"`
6. Push to the branch: `git push origin feature/my-feature`
7. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Acknowledgments

Built with modern technologies and best practices for enterprise HR systems.
