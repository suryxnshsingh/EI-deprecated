-- CreateTable
CREATE TABLE "PO" (
    "subjectCode" TEXT NOT NULL,
    "matrix1" JSONB NOT NULL,
    "matrix2" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PO_pkey" PRIMARY KEY ("subjectCode")
);

-- AddForeignKey
ALTER TABLE "PO" ADD CONSTRAINT "PO_subjectCode_fkey" FOREIGN KEY ("subjectCode") REFERENCES "Subject"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
