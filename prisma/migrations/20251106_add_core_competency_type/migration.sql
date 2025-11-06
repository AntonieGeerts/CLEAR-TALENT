-- Add CORE competency type and reorder enum
-- AlterEnum adds new value and reorders the enum

ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'CORE';

-- Note: BEHAVIORAL is being deprecated in favor of CORE
-- Existing BEHAVIORAL competencies can be migrated with:
-- UPDATE competencies SET type = 'CORE' WHERE type = 'BEHAVIORAL';
