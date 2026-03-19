-- Fix failed migration
DELETE FROM _prisma_migrations WHERE migration_name = '20260311000000_add_push_token';

-- Add push_token columns if they don't exist  
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_token" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_token_updated_at" TIMESTAMP(3);
