# Migration Guide: Fix Duplicate Competencies

## Problem

The competencies table was missing a unique constraint on `(name, tenantId)`, which allowed duplicate competencies with the same name to be created for the same tenant. This caused:

- Duplicate entries appearing on the `/competencies` page
- Potential data inconsistencies
- Confusion for users managing competencies

## Solution

This migration adds a unique constraint to prevent duplicate competencies and includes scripts to clean up existing duplicates.

## Migration Steps

### Step 1: Backup Your Database

Before running any migration, **always backup your database**:

```bash
# For Railway/Heroku PostgreSQL
# Export via your hosting provider's dashboard or CLI

# For local development
pg_dump -U your_user -d clear_talent > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 2: Run the Deduplication Script (Recommended)

**Important:** Run this script **before** applying the migration to avoid constraint violations.

```bash
# Install dependencies if needed
npm install

# Run the deduplication script
npx ts-node scripts/deduplicate-competencies.ts
```

This script will:
- Find all duplicate competencies (same name + tenantId)
- Keep the oldest competency for each duplicate set
- Update all references to point to the kept competency
- Delete duplicate competencies and their related data

### Step 3: Apply the Database Migration

Option A: Using Prisma Migrate (Recommended for production)

```bash
# Generate Prisma client with new schema
npx prisma generate

# Apply the migration
npx prisma migrate deploy
```

Option B: Manual SQL Migration

If you prefer to run the SQL directly:

```bash
# Connect to your database
psql $DATABASE_URL

# Run the migration
\i prisma/migrations/20251106054341_add_unique_constraint_to_competencies/migration.sql
```

### Step 4: Verify the Migration

Check that the unique constraint was added successfully:

```sql
-- Check the constraint exists
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'competencies'::regclass
AND conname = 'unique_competency_per_tenant';

-- Check for any remaining duplicates (should return 0 rows)
SELECT name, tenant_id, COUNT(*)
FROM competencies
GROUP BY name, tenant_id
HAVING COUNT(*) > 1;
```

### Step 5: Update Application Code

The application code has been updated to:

1. **Schema**: Added `@@unique([name, tenantId])` constraint to the Competency model
2. **Seed Script**: Now checks for existing competencies before creating new ones
3. **API**: Will automatically reject attempts to create duplicate competencies

After deploying:

```bash
# Build the backend
npm run build

# Restart your application
# (Railway/Vercel will auto-deploy on push)
```

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Remove the unique constraint
DROP INDEX IF EXISTS unique_competency_per_tenant;
```

Then revert the schema changes in `prisma/schema.prisma`.

## Testing

After migration, test the following:

1. ✅ View `/competencies` page - no duplicates should appear
2. ✅ Try to create a competency with an existing name - should fail with error
3. ✅ Create a competency with a new name - should succeed
4. ✅ Run the seed script multiple times - should not create duplicates

## Troubleshooting

### Issue: Migration fails with "duplicate key value"

**Solution**: Run the deduplication script first (Step 2)

```bash
npx ts-node scripts/deduplicate-competencies.ts
```

### Issue: Foreign key constraint violation during deduplication

**Solution**: The deduplication script handles this automatically by updating references first. If you still see errors, check for:
- Custom foreign keys not covered by the script
- Concurrent writes during migration

### Issue: Lost proficiency levels after deduplication

**Expected**: When duplicates are removed, only the proficiency levels for the kept competency remain. Review the deduplication script output to see which competencies were kept.

**Solution**: If needed, manually recreate proficiency levels for the kept competencies using the UI or API.

## Files Changed

- `prisma/schema.prisma` - Added unique constraint
- `prisma/seed.ts` - Updated to check for existing competencies
- `scripts/deduplicate-competencies.ts` - New deduplication script
- `prisma/migrations/20251106054341_add_unique_constraint_to_competencies/migration.sql` - Database migration

## Support

If you encounter issues during migration, please:

1. Check the logs from the deduplication script
2. Verify your database backup is available
3. Contact the development team with:
   - Error messages
   - Number of duplicates found
   - Database provider (PostgreSQL version)
