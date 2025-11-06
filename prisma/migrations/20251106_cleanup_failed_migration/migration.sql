-- Clean up failed migration record
-- This removes the failed migration record that's blocking subsequent migrations

DELETE FROM "_prisma_migrations"
WHERE migration_name = '20251106054341_add_unique_constraint_to_competencies';
