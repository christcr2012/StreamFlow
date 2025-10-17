# TODO: Add Agreement Models to Prisma Schema

## Issue
The tenant-app has code that references `Agreement` and `AgreementTemplate` models, but these models don't exist in the Prisma schema (`prisma/schema.prisma`). This was causing build failures.

## Temporary Fix (Applied)
All Agreement-related code has been commented out with TODO comments:
- `apps/tenant-app/src/app/agreements/page.tsx`
- `apps/tenant-app/src/app/api/agreements/route.ts`
- `apps/tenant-app/src/app/api/agreements/[id]/route.ts`

All Agreement API endpoints now return `501 Not Implemented` until the models are added.

## Required Models

Based on the existing validation schemas in `apps/tenant-app/src/lib/validations/agreement.ts`, the following models need to be added to `prisma/schema.prisma`:

### AgreementTemplate Model
```prisma
model AgreementTemplate {
  id           String      @id @default(cuid())
  orgId        String
  name         String
  verticalKey  String?
  content      String      @db.Text
  mergeFields  String[]    @default([])
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
  
  org          Org         @relation(fields: [orgId], references: [id])
  agreements   Agreement[]
  
  @@index([orgId, isActive])
  @@index([verticalKey])
}
```

### Agreement Model
```prisma
model Agreement {
  id          String             @id @default(cuid())
  orgId       String
  customerId  String
  templateId  String
  content     String             @db.Text
  variables   Json               @default("{}")
  status      AgreementStatus    @default(DRAFT)
  signedAt    DateTime?
  signedBy    String?
  renewalAt   DateTime?
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt
  
  org         Org                @relation(fields: [orgId], references: [id])
  customer    Customer           @relation(fields: [customerId], references: [id])
  template    AgreementTemplate  @relation(fields: [templateId], references: [id])
  
  @@index([orgId, status])
  @@index([customerId])
  @@index([templateId])
}

enum AgreementStatus {
  DRAFT
  SENT
  SIGNED
  EXPIRED
  CANCELLED
}
```

## Required Schema Updates

1. Add the `AgreementTemplate` model to `prisma/schema.prisma`
2. Add the `Agreement` model to `prisma/schema.prisma`
3. Add the `AgreementStatus` enum to `prisma/schema.prisma`
4. Add `agreements` relation to the `Org` model:
   ```prisma
   model Org {
     // ... existing fields ...
     agreements          Agreement[]
     agreementTemplates  AgreementTemplate[]
   }
   ```
5. Add `agreements` relation to the `Customer` model:
   ```prisma
   model Customer {
     // ... existing fields ...
     agreements  Agreement[]
   }
   ```

## Migration Steps

1. Add the models to `prisma/schema.prisma`
2. Create a migration:
   ```bash
   npx prisma migrate dev --name add_agreement_models
   ```
3. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
4. Uncomment all Agreement-related code in the tenant-app
5. Test the Agreement features
6. Deploy to Vercel

## Files to Uncomment After Migration

Once the models are added and the migration is applied, uncomment the code in these files:
- `apps/tenant-app/src/app/agreements/page.tsx`
- `apps/tenant-app/src/app/api/agreements/route.ts`
- `apps/tenant-app/src/app/api/agreements/[id]/route.ts`

## Related Files

- Validation schemas: `apps/tenant-app/src/lib/validations/agreement.ts`
- Documentation: `docs/tenant-app/INTEGRATIONS.md` (mentions agreements engine)

## Priority

**Medium** - The Agreement feature is planned but not critical for current operations. The temporary fix allows deployments to succeed while this feature is being developed.

