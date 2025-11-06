-- Deduplicate competencies before adding unique constraint
-- This migration removes duplicate competencies, keeping only the oldest one

-- Step 1: Create a temporary table with competencies to keep (oldest ones)
CREATE TEMP TABLE competencies_to_keep AS
SELECT DISTINCT ON (name, tenant_id) id
FROM competencies
ORDER BY name, tenant_id, created_at ASC;

-- Step 2: Update related tables to point to the kept competencies
-- Update role_competencies
UPDATE role_competencies rc
SET competency_id = (
  SELECT ctk.id
  FROM competencies_to_keep ctk
  JOIN competencies c ON c.id = ctk.id
  JOIN competencies c_old ON c_old.id = rc.competency_id
  WHERE c.name = c_old.name AND c.tenant_id = c_old.tenant_id
  LIMIT 1
)
WHERE rc.competency_id NOT IN (SELECT id FROM competencies_to_keep);

-- Update skill_profiles
UPDATE skill_profiles sp
SET competency_id = (
  SELECT ctk.id
  FROM competencies_to_keep ctk
  JOIN competencies c ON c.id = ctk.id
  JOIN competencies c_old ON c_old.id = sp.competency_id
  WHERE c.name = c_old.name AND c.tenant_id = c_old.tenant_id
  LIMIT 1
)
WHERE sp.competency_id NOT IN (SELECT id FROM competencies_to_keep);

-- Update embedding_vectors
UPDATE embedding_vectors ev
SET entity_id = (
  SELECT ctk.id
  FROM competencies_to_keep ctk
  JOIN competencies c ON c.id = ctk.id
  JOIN competencies c_old ON c_old.id = ev.entity_id::uuid
  WHERE c.name = c_old.name AND c.tenant_id = c_old.tenant_id
  AND ev.entity_type = 'COMPETENCY'
  LIMIT 1
)
WHERE ev.entity_type = 'COMPETENCY'
AND ev.entity_id::uuid NOT IN (SELECT id FROM competencies_to_keep);

-- Step 3: Delete proficiency levels for duplicate competencies
DELETE FROM proficiency_levels
WHERE competency_id NOT IN (SELECT id FROM competencies_to_keep);

-- Step 4: Delete behavioral indicators for duplicate competencies
DELETE FROM behavioral_indicators
WHERE competency_id NOT IN (SELECT id FROM competencies_to_keep);

-- Step 5: Delete duplicate competencies
DELETE FROM competencies
WHERE id NOT IN (SELECT id FROM competencies_to_keep);

-- Step 6: Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_competency_per_tenant
ON competencies(name, tenant_id);
