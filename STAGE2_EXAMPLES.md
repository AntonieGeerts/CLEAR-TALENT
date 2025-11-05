# Stage 2 API Examples

Complete examples for all Stage 2 AI-Assisted Workflow features.

## Table of Contents

- [Role Templates (S2.1)](#role-templates-s21)
- [Goal/OKR Suggestions (S2.2)](#goalokr-suggestions-s22)
- [Skill Gap Detection (S2.3)](#skill-gap-detection-s23)
- [Individual Development Plans (S2.4)](#individual-development-plans-s24)
- [Sentiment Analysis (S2.5)](#sentiment-analysis-s25)
- [Learning Paths (S2.6)](#learning-paths-s26)

---

## Role Templates (S2.1)

### Create Role Profile

```bash
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Senior Data Scientist",
    "department": "Data Science",
    "seniority": "SENIOR",
    "description": "Lead data science initiatives and mentor junior team members",
    "competencies": [
      {
        "competencyId": "COMPETENCY_ID_1",
        "requiredLevelId": "LEVEL_ID_ADVANCED",
        "isMandatory": true
      },
      {
        "competencyId": "COMPETENCY_ID_2",
        "requiredLevelId": "LEVEL_ID_EXPERT",
        "isMandatory": true
      }
    ]
  }'
```

### List Role Profiles

```bash
# All roles
curl "http://localhost:3000/api/v1/roles" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by department
curl "http://localhost:3000/api/v1/roles?department=Engineering" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by seniority
curl "http://localhost:3000/api/v1/roles?seniority=SENIOR" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Role Profile by ID

```bash
curl "http://localhost:3000/api/v1/roles/ROLE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Senior Data Scientist",
    "department": "Data Science",
    "seniority": "SENIOR",
    "description": "Lead data science initiatives...",
    "version": 1,
    "roleCompetencies": [
      {
        "competency": {
          "id": "uuid",
          "name": "Machine Learning",
          "type": "TECHNICAL"
        },
        "level": {
          "id": "uuid",
          "name": "Advanced",
          "numericLevel": 3
        },
        "isMandatory": true
      }
    ]
  }
}
```

### Update Role Profile (Creates New Version)

```bash
curl -X PUT "http://localhost:3000/api/v1/roles/ROLE_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "description": "Updated role description",
    "competencies": [
      {
        "competencyId": "NEW_COMPETENCY_ID",
        "requiredLevelId": "NEW_LEVEL_ID",
        "isMandatory": true
      }
    ]
  }'
```

### Clone Role Profile

```bash
curl -X POST "http://localhost:3000/api/v1/roles/ROLE_ID/clone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "newTitle": "Lead Data Scientist"
  }'
```

---

## Goal/OKR Suggestions (S2.2)

### Suggest Goals for a Role

**Use Case**: AI generates SMART goals or OKRs based on role requirements and context.

```bash
curl -X POST http://localhost:3000/api/v1/workflows/goals/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roleProfileId": "ROLE_PROFILE_ID",
    "context": {
      "performanceData": "Q3 performance: 85% task completion, strong technical skills, needs improvement in stakeholder communication",
      "careerAspirations": "Interested in moving into technical leadership role within 12 months",
      "recentFeedback": "Excellent problem solver but could delegate more effectively"
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "title": "Improve Stakeholder Communication Skills",
      "description": "Develop effective communication strategies with non-technical stakeholders by presenting technical concepts in accessible language and conducting monthly stakeholder updates",
      "type": "SMART",
      "targetMetric": "Stakeholder satisfaction score",
      "targetValue": "4.5/5.0",
      "timeframe": "Q1 2025",
      "priority": "HIGH"
    },
    {
      "title": "Build Team Leadership Capabilities",
      "description": "Prepare for technical leadership by mentoring 2 junior engineers and leading a cross-functional project initiative",
      "type": "OKR",
      "keyResults": [
        "Mentor 2 junior engineers for 6 months with measurable skill improvements",
        "Lead 1 cross-functional project with 5+ team members",
        "Complete leadership training program"
      ],
      "timeframe": "6 months",
      "priority": "HIGH"
    },
    {
      "title": "Enhance Delegation Effectiveness",
      "description": "Improve delegation skills by identifying and distributing 30% of current workload to team members while maintaining quality standards",
      "type": "SMART",
      "targetMetric": "Work delegation percentage",
      "targetValue": "30% of workload delegated",
      "timeframe": "Q2 2025",
      "priority": "MEDIUM"
    }
  ],
  "message": "Goals suggested successfully"
}
```

---

## Skill Gap Detection (S2.3)

### Detect Skill Gaps

**Use Case**: Compare employee's current skill levels against role requirements.

```bash
curl -X POST http://localhost:3000/api/v1/workflows/skill-gaps/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_USER_ID",
    "roleProfileId": "TARGET_ROLE_PROFILE_ID"
  }'
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "competencyId": "uuid",
      "competencyName": "Leadership",
      "currentLevel": 2,
      "requiredLevel": 4,
      "gap": 2,
      "priority": "CRITICAL",
      "recommendations": [
        "Enroll in formal leadership training program (e.g., Harvard ManageMentor, LinkedIn Learning Leadership Foundations)",
        "Shadow a senior leader for 3 months to observe leadership in action",
        "Lead a small cross-functional project to practice leadership skills in a controlled environment",
        "Find a leadership mentor within the organization for monthly 1:1 coaching sessions"
      ]
    },
    {
      "competencyId": "uuid",
      "competencyName": "Strategic Thinking",
      "currentLevel": 3,
      "requiredLevel": 4,
      "gap": 1,
      "priority": "HIGH",
      "recommendations": [
        "Participate in quarterly strategic planning sessions as an observer and contributor",
        "Read key business strategy books (e.g., 'Good Strategy Bad Strategy', 'Playing to Win')",
        "Present a strategic initiative proposal to senior leadership",
        "Take on a project that requires long-term strategic planning (6-12 months)"
      ]
    }
  ],
  "message": "Skill gaps detected successfully"
}
```

---

## Individual Development Plans (S2.4)

### Generate IDP

**Use Case**: Create a comprehensive development plan based on skill gaps.

```bash
curl -X POST http://localhost:3000/api/v1/workflows/idp/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_USER_ID",
    "options": {
      "skillGaps": [
        {
          "competencyId": "uuid",
          "competencyName": "Leadership",
          "currentLevel": 2,
          "requiredLevel": 4,
          "gap": 2,
          "priority": "CRITICAL"
        }
      ],
      "careerGoals": "Become a Senior Engineering Manager within 18 months",
      "timeframe": "12 months",
      "focusAreas": ["Leadership", "Strategic Thinking", "Team Building"]
    }
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Leadership Development Plan - Path to Senior Engineering Manager",
    "description": "Comprehensive 12-month development plan focused on building leadership, strategic thinking, and team building capabilities to prepare for Senior Engineering Manager role",
    "actions": [
      {
        "action": "Complete formal leadership training program",
        "type": "Training",
        "competency": "Leadership",
        "timeline": "Months 1-3",
        "resources": "Harvard ManageMentor, LinkedIn Learning Leadership Foundations, $1,500 training budget",
        "successMetrics": "Certificate completion, 90% attendance, implementation of 3 learned techniques"
      },
      {
        "action": "Lead cross-functional initiative",
        "type": "On-the-job",
        "competency": "Leadership",
        "timeline": "Months 3-9",
        "resources": "Project team of 5-7 members, executive sponsor support, weekly coaching sessions",
        "successMetrics": "Project delivery on time/budget, team engagement score >4.0/5.0, stakeholder satisfaction >85%"
      },
      {
        "action": "Establish mentorship relationship with senior leader",
        "type": "Mentoring",
        "competency": "Strategic Thinking",
        "timeline": "Months 1-12",
        "resources": "1 hour bi-weekly mentoring sessions, access to leadership meetings",
        "successMetrics": "12 mentoring sessions completed, quarterly reflection reviews, mentor endorsement"
      },
      {
        "action": "Build and lead study group on strategic management",
        "type": "Self-study",
        "competency": "Strategic Thinking",
        "timeline": "Months 4-12",
        "resources": "Reading list (5 key strategy books), meeting space, 4-6 participants",
        "successMetrics": "Monthly discussions held, strategic framework presentation to leadership"
      },
      {
        "action": "Mentor 2 junior engineers",
        "type": "On-the-job",
        "competency": "Team Building",
        "timeline": "Months 2-12",
        "resources": "Bi-weekly 1:1 time, performance tracking tools",
        "successMetrics": "Mentees show measurable skill improvement, positive feedback from mentees, documented growth plans"
      }
    ],
    "milestones": [
      {
        "milestone": "Complete leadership training foundation",
        "date": "End of Month 3",
        "deliverable": "Training certificate and action plan"
      },
      {
        "milestone": "Successfully initiate cross-functional project",
        "date": "End of Month 4",
        "deliverable": "Project charter, team assembled, kickoff complete"
      },
      {
        "milestone": "Mid-year review with mentor and manager",
        "date": "Month 6",
        "deliverable": "Progress assessment, refined action plan"
      },
      {
        "milestone": "Deliver cross-functional project",
        "date": "Month 9",
        "deliverable": "Completed project, retrospective, lessons learned"
      },
      {
        "milestone": "Final assessment and promotion readiness review",
        "date": "Month 12",
        "deliverable": "Competency assessment, promotion case presentation"
      }
    ],
    "supportNeeded": [
      "Manager approval for training budget ($1,500)",
      "Time allocation: 4-5 hours/week for development activities",
      "Access to senior leader as mentor",
      "Opportunity to lead cross-functional project",
      "Regular feedback and coaching from manager",
      "Participation in leadership meetings as observer"
    ]
  },
  "message": "IDP generated successfully"
}
```

### Save IDP to Database

```bash
curl -X POST http://localhost:3000/api/v1/workflows/idp/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_USER_ID",
    "title": "Leadership Development Plan",
    "description": "12-month plan to develop leadership capabilities",
    "actions": [...],
    "startDate": "2025-01-01",
    "targetDate": "2025-12-31"
  }'
