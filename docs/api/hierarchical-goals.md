# Hierarchical Goals API

This document describes the API endpoints for generating and managing hierarchical organizational goals across different levels: ORGANIZATIONAL, DEPARTMENTAL, TEAM, and INDIVIDUAL.

## Overview

The hierarchical goals feature allows you to:
1. Generate organization-level strategic goals with AI
2. Generate child goals at department, team, and individual levels
3. View goals organized by level (for tabbed UI)
4. Maintain parent-child relationships between goals

## Goal Levels

- **ORGANIZATIONAL**: Company-wide strategic goals
- **DEPARTMENTAL**: Department-specific goals that support organizational goals
- **TEAM**: Team-level goals that support departmental goals
- **INDIVIDUAL**: Individual contributor goals that support team goals

## Base URL

```
/api/v1/organizational-goals
```

## Authentication

All endpoints require authentication via JWT Bearer token:
```
Authorization: Bearer <jwt-token>
```

## Endpoints

### 1. Get Goals by Level (For Tabbed UI)

**GET** `/by-level`

Returns goals grouped by level, perfect for rendering a tabbed interface.

**Query Parameters:**
- `parentId` (optional): Filter to show only children of a specific parent goal

**Response:**
```json
{
  "success": true,
  "data": {
    "organizational": [...],
    "departmental": [...],
    "team": [...],
    "individual": [...],
    "counts": {
      "organizational": 5,
      "departmental": 12,
      "team": 24,
      "individual": 48,
      "total": 89
    }
  }
}
```

**Example Usage:**
```bash
# Get all goals grouped by level
curl -X GET "http://localhost:3000/api/v1/organizational-goals/by-level" \
  -H "Authorization: Bearer <token>"

# Get child goals of a specific parent
curl -X GET "http://localhost:3000/api/v1/organizational-goals/by-level?parentId=<goal-id>" \
  -H "Authorization: Bearer <token>"
```

---

### 2. Generate Strategic Goals (Organization Level)

**POST** `/generate-ai`

Generate organization-level strategic goals using AI with Balanced Scorecard framework.

**Request Body:**
```json
{
  "organizationName": "TechCorp Inc",
  "industry": "SaaS / Technology",
  "organizationDescription": "Enterprise HR platform with AI-powered performance management"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "goals": [
      {
        "title": "Achieve Market Leadership in HR Tech",
        "description": "Position TechCorp as the #1 AI-powered HR platform...",
        "bscPerspective": "CUSTOMER",
        "targetDate": "2024-12-31",
        "weight": 25,
        "kpis": [
          {
            "name": "Market Share",
            "description": "Percentage of HR tech market captured",
            "target": "15",
            "unit": "%",
            "frequency": "QUARTERLY"
          }
        ]
      }
    ],
    "count": 4
  },
  "message": "Strategic goals generated successfully"
}
```

---

### 3. Create Organizational Goals from AI

**POST** `/create-from-ai`

Create organization-level goals in the database from AI-generated suggestions.

**Request Body:**
```json
{
  "goals": [
    {
      "title": "Goal title",
      "description": "Goal description",
      "bscPerspective": "FINANCIAL",
      "targetDate": "2024-12-31",
      "weight": 25,
      "kpis": [...]
    }
  ]
}
```

---

### 4. Generate Child Goals

**POST** `/generate-child-goals`

Generate child goals for a parent goal at department, team, or individual level.

**Request Body:**
```json
{
  "parentGoalId": "uuid-of-parent-goal",
  "targetLevel": "DEPARTMENTAL",
  "context": "Engineering",
  "numberOfGoals": 3
}
```

**Request Fields:**
- `parentGoalId` (required): The UUID of the parent goal
- `targetLevel` (required): One of `DEPARTMENTAL`, `TEAM`, or `INDIVIDUAL`
- `context` (optional): Department name, team name, or employee role for contextual generation
- `numberOfGoals` (optional): Number of child goals to generate (default: 3)

**Response:**
```json
{
  "success": true,
  "data": {
    "parentGoal": {
      "id": "parent-goal-uuid",
      "title": "Achieve Market Leadership in HR Tech",
      "level": "ORGANIZATIONAL"
    },
    "childGoals": [
      {
        "title": "Launch 3 New AI Features",
        "description": "Develop and launch AI-powered features for performance reviews...",
        "bscPerspective": "INTERNAL_PROCESS",
        "department": "Engineering",
        "targetDate": "2024-06-30",
        "weight": 40,
        "kpis": [
          {
            "name": "Features Released",
            "description": "Number of AI features in production",
            "target": "3",
            "unit": "#",
            "frequency": "QUARTERLY"
          }
        ]
      }
    ],
    "count": 3,
    "targetLevel": "DEPARTMENTAL"
  },
  "message": "Child goals generated successfully"
}
```

**Example Usage:**

