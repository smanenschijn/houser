-- AlterTable
ALTER TABLE "House" ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'upload',
ADD COLUMN     "fundaId" TEXT,
ADD COLUMN     "fundaUrl" TEXT,
ADD COLUMN     "searchProfileId" TEXT;

-- CreateTable
CREATE TABLE "SearchProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cities" TEXT[] NOT NULL,
    "priceMin" DOUBLE PRECISION,
    "priceMax" DOUBLE PRECISION,
    "objectTypes" TEXT[] NOT NULL DEFAULT ARRAY['house']::TEXT[],
    "livingAreaMin" DOUBLE PRECISION,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastRunStatus" TEXT,
    "lastRunError" TEXT,
    "lastRunCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SearchProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "House_fundaId_key" ON "House"("fundaId");

-- AddForeignKey
ALTER TABLE "House" ADD CONSTRAINT "House_searchProfileId_fkey" FOREIGN KEY ("searchProfileId") REFERENCES "SearchProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