```

---

## Sentiment Analysis (S2.5)

### Analyze Multiple Feedback Items

**Use Case**: Extract sentiment and themes from multiple pieces of feedback.

```bash
curl -X POST http://localhost:3000/api/v1/workflows/feedback/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "feedbackTexts": [
      "Sarah consistently delivers high-quality code and meets all deadlines. Her technical skills are exceptional.",
      "While Sarah is technically strong, she could improve her communication with non-technical stakeholders.",
      "Great team player, always willing to help colleagues. However, documentation could be more thorough.",
      "Sarah took initiative on the refactoring project and led it successfully. Communication has improved over the quarter.",
      "Excellent problem-solving abilities. Sometimes takes on too much work and should delegate more."
    ]
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "overallSentiment": "POSITIVE",
    "themes": [
      "Technical Excellence",
      "Communication Skills",
      "Team Collaboration",
      "Leadership & Initiative",
      "Work Distribution"
    ],
    "strengths": [
      "High-quality code delivery",
      "Exceptional technical skills",
      "Strong problem-solving abilities",
      "Team collaboration and willingness to help",
      "Taking initiative on projects",
      "Meeting deadlines consistently"
    ],
    "areasForImprovement": [
      "Communication with non-technical stakeholders",
      "Documentation thoroughness",
      "Work delegation and distribution"
    ],
    "sentimentBreakdown": {
      "positive": 70,
      "neutral": 20,
      "negative": 10
    },
    "commonKeywords": [
      "technical",
      "communication",
      "team",
      "quality",
      "initiative",
      "documentation",
      "delegation"
    ]
  },
  "message": "Feedback analyzed successfully"
}
```

### Analyze Feedback for Specific Employee

```bash
curl "http://localhost:3000/api/v1/workflows/feedback/analyze/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This will fetch all recent feedback for the employee and analyze it.

