# Authentication Flow Diagram

## Multi-Portal Authentication Architecture

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant App as Next.js App
    participant Auth as Auth Service
    participant DB as Database
    participant Cookie as Cookie Store
    
    Note over User,Cookie: Login Flow
    
    User->>Browser: Enter credentials
    Browser->>App: POST /api/auth/login
    App->>Auth: hashPassword(password)
    Auth->>DB: findUser(email)
    DB-->>Auth: User data
    Auth->>Auth: verifyPassword()
    
    alt Valid Credentials
        Auth->>Auth: generateToken()
        Auth->>Cookie: setCookie(session_token)
        Cookie-->>Browser: Set-Cookie header
        App-->>Browser: 200 OK + user data
        Browser-->>User: Redirect to dashboard
    else Invalid Credentials
        App-->>Browser: 401 Unauthorized
        Browser-->>User: Show error message
    end
    
    Note over User,Cookie: Authenticated Request Flow
    
    User->>Browser: Navigate to protected page
    Browser->>App: GET /dashboard (with cookie)
    App->>Cookie: getCookie(session_token)
    Cookie-->>App: session_token
    App->>Auth: verifyToken(session_token)
    
    alt Valid Token
        Auth-->>App: User payload
        App->>DB: getUserPermissions(userId)
        DB-->>App: Permissions
        App-->>Browser: 200 OK + page content
        Browser-->>User: Display dashboard
    else Invalid/Expired Token
        App-->>Browser: 302 Redirect to /login
        Browser-->>User: Show login page
    end
```

## Portal-Specific Authentication

```mermaid
graph TB
    subgraph "5 Portal Types"
        ClientPortal[Client Tenant App<br/>Cookie: rs_user]
        OwnerPortal[Owner Portal<br/>Cookie: rs_user]
        ProviderPortal[Provider Portal<br/>Cookie: rs_provider]
        DeveloperPortal[Developer Portal<br/>Cookie: rs_developer]
        AccountantPortal[Accountant Portal<br/>Cookie: rs_accountant]
    end
    
    subgraph "Authentication Service"
        Login[Login Endpoint<br/>/api/auth/login]
        Verify[Token Verification]
        Refresh[Refresh Token]
    end
    
    subgraph "Session Storage"
        Cookies[HTTP-Only Cookies]
        Redis[Redis Session Store]
    end
    
    subgraph "Database"
        Users[(Users Table)]
        Permissions[(Permissions Table)]
        Roles[(Roles Table)]
    end
    
    ClientPortal --> Login
    OwnerPortal --> Login
    ProviderPortal --> Login
    DeveloperPortal --> Login
    AccountantPortal --> Login
    
    Login --> Verify
    Verify --> Cookies
    Verify --> Redis
    Verify --> Users
    Verify --> Permissions
    Verify --> Roles
    
    Refresh --> Verify
    
    style ClientPortal fill:#0070f3,color:#fff
    style OwnerPortal fill:#0070f3,color:#fff
    style ProviderPortal fill:#7c3aed,color:#fff
    style DeveloperPortal fill:#7c3aed,color:#fff
    style AccountantPortal fill:#7c3aed,color:#fff
```

## 2FA Flow (TOTP)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant App
    participant Auth as Auth Service
    participant DB as Database
    
    Note over User,DB: 2FA Setup
    
    User->>Browser: Enable 2FA
    Browser->>App: POST /api/auth/2fa/setup
    App->>Auth: generateTOTPSecret()
    Auth-->>App: secret + QR code URL
    App->>DB: saveSecret(userId, secret)
    App-->>Browser: QR code
    Browser-->>User: Display QR code
    User->>User: Scan with authenticator app
    User->>Browser: Enter verification code
    Browser->>App: POST /api/auth/2fa/verify
    App->>Auth: verifyTOTPToken(code, secret)
    
    alt Valid Code
        App->>DB: enable2FA(userId)
        App-->>Browser: 200 OK
        Browser-->>User: 2FA enabled
    else Invalid Code
        App-->>Browser: 400 Bad Request
        Browser-->>User: Invalid code
    end
    
    Note over User,DB: Login with 2FA
    
    User->>Browser: Enter credentials
    Browser->>App: POST /api/auth/login
    App->>Auth: verifyPassword()
    
    alt Valid Credentials + 2FA Enabled
        App-->>Browser: 200 OK + require2FA flag
        Browser-->>User: Prompt for 2FA code
        User->>Browser: Enter 2FA code
        Browser->>App: POST /api/auth/2fa/verify
        App->>DB: getSecret(userId)
        DB-->>App: TOTP secret
        App->>Auth: verifyTOTPToken(code, secret)
        
        alt Valid 2FA Code
            Auth->>Auth: generateToken()
            App-->>Browser: 200 OK + session token
            Browser-->>User: Redirect to dashboard
        else Invalid 2FA Code
            App-->>Browser: 401 Unauthorized
            Browser-->>User: Invalid 2FA code
        end
    else Valid Credentials + No 2FA
        Auth->>Auth: generateToken()
        App-->>Browser: 200 OK + session token
        Browser-->>User: Redirect to dashboard
    end
```

## RBAC Permission Check

```mermaid
graph TB
    Request[Incoming Request] --> Middleware[Auth Middleware]
    Middleware --> CheckCookie{Cookie<br/>Present?}
    
    CheckCookie -->|No| Unauthorized[401 Unauthorized]
    CheckCookie -->|Yes| VerifyToken[Verify JWT Token]
    
    VerifyToken --> TokenValid{Token<br/>Valid?}
    TokenValid -->|No| Unauthorized
    TokenValid -->|Yes| GetUser[Get User from DB]
    
    GetUser --> GetPermissions[Get User Permissions]
    GetPermissions --> CheckPermission{Has Required<br/>Permission?}
    
    CheckPermission -->|No| Forbidden[403 Forbidden]
    CheckPermission -->|Yes| AllowAccess[Allow Access]
    
    AllowAccess --> RouteHandler[Route Handler]
    
    style Request fill:#0070f3,color:#fff
    style AllowAccess fill:#10b981,color:#fff
    style Unauthorized fill:#ef4444,color:#fff
    style Forbidden fill:#f59e0b,color:#fff
```

## Cookie Configuration

### Provider Portal
```typescript
{
  name: 'rs_provider',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 3600 // 1 hour
}
```

### Tenant App
```typescript
{
  name: 'rs_user',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 3600 // 1 hour
}
```

### Developer Portal
```typescript
{
  name: 'rs_developer',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 3600 // 1 hour
}
```

## Security Features

1. **HTTP-Only Cookies**: Prevent XSS attacks
2. **Secure Flag**: HTTPS only in production
3. **SameSite**: CSRF protection
4. **Token Expiration**: 1-hour sessions
5. **Refresh Tokens**: 7-day validity
6. **Password Hashing**: bcrypt with salt
7. **TOTP 2FA**: Time-based one-time passwords
8. **Rate Limiting**: Prevent brute force attacks
9. **Audit Logging**: Track all authentication events
10. **RBAC**: Role-based access control with 30+ permissions