```bash
# Generate departmental goals for Engineering
curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parentGoalId": "abc-123",
    "targetLevel": "DEPARTMENTAL",
    "context": "Engineering",
    "numberOfGoals": 4
  }'

# Generate team goals
curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parentGoalId": "dept-goal-456",
    "targetLevel": "TEAM",
    "context": "Backend Engineering Team",
    "numberOfGoals": 3
  }'

# Generate individual goals
curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "parentGoalId": "team-goal-789",
    "targetLevel": "INDIVIDUAL",
    "context": "Senior Backend Engineer",
    "numberOfGoals": 5
  }'
```

---

### 5. Create Child Goals from AI

**POST** `/create-child-goals`

Create child goals in the database from AI-generated suggestions.

**Request Body:**
```json
{
  "parentGoalId": "uuid-of-parent-goal",
  "targetLevel": "DEPARTMENTAL",
  "goals": [
    {
      "title": "Goal title",
      "description": "Goal description",
      "bscPerspective": "INTERNAL_PROCESS",
      "department": "Engineering",
      "targetDate": "2024-12-31",
      "weight": 35,
      "kpis": [...]
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "parentGoal": {
      "id": "parent-goal-uuid",
      "title": "Parent Goal Title",
      "level": "ORGANIZATIONAL"
    },
    "childGoals": [...],
    "count": 3,
    "targetLevel": "DEPARTMENTAL"
  },
  "message": "3 child goals created successfully"
}
```

---

## Workflow Examples

### Complete Hierarchical Goal Cascade

```bash
# Step 1: Generate organizational goals
RESPONSE=$(curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-ai" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "TechCorp",
    "industry": "SaaS",
    "organizationDescription": "Enterprise HR platform"
  }')

# Step 2: Create organizational goals in database
ORG_GOALS=$(curl -X POST "http://localhost:3000/api/v1/organizational-goals/create-from-ai" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "$RESPONSE")

# Step 3: Generate departmental goals for first org goal
ORG_GOAL_ID="<id-from-response>"
DEPT_GOALS_RESPONSE=$(curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{
    \"parentGoalId\": \"$ORG_GOAL_ID\",
    \"targetLevel\": \"DEPARTMENTAL\",
    \"context\": \"Engineering\",
    \"numberOfGoals\": 3
  }")

# Step 4: Create departmental goals
DEPT_GOALS=$(curl -X POST "http://localhost:3000/api/v1/organizational-goals/create-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "$DEPT_GOALS_RESPONSE")

# Step 5: Generate team goals
DEPT_GOAL_ID="<id-from-dept-goals>"
TEAM_GOALS_RESPONSE=$(curl -X POST "http://localhost:3000/api/v1/organizational-goals/generate-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "{
    \"parentGoalId\": \"$DEPT_GOAL_ID\",
    \"targetLevel\": \"TEAM\",
    \"context\": \"Backend Team\",
    \"numberOfGoals\": 4
  }")

# Step 6: Create team goals
curl -X POST "http://localhost:3000/api/v1/organizational-goals/create-child-goals" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d "$TEAM_GOALS_RESPONSE"

# Step 7: View all goals by level for tabbed UI
curl -X GET "http://localhost:3000/api/v1/organizational-goals/by-level" \
  -H "Authorization: Bearer <token>"
```

---

## Permissions

| Endpoint | Required Roles |
|----------|----------------|
| `GET /by-level` | All authenticated users |
| `POST /generate-ai` | ADMIN, DEPARTMENT_HEAD |
| `POST /create-from-ai` | ADMIN, DEPARTMENT_HEAD |
| `POST /generate-child-goals` | ADMIN, DEPARTMENT_HEAD, MANAGER |
| `POST /create-child-goals` | ADMIN, DEPARTMENT_HEAD, MANAGER |

---

## Frontend Integration: Tabbed UI

The `/by-level` endpoint is specifically designed for tabbed UI rendering:

```typescript
// Example React/TypeScript component
const [activeTab, setActiveTab] = useState<GoalLevel>('ORGANIZATIONAL');

// Fetch goals grouped by level
const { data } = await api.get('/organizational-goals/by-level');

// Render tabs
<Tabs value={activeTab} onChange={setActiveTab}>
  <Tab label={`Organizational (${data.counts.organizational})`} value="ORGANIZATIONAL" />
  <Tab label={`Departmental (${data.counts.departmental})`} value="DEPARTMENTAL" />
  <Tab label={`Team (${data.counts.team})`} value="TEAM" />
  <Tab label={`Individual (${data.counts.individual})`} value="INDIVIDUAL" />
</Tabs>

// Render goals for active tab
<TabPanel value={activeTab}>
  {data[activeTab.toLowerCase()].map(goal => (
    <GoalCard key={goal.id} goal={goal} />
  ))}
</TabPanel>
```

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common Error Codes:**
- `400`: Validation error (missing required fields, invalid target level)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (parent goal doesn't exist)
- `500`: Internal server error (AI generation failed)

---

## Additional Resources

- [Main API Documentation](../README.md)
- [Authentication Guide](./authentication.md)
- [Goal Model Schema](../../prisma/schema.prisma)
- [Balanced Scorecard Overview](https://en.wikipedia.org/wiki/Balanced_scorecard)
