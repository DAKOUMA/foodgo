-- AlterTable
ALTER TABLE "Restaurant" ALTER COLUMN "isOpen" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
