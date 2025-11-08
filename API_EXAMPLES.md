# CLEAR-TALENT API Examples

Complete examples for all Stage 1 API endpoints.

## Table of Contents

- [Authentication](#authentication)
- [Competency Management](#competency-management)
- [AI-Powered Features](#ai-powered-features)
- [Staff Dashboard Data](#staff-dashboard-data)
- [Learning & Development Plans](#learning--development-plans)
- [Error Handling](#error-handling)

---

## Authentication

### Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo-org.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@demo-org.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "tenantId": "tenant-uuid"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### Get Current User

```bash
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Competency Management

### List Competencies

```bash
# Basic listing
curl http://localhost:3000/api/v1/competencies \
  -H "Authorization: Bearer YOUR_TOKEN"

# With filters
curl "http://localhost:3000/api/v1/competencies?type=TECHNICAL&category=Engineering&page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN"

# With search
curl "http://localhost:3000/api/v1/competencies?search=communication" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Communication",
      "type": "BEHAVIORAL",
      "description": "Ability to effectively convey information and ideas",
      "category": "Soft Skills",
      "tags": ["interpersonal", "collaboration"],
      "proficiencyLevels": [
        {
          "id": "level-uuid",
          "name": "Basic",
          "numericLevel": 1
        }
      ],
      "createdAt": "2025-11-05T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 3,
    "totalPages": 1
  }
}
```

### Get Competency by ID

```bash
curl http://localhost:3000/api/v1/competencies/COMPETENCY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response includes full details with proficiency levels and behavioral indicators.

### Create Competency

```bash
curl -X POST http://localhost:3000/api/v1/competencies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Data Analysis",
    "type": "TECHNICAL",
    "description": "Ability to analyze complex datasets and derive insights",
    "category": "Analytics",
    "tags": ["data", "analytics", "visualization"]
  }'
```

### Update Competency

```bash
curl -X PUT http://localhost:3000/api/v1/competencies/COMPETENCY_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Updated description here",
    "tags": ["updated", "tags"]
  }'
```

### Delete Competency

```bash
curl -X DELETE http://localhost:3000/api/v1/competencies/COMPETENCY_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## AI-Powered Features

### 1. Suggest Competencies from Job Description

**Use Case**: Parse a job description and get AI-suggested competencies.

```bash
curl -X POST http://localhost:3000/api/v1/ai/competencies/suggest-from-jd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "jobDescription": "We are seeking a Senior Product Manager to lead our mobile app initiatives. The ideal candidate will have 5+ years of experience in product management, strong analytical skills, excellent communication abilities, and experience with Agile methodologies. Must be able to work cross-functionally with engineering, design, and marketing teams.",
    "roleTitle": "Senior Product Manager",
    "department": "Product"
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "Product Strategy",
      "type": "FUNCTIONAL",
      "category": "Product Management",
      "description": "Ability to define and execute product vision and roadmap",
      "confidence": 0.95
    },
    {
      "name": "Cross-Functional Leadership",
      "type": "LEADERSHIP",
      "category": "Leadership",
      "description": "Ability to lead and coordinate across multiple teams",
      "confidence": 0.90
    },
    {
      "name": "Data-Driven Decision Making",
      "type": "TECHNICAL",
      "category": "Analytics",
      "description": "Using data and metrics to inform product decisions",
      "confidence": 0.88
    }
  ],
  "message": "Competencies suggested successfully"
}
```

### 2. Generate Behavioral Indicators

**Use Case**: Generate observable behavioral indicators for a specific competency and proficiency level.

```bash
curl -X POST http://localhost:3000/api/v1/ai/competencies/COMPETENCY_ID/generate-indicators \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "levelId": "PROFICIENCY_LEVEL_ID",
    "count": 5
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "description": "Facilitates productive team meetings with clear agendas and documented outcomes",
      "examples": [
        "Led weekly sprint planning with 10+ stakeholders",
        "Created and distributed meeting notes within 24 hours"
      ]
    },
    {
      "description": "Delivers presentations to diverse audiences, adjusting communication style appropriately",
      "examples": [
        "Presented quarterly results to executive leadership",
        "Conducted technical demos for non-technical clients"
      ]
    }
  ],
  "message": "Behavioral indicators generated successfully"
}
```

### 3. Generate Proficiency Levels

**Use Case**: Auto-generate proficiency levels for a competency.

```bash
curl -X POST http://localhost:3000/api/v1/ai/competencies/COMPETENCY_ID/generate-levels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "count": 5
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "name": "Basic",
      "numericLevel": 1,
      "description": "Demonstrates foundational understanding with supervision",
      "sortOrder": 1
    },
    {
      "name": "Intermediate",
      "numericLevel": 2,
      "description": "Applies knowledge independently in routine situations",
      "sortOrder": 2
    },
    {
      "name": "Advanced",
      "numericLevel": 3,
      "description": "Handles complex scenarios and mentors others",
      "sortOrder": 3
    }
  ]
}
```

### 4. Create Proficiency Levels (with auto-create)

**Use Case**: Generate and automatically save proficiency levels.

```bash
curl -X POST http://localhost:3000/api/v1/ai/competencies/COMPETENCY_ID/create-levels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "count": 5,
    "autoCreate": true
  }'
