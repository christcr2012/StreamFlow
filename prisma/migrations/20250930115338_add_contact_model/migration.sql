-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "title" TEXT,
    "department" TEXT,
    "organizationId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "mobilePhone" TEXT,
    "workPhone" TEXT,
    "fax" TEXT,
    "website" TEXT,
    "address" JSONB,
    "linkedIn" TEXT,
    "twitter" TEXT,
    "ownerId" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastContactedAt" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_orgId_email_idx" ON "public"."Contact"("orgId", "email");

-- CreateIndex
CREATE INDEX "Contact_orgId_organizationId_idx" ON "public"."Contact"("orgId", "organizationId");

-- CreateIndex
CREATE INDEX "Contact_orgId_ownerId_idx" ON "public"."Contact"("orgId", "ownerId");

-- CreateIndex
CREATE INDEX "Contact_orgId_status_idx" ON "public"."Contact"("orgId", "status");

-- CreateIndex
CREATE INDEX "Contact_orgId_createdAt_idx" ON "public"."Contact"("orgId", "createdAt");

-- CreateIndex
CREATE INDEX "Contact_orgId_lastContactedAt_idx" ON "public"."Contact"("orgId", "lastContactedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_orgId_id_key" ON "public"."Contact"("orgId", "id");

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_orgId_organizationId_fkey" FOREIGN KEY ("orgId", "organizationId") REFERENCES "public"."Customer"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_orgId_ownerId_fkey" FOREIGN KEY ("orgId", "ownerId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
