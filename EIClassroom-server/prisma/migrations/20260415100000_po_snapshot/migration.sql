-- CreateTable
CREATE TABLE "POSnapshot" (
    "id" SERIAL NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "directAverage" JSONB NOT NULL,
    "indirectAverage" JSONB NOT NULL,
    "overallAverage" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "POSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "POSnapshot_subjectId_key" ON "POSnapshot"("subjectId");

-- AddForeignKey
ALTER TABLE "POSnapshot" ADD CONSTRAINT "POSnapshot_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
