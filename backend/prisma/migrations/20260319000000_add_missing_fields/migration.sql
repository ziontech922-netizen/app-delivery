-- AlterTable
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "image_url" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "original_price" DECIMAL(10, 2);
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "preparation_time" INTEGER NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "merchant_reply" TEXT;
ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "merchant_replied_at" TIMESTAMP(3);
