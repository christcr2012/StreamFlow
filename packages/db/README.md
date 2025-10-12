# @cortiware/db

Database utilities and helpers for Cortiware applications.

## Overview

This package provides database utilities and helpers for working with Prisma in the Cortiware monorepo. It includes:
- Database connection utilities
- Query helpers
- Transaction management
- Database error handling

## Installation

This is an internal package in the Cortiware monorepo. It's automatically available to all apps via workspace dependencies.

```json
{
  "dependencies": {
    "@cortiware/db": "file:../../packages/db"
  }
}
```

## Dual Prisma Schema Architecture

Cortiware uses **TWO separate Prisma schemas**:

### 1. Root Schema (Tenant-App)
- **Location**: `prisma/schema.prisma`
- **Used by**: `tenant-app`
- **Client**: `@prisma/client-tenant`
- **Purpose**: Tenant-facing data (CRM, users, organizations)

### 2. Provider Portal Schema
- **Location**: `apps/provider-portal/prisma/schema.prisma`
- **Used by**: `provider-portal`
- **Client**: `@prisma/client-provider`
- **Purpose**: Provider-facing data (federation, monetization, developer keys)

## API Reference

### Database Connection

```typescript
import { prisma } from '@cortiware/db';

// Use Prisma client
const users = await prisma.user.findMany();
```

### Query Helpers

```typescript
import { findById, findMany, create, update, remove } from '@cortiware/db';

// Find by ID
const user = await findById('user', '123');

// Find many with filters
const users = await findMany('user', {
  where: { role: 'admin' },
  orderBy: { createdAt: 'desc' }
});

// Create
const newUser = await create('user', {
  email: 'user@example.com',
  name: 'John Doe'
});

// Update
const updatedUser = await update('user', '123', {
  name: 'Jane Doe'
});

// Delete
await remove('user', '123');
```

### Transaction Management

```typescript
import { transaction } from '@cortiware/db';

// Run multiple operations in a transaction
const result = await transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com' }
  });
  
  const profile = await tx.profile.create({
    data: { userId: user.id, bio: 'Hello' }
  });
  
  return { user, profile };
});
```

### Error Handling

```typescript
import { handleDatabaseError, isDuplicateError, isNotFoundError } from '@cortiware/db';

try {
  await prisma.user.create({
    data: { email: 'existing@example.com' }
  });
} catch (error) {
  if (isDuplicateError(error)) {
    console.error('User already exists');
  } else if (isNotFoundError(error)) {
    console.error('Related record not found');
  } else {
    handleDatabaseError(error);
  }
}
```

## Usage Examples

### Basic CRUD Operations

```typescript
import { prisma } from '@cortiware/db';

// Create
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    role: 'user'
  }
});

// Read
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  include: { profile: true }
});

// Update
const updatedUser = await prisma.user.update({
  where: { id: '123' },
  data: { name: 'Jane Doe' }
});

// Delete
await prisma.user.delete({
  where: { id: '123' }
});
```

### Complex Queries

```typescript
import { prisma } from '@cortiware/db';

// Find with relations
const userWithPosts = await prisma.user.findUnique({
  where: { id: '123' },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' }
    },
    profile: true
  }
});

// Aggregate queries
const stats = await prisma.user.aggregate({
  _count: true,
  _avg: { age: true },
  where: { role: 'user' }
});

// Group by
const usersByRole = await prisma.user.groupBy({
  by: ['role'],
  _count: true
});
```

### Transactions

```typescript
import { prisma } from '@cortiware/db';

// Transfer credits between users
async function transferCredits(fromUserId: string, toUserId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // Deduct from sender
    const sender = await tx.user.update({
      where: { id: fromUserId },
      data: { credits: { decrement: amount } }
    });
    
    if (sender.credits < 0) {
      throw new Error('Insufficient credits');
    }
    
    // Add to receiver
    const receiver = await tx.user.update({
      where: { id: toUserId },
      data: { credits: { increment: amount } }
    });
    
    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        fromUserId,
        toUserId,
        amount,
        type: 'transfer'
      }
    });
    
    return { sender, receiver, transaction };
  });
}
```

## Environment Variables

### Required

```env
# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/cortiware?schema=public"
```

### Optional

```env
# Connection pool settings
DATABASE_POOL_SIZE=10
DATABASE_POOL_TIMEOUT=30000

# Logging
DATABASE_LOG_QUERIES=true
DATABASE_LOG_LEVEL=info
```

## Prisma Commands

### Generate Client

```bash
# Tenant-app client
npx prisma generate --schema=prisma/schema.prisma

# Provider-portal client
cd apps/provider-portal
npx prisma generate
```

### Run Migrations

```bash
# Tenant-app migrations
npx prisma migrate deploy --schema=prisma/schema.prisma

# Provider-portal migrations
cd apps/provider-portal
npx prisma migrate deploy
```

### Create Migration

```bash
# Tenant-app
npx prisma migrate dev --name migration_name --schema=prisma/schema.prisma

# Provider-portal
cd apps/provider-portal
npx prisma migrate dev --name migration_name
```

### Seed Database

```bash
# Tenant-app
npm run seed

# Provider-portal
cd apps/provider-portal
npm run prisma:seed
```

## Best Practices

1. **Always use transactions** for operations that modify multiple records
2. **Use `include` sparingly** to avoid N+1 queries
3. **Add indexes** for frequently queried fields
4. **Use `select`** to limit returned fields when possible
5. **Handle errors** appropriately (duplicate keys, not found, etc.)
6. **Use connection pooling** in production
7. **Log slow queries** for performance monitoring

## Common Patterns

### Soft Delete

```typescript
// Instead of deleting, mark as deleted
await prisma.user.update({
  where: { id: '123' },
  data: { deletedAt: new Date() }
});

// Filter out deleted records
const activeUsers = await prisma.user.findMany({
  where: { deletedAt: null }
});
```

### Pagination

```typescript
const page = 1;
const pageSize = 20;

const users = await prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});

const total = await prisma.user.count();
```

### Upsert

```typescript
// Create or update
const user = await prisma.user.upsert({
  where: { email: 'user@example.com' },
  update: { name: 'Updated Name' },
  create: {
    email: 'user@example.com',
    name: 'New User'
  }
});
```

## Related Packages

- `@cortiware/auth-service`: Authentication utilities
- `@cortiware/kv`: Key-value store

## Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [VERCEL_BUILD_GUIDE.md](../../docs/VERCEL_BUILD_GUIDE.md): Dual Prisma schema handling
- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): Data layer architecture

## License

MIT

