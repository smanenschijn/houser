-- AlterTable
ALTER TABLE "House" ADD COLUMN     "error" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ready';
