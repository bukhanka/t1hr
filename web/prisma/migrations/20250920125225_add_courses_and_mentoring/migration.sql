-- CreateEnum
CREATE TYPE "public"."CourseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "public"."LearningStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- CreateEnum
CREATE TYPE "public"."MentorRole" AS ENUM ('MENTOR', 'MENTEE');

-- CreateTable
CREATE TABLE "public"."Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" INTEGER,
    "format" TEXT NOT NULL,
    "skills" TEXT[],
    "status" "public"."CourseStatus" NOT NULL DEFAULT 'ACTIVE',
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserCourse" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "status" "public"."LearningStatus" NOT NULL DEFAULT 'PLANNED',
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MentorProgram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "skills" TEXT[],
    "mentorId" TEXT NOT NULL,
    "maxSlots" INTEGER NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserMentorProgram" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "role" "public"."MentorRole" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMentorProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserCourse_profileId_courseId_key" ON "public"."UserCourse"("profileId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMentorProgram_profileId_programId_key" ON "public"."UserMentorProgram"("profileId", "programId");

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserCourse" ADD CONSTRAINT "UserCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "public"."Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMentorProgram" ADD CONSTRAINT "UserMentorProgram_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserMentorProgram" ADD CONSTRAINT "UserMentorProgram_programId_fkey" FOREIGN KEY ("programId") REFERENCES "public"."MentorProgram"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
