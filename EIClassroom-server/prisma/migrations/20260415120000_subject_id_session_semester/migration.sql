-- Migration: introduce Subject.id PK, add session/semester, switch all child FKs from subjectCode to subjectId.
-- Existing rows are backfilled with session='2025-26', semester=4.
-- Prisma wraps the file in its own transaction; do not add explicit BEGIN/COMMIT.

-- 1. Subject: add id, session, semester (nullable for backfill)
ALTER TABLE "Subject" ADD COLUMN "id" SERIAL;
ALTER TABLE "Subject" ADD COLUMN "session" TEXT;
ALTER TABLE "Subject" ADD COLUMN "semester" INTEGER;

UPDATE "Subject" SET "session" = '2025-26' WHERE "session" IS NULL;
UPDATE "Subject" SET "semester" = 4 WHERE "semester" IS NULL;

ALTER TABLE "Subject" ALTER COLUMN "session" SET NOT NULL;
ALTER TABLE "Subject" ALTER COLUMN "semester" SET NOT NULL;

-- 2. Add subjectId to all child tables (nullable for backfill)
ALTER TABLE "Sheet"  ADD COLUMN "subjectId" INTEGER;
ALTER TABLE "CO"     ADD COLUMN "subjectId" INTEGER;
ALTER TABLE "Levels" ADD COLUMN "subjectId" INTEGER;
ALTER TABLE "PO"     ADD COLUMN "subjectId" INTEGER;

-- 3. Backfill subjectId by joining on subjectCode -> Subject.code
UPDATE "Sheet"  c SET "subjectId" = s."id" FROM "Subject" s WHERE c."subjectCode" = s."code";
UPDATE "CO"     c SET "subjectId" = s."id" FROM "Subject" s WHERE c."subjectCode" = s."code";
UPDATE "Levels" c SET "subjectId" = s."id" FROM "Subject" s WHERE c."subjectCode" = s."code";
UPDATE "PO"     c SET "subjectId" = s."id" FROM "Subject" s WHERE c."subjectCode" = s."code";

ALTER TABLE "Sheet"  ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "CO"     ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "Levels" ALTER COLUMN "subjectId" SET NOT NULL;
ALTER TABLE "PO"     ALTER COLUMN "subjectId" SET NOT NULL;

-- 4. Drop existing FK constraints that reference Subject(code)
ALTER TABLE "Sheet"  DROP CONSTRAINT IF EXISTS "Sheet_subjectCode_fkey";
ALTER TABLE "CO"     DROP CONSTRAINT IF EXISTS "CO_subjectCode_fkey";
ALTER TABLE "Levels" DROP CONSTRAINT IF EXISTS "Levels_subjectCode_fkey";
ALTER TABLE "PO"     DROP CONSTRAINT IF EXISTS "PO_subjectCode_fkey";

-- 5. Drop old PKs
ALTER TABLE "Sheet"   DROP CONSTRAINT "Sheet_pkey";
ALTER TABLE "CO"      DROP CONSTRAINT "CO_pkey";
ALTER TABLE "Levels"  DROP CONSTRAINT "Levels_pkey";
ALTER TABLE "PO"      DROP CONSTRAINT "PO_pkey";
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_pkey";

-- 6. Promote Subject.id to PK
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_pkey" PRIMARY KEY ("id");

-- 7. Add own id PKs to CO, Levels, PO (1:1 with Subject via unique subjectId)
ALTER TABLE "CO"     ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER TABLE "Levels" ADD COLUMN "id" SERIAL PRIMARY KEY;
ALTER TABLE "PO"     ADD COLUMN "id" SERIAL PRIMARY KEY;

CREATE UNIQUE INDEX "CO_subjectId_key"     ON "CO"("subjectId");
CREATE UNIQUE INDEX "Levels_subjectId_key" ON "Levels"("subjectId");
CREATE UNIQUE INDEX "PO_subjectId_key"     ON "PO"("subjectId");

-- 8. New composite PK for Sheet (id, subjectId)
ALTER TABLE "Sheet" ADD CONSTRAINT "Sheet_pkey" PRIMARY KEY ("id", "subjectId");

-- 9. Drop now-redundant subjectCode columns
ALTER TABLE "Sheet"  DROP COLUMN "subjectCode";
ALTER TABLE "CO"     DROP COLUMN "subjectCode";
ALTER TABLE "Levels" DROP COLUMN "subjectCode";
ALTER TABLE "PO"     DROP COLUMN "subjectCode";

-- 10. Add new FKs on subjectId
ALTER TABLE "Sheet"  ADD CONSTRAINT "Sheet_subjectId_fkey"  FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CO"     ADD CONSTRAINT "CO_subjectId_fkey"     FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Levels" ADD CONSTRAINT "Levels_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PO"     ADD CONSTRAINT "PO_subjectId_fkey"     FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 11. Composite uniqueness on Subject (replaces the old code-as-PK uniqueness)
CREATE UNIQUE INDEX "Subject_code_session_semester_teacherId_key"
  ON "Subject"("code", "session", "semester", "teacherId");
