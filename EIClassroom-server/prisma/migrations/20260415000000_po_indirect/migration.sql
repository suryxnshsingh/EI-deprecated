-- Add indirect PO columns to PO table
ALTER TABLE "PO" ADD COLUMN IF NOT EXISTS "indirectMatrix" JSONB;
ALTER TABLE "PO" ADD COLUMN IF NOT EXISTS "indirectAverage" JSONB;
