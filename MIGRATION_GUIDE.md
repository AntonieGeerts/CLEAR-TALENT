# Database Migration Guide

## Pending Migrations

There are 3 pending migrations that need to be applied to the production database:

1. `20251106_add_competency_questions` - Creates the competency_questions table
2. `20251106_add_scoring_systems` - Creates scoring_systems table and adds scoring fields
3. `20251106_add_proficiency_level_to_questions` - Links questions to proficiency levels

## Running Migrations on Railway

### Option 1: Via Railway CLI (Recommended)

```bash
# Link to your Railway project (if not already linked)
railway link

# Select the backend service when prompted

# Run migrations
railway run npx prisma migrate deploy
```

### Option 2: Via Railway Dashboard

1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to "Settings" → "Variables"
4. Copy the `DATABASE_URL` value
5. Run locally with that database URL:

```bash
DATABASE_URL="<paste-url-here>" npx prisma migrate deploy
```

### Option 3: Via Railway Shell

1. Go to Railway dashboard → Your backend service
2. Click on "Deploy" → "Shell"
3. Run: `npx prisma migrate deploy`

## Updated Question Structure

### New Fields in CompetencyQuestion

Based on your Excel structure, questions now support:

1. **Proficiency Level Link** (`proficiencyLevelId`)
   - Questions can be organized by proficiency level (Basic, Proficient, Advanced, Expert)
   - Each question is associated with a specific proficiency level

2. **Rating Options** (`ratingOptions`)
   - Stores the 4 standardized options for each question
   - Default structure:
   ```json
   {
     "1": "Never Demonstrated",
     "2": "Sometimes Demonstrated",
     "3": "Consistently Demonstrated",
     "4": "Consistently Demonstrated + shows evidence of higher level application"
   }
   ```

3. **Behavior Indicator** (`statement`)
   - The main question text describing the expected behavior

### Excel Import Structure

Your Excel sheets should map to:

**Sheet per Competency → Tabs per Proficiency Level**

Example for "Effective Communication" competency:

**Tab: Basic**
| Behavior Indicator | Option 1 | Option 2 | Option 3 | Option 4 |
|-------------------|----------|----------|----------|----------|
| Keeps immediate superiors informed... | Never | Sometimes | Consistently | Consistently + higher |

## After Migration

Once migrations are complete:

1. Verify tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('competency_questions', 'scoring_systems');
```

2. Check the seed data loaded:
```sql
SELECT COUNT(*) FROM scoring_systems;
-- Should return 6 (the default scoring systems)
```

3. The frontend question modal will now display:
   - Scoring system selector
   - Questions organized by proficiency level
   - 4-option rating scale per question