```

### 5. Improve Review Text

**Use Case**: Enhance performance review feedback to be more specific and constructive.

```bash
curl -X POST http://localhost:3000/api/v1/ai/text/improve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Sarah did a good job on the project.",
    "context": "Q3 performance review",
    "style": "specific"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "originalText": "Sarah did a good job on the project.",
    "improvedText": "Sarah successfully delivered the customer portal redesign project two weeks ahead of schedule. She demonstrated strong technical skills by implementing a new authentication system that reduced login errors by 40%. Her proactive communication with stakeholders ensured alignment throughout the project lifecycle."
  },
  "message": "Text improved successfully"
}
```

### 6. Summarize Text

**Use Case**: Create concise summaries of lengthy feedback or reviews.

```bash
curl -X POST http://localhost:3000/api/v1/ai/text/summarize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Throughout Q3, John demonstrated exceptional technical leadership on the platform migration project. He successfully coordinated work across three engineering teams, mentored two junior developers, and delivered all milestones on time. His code review process has significantly improved code quality across the team. However, there were some challenges with documentation - several technical decisions were not documented, making it difficult for new team members to understand the rationale. Additionally, John could benefit from delegating more effectively, as he tends to take on too many tasks himself rather than distributing work. Overall, strong performance with room for improvement in documentation and delegation.",
    "maxLength": 150
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "originalText": "Throughout Q3, John demonstrated...",
    "summary": "John showed exceptional technical leadership in Q3, delivering the migration project on time and mentoring junior developers. Areas for improvement: documentation of technical decisions and delegation skills."
  }
}
```

### 7. Rewrite Text with Different Tone

**Use Case**: Adjust the tone of feedback (formal, casual, constructive).

```bash
curl -X POST http://localhost:3000/api/v1/ai/text/rewrite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "You need to stop missing deadlines and get your work done on time.",
    "tone": "constructive"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "originalText": "You need to stop missing deadlines...",
    "rewrittenText": "I've noticed some challenges meeting project timelines recently. Let's work together to identify any obstacles you're facing and develop strategies to help you deliver work on schedule. What support do you need to meet your commitments?",
    "tone": "constructive"
  }
}
```

### 8. Structure Feedback

**Use Case**: Organize unstructured feedback into clear sections.

```bash
curl -X POST http://localhost:3000/api/v1/ai/text/structure-feedback \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "Maria is great at coding and always helps teammates but sometimes her commits break the build and she could communicate better about what shes working on overall shes a valuable team member who is improving"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "originalText": "Maria is great at coding...",
    "structuredText": "## Strengths\n- Strong technical coding abilities\n- Collaborative team player who actively helps colleagues\n- Valuable team member showing continuous improvement\n\n## Areas for Improvement\n- Code quality: Commits occasionally break the build\n- Communication: Could provide better updates on current work\n\n## Recommendations\n- Implement pre-commit testing to catch build issues\n- Participate in daily standups or provide written status updates\n- Consider pair programming to share knowledge while improving code review practices"
  }
}
```

## Staff Dashboard Data

| Feature | Endpoint | Notes |
| --- | --- | --- |
| Personal goals | `GET /api/v1/goals` | Returns the authenticated employee's goals; privileged roles can pass `employeeId`. |
| Goal stats | `GET /api/v1/goals/stats` | Aggregated counts (draft/active/completed/cancelled/archived). |
| Assessments | `GET /api/v1/assessments/my-assessments` | Chronological log of competency/self assessments. |
| Feedback insights | `GET /api/v1/workflows/feedback/analyze/:employeeId` | AI-powered sentiment/themes for recent feedback. |
| Development plans **(new)** | `GET /api/v1/idps` | Lists IDPs for the requester (or the whole tenant if privileged). |
| IDP management **(new)** | `POST /api/v1/idps`, `PUT /api/v1/idps/:id`, `DELETE /api/v1/idps/:id` | Create, update, or remove development plans. |

## Learning & Development Plans

### List Plans

```bash
curl "http://localhost:3000/api/v1/idps?employeeId=USER_ID" \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Plan

