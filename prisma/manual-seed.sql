-- Manual seed script for Railway PostgreSQL
-- Run this in Railway's PostgreSQL console if auto-seed doesn't work

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create demo tenant
INSERT INTO "Tenant" (id, name, slug, settings, "createdAt", "updatedAt")
VALUES (
  uuid_generate_v4(),
  'Demo Organization',
  'demo',
  '{"features":{"ai":true}}'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING
RETURNING id;

-- Note the tenant ID from above, then create admin user
-- Replace <TENANT_ID> with the actual ID from the query above
INSERT INTO "User" (id, email, "tenantId", "passwordHash", "firstName", "lastName", role, "aiOptOut", "createdAt", "updatedAt")
VALUES (
  uuid_generate_v4(),
  'admin@demo.com',
  '<TENANT_ID>',  -- REPLACE THIS
  '$2b$10$YourHashedPasswordHere',  -- SecurePass123! hashed
  'Admin',
  'User',
  'admin',
  false,
  NOW(),
  NOW()
);

-- Verify
SELECT * FROM "Tenant";
SELECT id, email, "firstName", "lastName", role FROM "User";
