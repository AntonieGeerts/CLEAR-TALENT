-- Ensure all CompetencyType enum values exist
-- This migration adds any missing values to the enum

-- Add CORE (for new competency model)
ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'CORE';

-- Add LEADERSHIP (should already exist, but ensuring it's there)
ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'LEADERSHIP';

-- Add FUNCTIONAL (should already exist, but ensuring it's there)
ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'FUNCTIONAL';

-- Add TECHNICAL (should already exist, but ensuring it's there)
ALTER TYPE "CompetencyType" ADD VALUE IF NOT EXISTS 'TECHNICAL';

-- Note: BEHAVIORAL may exist in older databases
-- It is being deprecated in favor of CORE
-- To migrate existing BEHAVIORAL competencies:
-- UPDATE competencies SET type = 'CORE' WHERE type = 'BEHAVIORAL';