```bash
curl -X POST http://localhost:3000/api/v1/idps \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Leadership Accelerator 2024",
    "description": "Focus on strategic storytelling",
    "startDate": "2025-03-01",
    "targetDate": "2025-06-30",
    "actions": [
      { "title": "Shadow ELT QBR", "dueDate": "2025-04-15" }
    ]
  }'
```

### Update a Plan

```bash
curl -X PUT http://localhost:3000/api/v1/idps/PLAN_ID \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "status": "ACTIVE",
    "progress": 45,
    "actions": [
      { "title": "Shadow ELT QBR", "dueDate": "2025-04-15", "completed": true }
    ]
  }'
```

### Delete a Plan

```bash
curl -X DELETE http://localhost:3000/api/v1/idps/PLAN_ID \\
  -H "Authorization: Bearer YOUR_TOKEN"
```

Responses follow the standard envelope with `success`, `data`, `message`, and `timestamp` fields.

---

## Error Handling

### Authentication Error

```json
{
  "success": false,
  "error": "Invalid or expired token",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### Validation Error

```json
{
  "success": false,
  "error": "Validation failed: email must be a valid email address",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### Rate Limit Error

```json
{
  "success": false,
  "error": "Too many AI requests, please slow down",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### AI Service Error

```json
{
  "success": false,
  "error": "Failed to generate completion: API rate limit exceeded",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

### Not Found Error

```json
{
  "success": false,
  "error": "Competency not found",
  "timestamp": "2025-11-05T12:00:00.000Z"
}
```

---

## Common Workflows

### Workflow 1: Create Role from Job Description

1. Suggest competencies from JD
2. Review and select competencies
3. Create competencies (if new)
4. Generate proficiency levels
5. Generate behavioral indicators
6. Create role profile linking competencies

### Workflow 2: Enhance Performance Review

1. Draft initial review
2. Use "improve text" to make it more specific
3. Use "structure feedback" to organize
4. Use "make constructive" for areas of improvement
5. Summarize for executive dashboard

### Workflow 3: Build Competency Library

1. Start with job descriptions
2. Use AI to suggest competencies for each role
3. Generate proficiency levels for each competency
4. Generate behavioral indicators for each level
5. Review and refine with HR team
6. Deploy across organization

---

## Postman Collection

Import this collection into Postman for easier testing:

```json
{
  "info": {
    "name": "CLEAR-TALENT API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000/api/v1"
    },
    {
      "key": "token",
      "value": ""
    }
  ]
}
```

Save your token after login and use `{{token}}` in Authorization headers.

---

## Rate Limits

- **Global API**: 100 requests per 15 minutes
- **AI Operations**: 60 requests per minute
- **Login**: 5 attempts per 15 minutes

Adjust in `.env` for testing:
```env
RATE_LIMIT_MAX_REQUESTS=1000
AI_RATE_LIMIT_PER_MINUTE=100
```

---

## Next Steps

1. Integrate with your frontend application
2. Customize AI prompts for your organization
3. Add custom competency categories
4. Implement role-based access controls
5. Set up monitoring and analytics
