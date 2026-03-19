-- AlterTable: Add push notification token fields to users
ALTER TABLE "users" ADD COLUMN "push_token" TEXT;
ALTER TABLE "users" ADD COLUMN "push_token_updated_at" TIMESTAMP(3);
