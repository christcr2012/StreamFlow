/*
  Warnings:

  - You are about to drop the column `address1` on the `Lead` table. All the data in the column will be lost.
  - You are about to drop the column `address2` on the `Lead` table. All the data in the column will be lost.
  - You are about to alter the column `postalCode` on the `Lead` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."LeadSource" ADD VALUE 'MANUAL_EMPLOYEE_REFERRAL';
ALTER TYPE "public"."LeadSource" ADD VALUE 'MANUAL_EXISTING_CUSTOMER';
ALTER TYPE "public"."LeadSource" ADD VALUE 'MANUAL_NEW_CUSTOMER';
ALTER TYPE "public"."LeadSource" ADD VALUE 'MANUAL_OTHER';

-- AlterTable
ALTER TABLE "public"."Lead" DROP COLUMN "address1",
DROP COLUMN "address2",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "country" TEXT,
ALTER COLUMN "postalCode" SET DATA TYPE VARCHAR(20);