---

## Learning Paths (S2.6)

### Suggest Learning Path for Competency

**Use Case**: Get a structured learning path to develop a specific competency.

```bash
curl -X POST http://localhost:3000/api/v1/workflows/learning-path/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "competencyId": "COMPETENCY_ID",
    "currentLevel": 2,
    "targetLevel": 4
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "title": "Leadership Development Path: Intermediate to Advanced",
    "description": "Structured learning journey to develop leadership skills from Intermediate (Level 2) to Advanced (Level 4) over 9-12 months",
    "estimatedDuration": "9-12 months",
    "phases": [
      {
        "phase": "Foundation Building",
        "level": 2.5,
        "duration": "2-3 months",
        "activities": [
          "Complete online leadership fundamentals course (LinkedIn Learning, Coursera)",
          "Read 3 foundational leadership books (Start with Why, Leaders Eat Last, Dare to Lead)",
          "Attend 2 leadership workshops or webinars",
          "Shadow a senior leader for 4 weeks",
          "Lead 2-3 team meetings"
        ],
        "resources": [
          "LinkedIn Learning Premium subscription",
          "Leadership book budget ($50-75)",
          "Workshop registration fees ($200-500)",
          "Calendar time with senior leader"
        ],
        "assessments": [
          "Complete leadership style assessment (DISC, StrengthsFinder)",
          "Get 360-degree feedback from 5 colleagues",
          "Manager evaluation of meeting leadership"
        ]
      },
      {
        "phase": "Skill Application",
        "level": 3,
        "duration": "3-4 months",
        "activities": [
          "Lead a medium-sized project (3-6 team members)",
          "Mentor 1-2 junior team members",
          "Present at departmental meeting or all-hands",
          "Handle a difficult team situation with manager coaching",
          "Participate in hiring process (interviews, decisions)"
        ],
        "resources": [
          "Project assignment with clear scope",
          "Manager coaching (bi-weekly check-ins)",
          "Access to HR for hiring process training"
        ],
        "assessments": [
          "Project retrospective with team",
          "Mentee satisfaction survey",
          "Presentation feedback from leadership",
          "Manager quarterly review"
        ]
      },
      {
        "phase": "Advanced Practice",
        "level": 3.5,
        "duration": "2-3 months",
        "activities": [
          "Lead cross-functional initiative (multiple teams)",
          "Develop and present strategic proposal to leadership",
          "Handle performance management scenario (with HR support)",
          "Coach another leader or aspiring leader",
          "Contribute to department strategy discussions"
        ],
        "resources": [
          "Cross-functional project opportunity",
          "Executive sponsor support",
          "HR partnership for performance scenarios",
          "Access to strategic planning meetings"
        ],
        "assessments": [
          "360-degree feedback (expanded group)",
          "Leadership competency assessment by manager",
          "Stakeholder feedback on cross-functional project",
          "Self-reflection and growth plan update"
        ]
      },
      {
        "phase": "Mastery & Independence",
        "level": 4,
        "duration": "2-3 months",
        "activities": [
          "Lead large-scale initiative independently",
          "Develop team strategy and roadmap",
          "Handle complex people situations autonomously",
          "Mentor other leaders",
          "Contribute to organizational leadership practices"
        ],
        "resources": [
          "Large project with full ownership",
          "Budget authority (if applicable)",
          "Peer leadership network",
          "Executive coaching (optional)"
        ],
        "assessments": [
          "Final competency evaluation",
          "Team engagement and performance metrics",
          "Leadership impact assessment",
          "Promotion/advancement discussion"
        ]
      }
    ],
    "quickWins": [
      "Volunteer to lead the next sprint planning or retrospective",
      "Schedule 1:1s with each team member to understand their goals and challenges",
      "Create a team vision statement with input from all members"
    ],
    "longTermActivities": [
      "Maintain regular 1:1s with direct reports or mentees",
      "Continuously seek feedback on leadership approach",
      "Stay current with leadership books, podcasts, and content",
      "Build and maintain professional network of peer leaders",
      "Reflect quarterly on leadership growth and adjust approach"
    ]
  },
  "message": "Learning path suggested successfully"
}
```

