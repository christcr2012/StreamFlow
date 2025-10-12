# @cortiware/kv

Key-value store utilities for Cortiware applications with Vercel KV and in-memory fallback support.

## Overview

This package provides a unified KV (key-value) store interface that works with:
- **Vercel KV** (production) - Redis-compatible serverless storage
- **In-Memory Fallback** (development/testing) - Local Map-based storage

Features:
- Nonce storage for SSO replay protection
- Session management for refresh tokens
- Rate limiting for auth endpoints
- Automatic expiry handling
- Type-safe operations

## Installation

This is an internal package in the Cortiware monorepo.

```json
{
  "dependencies": {
    "@cortiware/kv": "file:../../packages/kv"
  }
}
```

## Environment Variables

### Vercel KV (Production)

```env
# New naming convention (preferred)
KV_URL="redis://..."
KV_TOKEN="your-token"

# Old naming convention (also supported)
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="your-token"
```

If these variables are not set, the package automatically falls back to in-memory storage.

## API Reference

### KV Client

```typescript
import { getKVClient } from '@cortiware/kv';

const kv = getKVClient();

// Get value
const value = await kv.get<string>('my-key');

// Set value with expiry
await kv.set('my-key', 'my-value', { ex: 3600 }); // expires in 1 hour

// Delete value
await kv.del('my-key');

// Check existence
const exists = await kv.exists('my-key');

// Set expiry
await kv.expire('my-key', 3600);

// Get TTL
const ttl = await kv.ttl('my-key');
```

### Nonce Operations (SSO Replay Protection)

```typescript
import { storeNonce, checkNonce, deleteNonce } from '@cortiware/kv';

// Store nonce (default 120 seconds)
await storeNonce('unique-nonce-123');

// Store with custom expiry
await storeNonce('unique-nonce-456', 300); // 5 minutes

// Check if nonce exists
const exists = await checkNonce('unique-nonce-123');

// Delete nonce
await deleteNonce('unique-nonce-123');
```

### Session Operations

```typescript
import { 
  storeSession, 
  getSession, 
  deleteSession, 
  refreshSession 
} from '@cortiware/kv';

// Store session (default 24 hours)
await storeSession('session-id', {
  userId: '123',
  email: 'user@example.com',
  role: 'admin'
});

// Store with custom expiry
await storeSession('session-id', data, 7200); // 2 hours

// Get session
const session = await getSession<{ userId: string }>('session-id');

// Refresh session expiry
await refreshSession('session-id', 86400); // extend by 24 hours

// Delete session
await deleteSession('session-id');
```

### Rate Limiting Operations

```typescript
import { 
  incrementRateLimit, 
  getRateLimit, 
  resetRateLimit 
} from '@cortiware/kv';

// Increment rate limit counter (default 15 minutes window)
const count = await incrementRateLimit('user:123:login');

// Increment with custom window
const count = await incrementRateLimit('user:123:api', 3600); // 1 hour

// Get current count
const current = await getRateLimit('user:123:login');

// Reset rate limit
await resetRateLimit('user:123:login');
```

## Usage Examples

### SSO Nonce Validation

```typescript
import { storeNonce, checkNonce, deleteNonce } from '@cortiware/kv';

async function validateSSOTicket(ticket: string, nonce: string) {
  // Check if nonce was already used
  const nonceExists = await checkNonce(nonce);
  if (nonceExists) {
    throw new Error('Ticket replay detected');
  }
  
  // Store nonce to prevent replay
  await storeNonce(nonce, 120); // 2 minutes
  
  // Validate ticket...
  
  return { valid: true };
}
```

### Session Management

```typescript
import { storeSession, getSession, refreshSession } from '@cortiware/kv';

async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  
  await storeSession(sessionId, {
    userId,
    createdAt: Date.now()
  }, 86400); // 24 hours
  
  return sessionId;
}

async function validateSession(sessionId: string) {
  const session = await getSession(sessionId);
  
  if (!session) {
    throw new Error('Session expired or invalid');
  }
  
  // Refresh session on activity
  await refreshSession(sessionId, 86400);
  
  return session;
}
```

### Rate Limiting

```typescript
import { incrementRateLimit, getRateLimit } from '@cortiware/kv';

async function checkRateLimit(userId: string, limit: number = 5) {
  const key = `login:${userId}`;
  const count = await incrementRateLimit(key, 900); // 15 minutes
  
  if (count > limit) {
    throw new Error('Rate limit exceeded. Try again later.');
  }
  
  return { remaining: limit - count };
}
```

## Client Types

### VercelKVClient

Production client using Vercel KV (Redis-compatible):
- Distributed storage across serverless functions
- Automatic persistence and replication
- Sub-millisecond latency
- Automatic expiry handling

### InMemoryKVClient

Development/testing fallback:
- Local Map-based storage
- Automatic expiry simulation
- No external dependencies
- Not suitable for production (data lost on restart)

## Best Practices

1. **Always set expiry** for temporary data (nonces, sessions, rate limits)
2. **Use type parameters** for type-safe get operations: `kv.get<MyType>('key')`
3. **Handle null returns** - keys may not exist or may have expired
4. **Use semantic key prefixes** - `nonce:`, `session:`, `ratelimit:` for clarity
5. **Configure Vercel KV** for production - in-memory fallback is not persistent

## Key Naming Conventions

```typescript
// Nonces (SSO replay protection)
`nonce:${nonce}` // e.g., "nonce:abc123"

// Sessions (refresh tokens)
`session:${sessionId}` // e.g., "session:uuid-here"

// Rate limiting
`ratelimit:${identifier}` // e.g., "ratelimit:user:123:login"
```

## Error Handling

```typescript
import { getKVClient } from '@cortiware/kv';

try {
  const kv = getKVClient();
  await kv.set('my-key', 'my-value');
} catch (error) {
  console.error('KV operation failed:', error);
  // Handle error (retry, fallback, etc.)
}
```

## Testing

```typescript
// In tests, KV automatically uses in-memory fallback
import { getKVClient, storeNonce, checkNonce } from '@cortiware/kv';

test('nonce storage and retrieval', async () => {
  await storeNonce('test-nonce');
  const exists = await checkNonce('test-nonce');
  expect(exists).toBe(true);
});
```

## Related Packages

- `@cortiware/auth-service`: Uses KV for session management
- `@cortiware/db`: Database utilities

## Documentation

- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [ARCHITECTURE_OVERVIEW.md](../../docs/ARCHITECTURE_OVERVIEW.md): System architecture

## License

MIT

