# @cortiware/auth-service

Authentication utilities for Cortiware applications.

## Overview

This package provides authentication and authorization utilities including:
- Password hashing and verification (bcrypt)
- JWT token generation and validation (JOSE)
- TOTP (Time-based One-Time Password) for 2FA
- Cookie management for session handling
- Ticket-based authentication
- Refresh token management

## Installation

This is an internal package in the Cortiware monorepo. It's automatically available to all apps via workspace dependencies.

```json
{
  "dependencies": {
    "@cortiware/auth-service": "file:../../packages/auth-service"
  }
}
```

## API Reference

### Password Hashing

```typescript
import { hashPassword, verifyPassword } from '@cortiware/auth-service';

// Hash a password
const hashedPassword = await hashPassword('user-password');

// Verify a password
const isValid = await verifyPassword('user-password', hashedPassword);
```

### JWT Tokens

```typescript
import { generateToken, verifyToken } from '@cortiware/auth-service';

// Generate a JWT token
const token = await generateToken({
  userId: '123',
  email: 'user@example.com',
  role: 'admin'
}, {
  expiresIn: '1h',
  secret: process.env.JWT_SECRET
});

// Verify a JWT token
const payload = await verifyToken(token, process.env.JWT_SECRET);
```

### TOTP (2FA)

```typescript
import { generateTOTPSecret, generateTOTPToken, verifyTOTPToken } from '@cortiware/auth-service';

// Generate a TOTP secret for a user
const secret = generateTOTPSecret();

// Generate a TOTP token (for testing)
const token = generateTOTPToken(secret);

// Verify a TOTP token
const isValid = verifyTOTPToken(token, secret);
```

### Cookie Management

```typescript
import { setCookie, getCookie, deleteCookie } from '@cortiware/auth-service';

// Set a cookie
setCookie(response, 'session_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 3600 // 1 hour
});

// Get a cookie
const token = getCookie(request, 'session_token');

// Delete a cookie
deleteCookie(response, 'session_token');
```

### Ticket Authentication

```typescript
import { createTicket, verifyTicket } from '@cortiware/auth-service';

// Create an authentication ticket
const ticket = await createTicket({
  userId: '123',
  email: 'user@example.com',
  permissions: ['read', 'write']
}, {
  expiresIn: '15m',
  secret: process.env.TICKET_SECRET
});

// Verify a ticket
const payload = await verifyTicket(ticket, process.env.TICKET_SECRET);
```

### Refresh Tokens

```typescript
import { generateRefreshToken, verifyRefreshToken } from '@cortiware/auth-service';

// Generate a refresh token
const refreshToken = await generateRefreshToken({
  userId: '123',
  tokenId: 'unique-token-id'
}, {
  expiresIn: '7d',
  secret: process.env.REFRESH_TOKEN_SECRET
});

// Verify a refresh token
const payload = await verifyRefreshToken(refreshToken, process.env.REFRESH_TOKEN_SECRET);
```

## Usage Examples

### Complete Authentication Flow

```typescript
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  setCookie 
} from '@cortiware/auth-service';

// Registration
async function register(email: string, password: string) {
  const hashedPassword = await hashPassword(password);
  
  // Save user to database
  const user = await db.user.create({
    data: {
      email,
      password: hashedPassword
    }
  });
  
  return user;
}

// Login
async function login(email: string, password: string, response: Response) {
  // Find user
  const user = await db.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  
  // Verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) throw new Error('Invalid credentials');
  
  // Generate token
  const token = await generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  }, {
    expiresIn: '1h',
    secret: process.env.JWT_SECRET
  });
  
  // Set cookie
  setCookie(response, 'session_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600
  });
  
  return { user, token };
}
```

### 2FA Setup and Verification

```typescript
import { 
  generateTOTPSecret, 
  generateTOTPToken, 
  verifyTOTPToken 
} from '@cortiware/auth-service';

// Setup 2FA
async function setup2FA(userId: string) {
  const secret = generateTOTPSecret();
  
  // Save secret to database
  await db.user.update({
    where: { id: userId },
    data: { totpSecret: secret }
  });
  
  // Generate QR code URL for user to scan
  const qrCodeUrl = `otpauth://totp/Cortiware:${userId}?secret=${secret}&issuer=Cortiware`;
  
  return { secret, qrCodeUrl };
}

// Verify 2FA token
async function verify2FA(userId: string, token: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || !user.totpSecret) throw new Error('2FA not enabled');
  
  const isValid = verifyTOTPToken(token, user.totpSecret);
  if (!isValid) throw new Error('Invalid 2FA token');
  
  return true;
}
```

## Dependencies

- **bcryptjs**: Password hashing
- **jose**: JWT token generation and validation
- **otplib**: TOTP generation and verification

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Type Check

```bash
npm run typecheck
```

### Run Tests

```bash
npm test
```

## Security Considerations

1. **Password Hashing**: Always use `hashPassword()` before storing passwords
2. **JWT Secrets**: Use strong, random secrets for JWT signing
3. **Cookie Security**: Always use `httpOnly`, `secure`, and `sameSite` flags in production
4. **Token Expiration**: Set appropriate expiration times for tokens
5. **TOTP Secrets**: Store TOTP secrets securely and never expose them to clients

## Related Packages

- `@cortiware/db`: Database utilities
- `@cortiware/kv`: Key-value store for session management

## License

MIT

