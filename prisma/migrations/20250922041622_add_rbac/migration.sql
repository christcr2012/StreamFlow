-- CreateTable
CREATE TABLE "public"."RbacPermission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RbacPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RbacRole" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RbacRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."RbacRolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "RbacRolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "public"."RbacUserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgId" TEXT,
    "roleId" TEXT NOT NULL,

    CONSTRAINT "RbacUserRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RbacPermission_code_key" ON "public"."RbacPermission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "RbacRole_orgId_slug_key" ON "public"."RbacRole"("orgId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "RbacUserRole_userId_roleId_orgId_key" ON "public"."RbacUserRole"("userId", "roleId", "orgId");

-- AddForeignKey
ALTER TABLE "public"."RbacRole" ADD CONSTRAINT "RbacRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RbacRolePermission" ADD CONSTRAINT "RbacRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "public"."RbacPermission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RbacUserRole" ADD CONSTRAINT "RbacUserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RbacUserRole" ADD CONSTRAINT "RbacUserRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "public"."Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."RbacUserRole" ADD CONSTRAINT "RbacUserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."RbacRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;
