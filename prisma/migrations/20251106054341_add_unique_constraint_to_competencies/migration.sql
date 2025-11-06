-- Deduplicate competencies and add unique constraint
-- This migration keeps the oldest competency for each (name, tenant_id) pair

DO $$
DECLARE
  dup RECORD;
  keep_id UUID;
  del_id UUID;
BEGIN
  -- Process each set of duplicates
  FOR dup IN
    SELECT name, tenant_id
    FROM competencies
    GROUP BY name, tenant_id
    HAVING COUNT(*) > 1
  LOOP
    -- Get the oldest competency to keep
    SELECT id INTO keep_id
    FROM competencies
    WHERE name = dup.name AND tenant_id = dup.tenant_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- Update and delete each duplicate
    FOR del_id IN (
      SELECT id
      FROM competencies
      WHERE name = dup.name
        AND tenant_id = dup.tenant_id
        AND id != keep_id
    )
    LOOP
      -- Safely handle foreign key references
      BEGIN
        -- Update role_competencies to point to the kept competency
        UPDATE role_competencies
        SET competency_id = keep_id
        WHERE competency_id = del_id.id;

        -- Update skill_profiles
        UPDATE skill_profiles
        SET competency_id = keep_id
        WHERE competency_id = del_id.id;

        -- Update embedding_vectors
        UPDATE embedding_vectors
        SET entity_id = keep_id::text
        WHERE entity_type = 'COMPETENCY' AND entity_id = del_id.id::text;

      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue (tables might not exist in all environments)
        RAISE NOTICE 'Could not update references for %: %', del_id.id, SQLERRM;
      END;

      -- Delete child records (cascade should handle this, but being explicit)
      DELETE FROM proficiency_levels WHERE competency_id = del_id.id;
      DELETE FROM behavioral_indicators WHERE competency_id = del_id.id;

      -- Delete the duplicate competency
      DELETE FROM competencies WHERE id = del_id.id;

      RAISE NOTICE 'Removed duplicate competency % (kept %)', del_id.id, keep_id;
    END LOOP;
  END LOOP;
END $$;

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_competency_per_tenant
ON competencies(name, tenant_id);
