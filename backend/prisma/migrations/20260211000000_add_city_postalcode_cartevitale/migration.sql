-- AlterTable
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "city" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "postalCode" TEXT;
ALTER TABLE "Professional" ADD COLUMN IF NOT EXISTS "carteVitaleUrl" TEXT;

-- Update default radius from 20 to 10
ALTER TABLE "Professional" ALTER COLUMN "radius" SET DEFAULT 10;
