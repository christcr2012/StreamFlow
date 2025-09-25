-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" VARCHAR(255);
