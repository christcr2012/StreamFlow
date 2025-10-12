# Custom Domain Setup Guide

## Overview

This guide covers setting up custom domains for Cortiware applications deployed on Vercel.

## Domain Types

### Production Domains
- **Provider Portal:** `portal.cortiware.com`
- **Tenant App:** `app.cortiware.com`
- **Marketing (Cortiware):** `www.cortiware.com`
- **Marketing (Robinson):** `www.robinsonservices.com`

### Staging Domains
- **Provider Portal:** `portal-staging.cortiware.com`
- **Tenant App:** `app-staging.cortiware.com`

## Vercel Configuration

### 1. Add Domain to Project

**Via Vercel Dashboard:**
1. Navigate to project settings
2. Go to "Domains" tab
3. Click "Add Domain"
4. Enter domain name (e.g., `portal.cortiware.com`)
5. Click "Add"

**Via Vercel CLI:**
```bash
vercel domains add portal.cortiware.com --project=provider-portal
```

### 2. Configure DNS Records

Vercel will provide DNS configuration instructions. Typically:

**For Apex Domain (cortiware.com):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**For Subdomain (portal.cortiware.com):**
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
```

**For www Subdomain:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 3. SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt:
- Certificate issued within minutes
- Auto-renewal every 90 days
- Supports wildcard certificates for `*.cortiware.com`

## DNS Provider Setup

### Cloudflare (Recommended)

**Advantages:**
- Free SSL/TLS
- DDoS protection
- CDN acceleration
- Analytics

**Setup:**
1. Add domain to Cloudflare
2. Update nameservers at domain registrar
3. Add DNS records as specified by Vercel
4. Set SSL/TLS mode to "Full (strict)"
5. Enable "Always Use HTTPS"

**DNS Records:**
```
Type: CNAME
Name: portal
Value: cname.vercel-dns.com
Proxy: Enabled (orange cloud)
```

### Route 53 (AWS)

**Setup:**
1. Create hosted zone for domain
2. Update nameservers at domain registrar
3. Add DNS records as specified by Vercel

**DNS Records:**
```
Type: CNAME
Name: portal.cortiware.com
Value: cname.vercel-dns.com
TTL: 300
```

### Google Domains

**Setup:**
1. Navigate to DNS settings
2. Add custom resource records
3. Add records as specified by Vercel

**DNS Records:**
```
Type: CNAME
Host: portal
Data: cname.vercel-dns.com
TTL: 3600
```

## Environment Variables

### Domain-Specific Variables

**Provider Portal (.env.production):**
```env
NEXT_PUBLIC_APP_URL=https://portal.cortiware.com
NEXT_PUBLIC_API_URL=https://portal.cortiware.com/api
NEXTAUTH_URL=https://portal.cortiware.com
```

**Tenant App (.env.production):**
```env
NEXT_PUBLIC_APP_URL=https://app.cortiware.com
NEXT_PUBLIC_API_URL=https://app.cortiware.com/api
NEXTAUTH_URL=https://app.cortiware.com
```

### Vercel Environment Variables

Set in Vercel Dashboard → Project Settings → Environment Variables:

```
NEXT_PUBLIC_APP_URL=https://portal.cortiware.com
DATABASE_URL=postgresql://...
SENDGRID_API_KEY=SG.xxx
VERCEL_KV_REST_API_URL=https://...
```

## CORS Configuration

### API Routes

```typescript
// apps/provider-portal/src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const allowedOrigins = [
    'https://portal.cortiware.com',
    'https://portal-staging.cortiware.com',
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  ].filter(Boolean);
  
  const origin = request.headers.get('origin');
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  
  return response;
}
```

## Redirects

### WWW to Non-WWW

**In vercel.json:**
```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.cortiware.com"
        }
      ],
      "destination": "https://cortiware.com/:path*",
      "permanent": true
    }
  ]
}
```

### HTTP to HTTPS

Vercel automatically redirects HTTP to HTTPS. No configuration needed.

### Legacy Domains

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "old-domain.com"
        }
      ],
      "destination": "https://portal.cortiware.com/:path*",
      "permanent": true
    }
  ]
}
```

## Email Configuration

### SendGrid Domain Authentication

**Setup:**
1. Navigate to SendGrid → Settings → Sender Authentication
2. Click "Authenticate Your Domain"
3. Enter domain: `cortiware.com`
4. Add DNS records provided by SendGrid

**DNS Records:**
```
Type: CNAME
Name: em1234.cortiware.com
Value: u1234567.wl123.sendgrid.net

Type: CNAME
Name: s1._domainkey.cortiware.com
Value: s1.domainkey.u1234567.wl123.sendgrid.net

Type: CNAME
Name: s2._domainkey.cortiware.com
Value: s2.domainkey.u1234567.wl123.sendgrid.net
```

### SPF Record

```
Type: TXT
Name: @
Value: v=spf1 include:sendgrid.net ~all
```

### DKIM Records

Provided by SendGrid during domain authentication.

### DMARC Record

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@cortiware.com
```

## Monitoring

### Domain Health Checks

**Uptime Monitoring:**
- Use Vercel Analytics
- Or external service (UptimeRobot, Pingdom)

**SSL Certificate Monitoring:**
- Vercel auto-renews certificates
- Monitor expiration via Vercel Dashboard

**DNS Monitoring:**
- Monitor DNS propagation
- Check TTL settings
- Verify DNSSEC if enabled

### Performance Monitoring

**Vercel Analytics:**
- Real User Monitoring (RUM)
- Core Web Vitals
- Geographic distribution

**Custom Monitoring:**
```typescript
// apps/provider-portal/src/app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    sendgrid: await checkSendGrid(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return NextResponse.json(
    { status: healthy ? 'healthy' : 'degraded', checks },
    { status: healthy ? 200 : 503 }
  );
}
```

## Troubleshooting

### Domain Not Resolving

**Check DNS Propagation:**
```bash
dig portal.cortiware.com
nslookup portal.cortiware.com
```

**Verify DNS Records:**
- Ensure CNAME points to `cname.vercel-dns.com`
- Check TTL (lower for faster propagation)
- Wait up to 48 hours for full propagation

### SSL Certificate Issues

**Certificate Not Issued:**
- Verify DNS records are correct
- Check domain ownership
- Wait up to 24 hours for issuance

**Certificate Expired:**
- Vercel auto-renews; check Vercel Dashboard
- Verify domain is still active in project

### CORS Errors

**Check Allowed Origins:**
- Verify origin in middleware
- Check environment variables
- Test with curl:

```bash
curl -H "Origin: https://portal.cortiware.com" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS \
     https://portal.cortiware.com/api/leads
```

## Deployment Checklist

- [ ] Domain added to Vercel project
- [ ] DNS records configured
- [ ] SSL certificate issued
- [ ] Environment variables set
- [ ] CORS configured
- [ ] Redirects configured (www, http)
- [ ] Email domain authenticated (SendGrid)
- [ ] SPF/DKIM/DMARC records added
- [ ] Health check endpoint created
- [ ] Monitoring configured
- [ ] Test all functionality on custom domain
- [ ] Update documentation with new URLs

Custom Domain Setup: Complete ✅

