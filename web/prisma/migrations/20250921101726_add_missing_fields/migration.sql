-- CreateEnum
CREATE TYPE "public"."RotationStatus" AS ENUM ('ROTATION', 'STABLE');

-- AlterEnum
ALTER TYPE "public"."Role" ADD VALUE 'PROJECT_MANAGER';

-- AlterTable
ALTER TABLE "public"."Profile" ADD COLUMN     "rotationStatus" "public"."RotationStatus" NOT NULL DEFAULT 'STABLE';

-- AlterTable
ALTER TABLE "public"."Project" ADD COLUMN     "managerId" TEXT;

-- AlterTable
ALTER TABLE "public"."TCoinTransaction" ADD COLUMN     "awardedById" TEXT,
ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "public"."TCoinAwardPermission" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "projectId" TEXT,
    "maxAmount" INTEGER NOT NULL DEFAULT 100,
    "dailyLimit" INTEGER NOT NULL DEFAULT 500,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TCoinAwardPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TCoinAwardPermission_managerId_projectId_key" ON "public"."TCoinAwardPermission"("managerId", "projectId");

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TCoinTransaction" ADD CONSTRAINT "TCoinTransaction_awardedById_fkey" FOREIGN KEY ("awardedById") REFERENCES "public"."Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TCoinTransaction" ADD CONSTRAINT "TCoinTransaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TCoinAwardPermission" ADD CONSTRAINT "TCoinAwardPermission_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TCoinAwardPermission" ADD CONSTRAINT "TCoinAwardPermission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