---

## Complete Workflow Example

### End-to-End Employee Development Workflow

**Scenario**: New employee needs development plan for promotion.

```bash
# Step 1: Detect skill gaps
curl -X POST http://localhost:3000/api/v1/workflows/skill-gaps/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "roleProfileId": "TARGET_ROLE_ID"
  }' > skill-gaps.json

# Step 2: Analyze recent feedback
curl "http://localhost:3000/api/v1/workflows/feedback/analyze/EMPLOYEE_ID" \
  -H "Authorization: Bearer YOUR_TOKEN" > feedback-analysis.json

# Step 3: Generate IDP with gaps and feedback
curl -X POST http://localhost:3000/api/v1/workflows/idp/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "employeeId": "EMPLOYEE_ID",
    "options": {
      "skillGaps": [GAPS_FROM_STEP_1],
      "timeframe": "12 months",
      "careerGoals": "Promotion to senior role"
    }
  }' > idp.json

# Step 4: Suggest goals aligned with IDP
curl -X POST http://localhost:3000/api/v1/workflows/goals/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "roleProfileId": "TARGET_ROLE_ID",
    "context": {
      "careerAspirations": "Promotion to senior role within 12 months"
    }
  }' > goals.json

# Step 5: Get learning paths for each gap
for COMPETENCY_ID in $(jq -r '.[].competencyId' skill-gaps.json); do
  curl -X POST http://localhost:3000/api/v1/workflows/learning-path/suggest \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -d "{
      \"competencyId\": \"$COMPETENCY_ID\",
      \"currentLevel\": 2,
      \"targetLevel\": 4
    }" > "learning-path-$COMPETENCY_ID.json"
done

# Step 6: Save IDP to database
curl -X POST http://localhost:3000/api/v1/workflows/idp/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @idp.json
```

---

## Integration with Stage 1 Features

Stage 2 workflows can be combined with Stage 1 AI features:

```bash
# Create role from JD (Stage 1)
curl -X POST http://localhost:3000/api/v1/ai/competencies/suggest-from-jd \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...JD data...}'

# Create role profile with suggested competencies (Stage 2)
curl -X POST http://localhost:3000/api/v1/roles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...role data with competencies...}'

# Detect gaps for employee against new role (Stage 2)
curl -X POST http://localhost:3000/api/v1/workflows/skill-gaps/detect \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{...}'
```

---

## Rate Limits

Stage 2 AI workflows use the same rate limiting as Stage 1:
- 60 AI requests per minute
- Adjust in `.env` if needed for testing

---

## Next Steps

- Test all Stage 2 endpoints
- Integrate with your frontend
- Customize AI prompts in database
- Set up monitoring for workflow usage
- Plan for Stage 3 implementation

---

## Support

For issues with Stage 2 features:
1. Check logs for AI service errors
2. Verify role profiles and competencies are set up
3. Ensure employee skill profiles exist
4. Review API examples in this document
5. Open GitHub issue with details
