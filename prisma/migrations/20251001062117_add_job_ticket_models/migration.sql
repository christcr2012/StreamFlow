-- CreateTable
CREATE TABLE "public"."JobTicket" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "crewId" TEXT,
    "serviceType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "estimateId" TEXT,
    "invoiceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobLog" (
    "id" TEXT NOT NULL,
    "jobTicketId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "photoUrl" TEXT,
    "partsUsed" JSONB NOT NULL DEFAULT '[]',
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobCompletion" (
    "id" TEXT NOT NULL,
    "jobTicketId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "signatureUrl" TEXT,
    "aiReportUrl" TEXT,
    "aiReportText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobAnomaly" (
    "id" TEXT NOT NULL,
    "jobTicketId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "aiNotes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAnomaly_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobTicket_orgId_status_idx" ON "public"."JobTicket"("orgId", "status");

-- CreateIndex
CREATE INDEX "JobTicket_orgId_scheduledAt_idx" ON "public"."JobTicket"("orgId", "scheduledAt");

-- CreateIndex
CREATE INDEX "JobTicket_customerId_idx" ON "public"."JobTicket"("customerId");

-- CreateIndex
CREATE INDEX "JobTicket_crewId_idx" ON "public"."JobTicket"("crewId");

-- CreateIndex
CREATE INDEX "JobLog_jobTicketId_createdAt_idx" ON "public"."JobLog"("jobTicketId", "createdAt");

-- CreateIndex
CREATE INDEX "JobLog_actorId_idx" ON "public"."JobLog"("actorId");

-- CreateIndex
CREATE INDEX "JobLog_syncedAt_idx" ON "public"."JobLog"("syncedAt");

-- CreateIndex
CREATE UNIQUE INDEX "JobCompletion_jobTicketId_key" ON "public"."JobCompletion"("jobTicketId");

-- CreateIndex
CREATE INDEX "JobCompletion_completedAt_idx" ON "public"."JobCompletion"("completedAt");

-- CreateIndex
CREATE INDEX "JobAnomaly_jobTicketId_severity_idx" ON "public"."JobAnomaly"("jobTicketId", "severity");

-- CreateIndex
CREATE INDEX "JobAnomaly_reviewedAt_idx" ON "public"."JobAnomaly"("reviewedAt");

-- AddForeignKey
ALTER TABLE "public"."JobTicket" ADD CONSTRAINT "JobTicket_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobTicket" ADD CONSTRAINT "JobTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobTicket" ADD CONSTRAINT "JobTicket_orgId_crewId_fkey" FOREIGN KEY ("orgId", "crewId") REFERENCES "public"."User"("orgId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobLog" ADD CONSTRAINT "JobLog_jobTicketId_fkey" FOREIGN KEY ("jobTicketId") REFERENCES "public"."JobTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobCompletion" ADD CONSTRAINT "JobCompletion_jobTicketId_fkey" FOREIGN KEY ("jobTicketId") REFERENCES "public"."JobTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobAnomaly" ADD CONSTRAINT "JobAnomaly_jobTicketId_fkey" FOREIGN KEY ("jobTicketId") REFERENCES "public"."JobTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;
