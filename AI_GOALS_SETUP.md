# AI Organizational Goals Setup

## Issue: 500 Error on Strategic Goals Generation

If you're getting a 500 error when trying to generate strategic goals, it's likely because the AI prompt template is missing from the database.

### Quick Fix

Run this command on your Railway instance:

```bash
npm run add-goal-template
```

Or manually:

```bash
npx tsx scripts/add-goal-prompt-template.ts
```

### What This Does

This script adds the "Generate Strategic Goals with BSC" prompt template to your database. The template is required for the AI to generate:
- Strategic organizational goals
- Balanced Scorecard perspectives (Financial, Customer, Internal Process, Learning & Growth)
- KPIs with targets and measurement frequency

### Why Is This Needed?

When deploying to production, the database isn't automatically reseeded. This script safely adds only the new goal generation template without affecting existing data.

### Verify It Worked

After running the script, you should see:
```
✓ Template already exists: Generate Strategic Goals with BSC
```
or
```
✅ Successfully created template: Generate Strategic Goals with BSC
```

Then try generating goals again in the UI!

### Alternative: Full Reseed (Not Recommended for Production)

If you want to reseed the entire database (⚠️ **WARNING: This will reset ALL data**):

```bash
npm run prisma:seed
```

**Only do this in development environments!**

### Troubleshooting

**Still getting errors?**

1. **Check OpenAI API Key**: Ensure `OPENAI_API_KEY` is set in your Railway environment variables
2. **Check Database Connection**: Ensure `DATABASE_URL` is correct
3. **Check Logs**: Look at Railway logs for detailed error messages
4. **Verify Template**: Connect to your database and check if the template exists:
   ```sql
   SELECT * FROM ai_prompt_templates WHERE module = 'GOAL';
   ```

### Future Deployments

This template is now included in the seed script, so future fresh deployments will have it automatically.
