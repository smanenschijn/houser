-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "houseId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Review_houseId_key" ON "Review"("houseId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_houseId_fkey" FOREIGN KEY ("houseId") REFERENCES "House"("id") ON DELETE CASCADE ON UPDATE CASCADE;
