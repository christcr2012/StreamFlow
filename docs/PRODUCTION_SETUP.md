# Production Setup Guide

This guide covers the production deployment configuration for the Cortiware worker system.

## Table of Contents

1. [AWS S3 Configuration](#aws-s3-configuration)
2. [Vendor API Credentials](#vendor-api-credentials)
3. [Environment Variables](#environment-variables)
4. [Testing](#testing)

---

## AWS S3 Configuration

### 1. Create S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://cortiware-uploads --region us-east-1

# Set bucket policy for public read access (optional)
aws s3api put-bucket-policy --bucket cortiware-uploads --policy file://bucket-policy.json
```

**bucket-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::cortiware-uploads/*"
    }
  ]
}
```

### 2. Create IAM User for Worker

```bash
# Create IAM user
aws iam create-user --user-name cortiware-worker

# Attach S3 full access policy (or create custom policy)
aws iam attach-user-policy --user-name cortiware-worker \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess

# Create access keys
aws iam create-access-key --user-name cortiware-worker
```

**Custom IAM Policy (recommended):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cortiware-uploads",
        "arn:aws:s3:::cortiware-uploads/*"
      ]
    }
  ]
}
```

### 3. Configure Fly.io Secrets

```bash
# Set AWS credentials in Fly.io
flyctl secrets set AWS_ACCESS_KEY_ID="AKIA..." --app cortiware
flyctl secrets set AWS_SECRET_ACCESS_KEY="..." --app cortiware
flyctl secrets set AWS_REGION="us-east-1" --app cortiware
flyctl secrets set AWS_S3_BUCKET="cortiware-uploads" --app cortiware
```

---

## Vendor API Credentials

### Samsara (Fleet Management)

1. **Get API Key:**
   - Log in to Samsara dashboard
   - Navigate to Settings → API Tokens
   - Create new API token with appropriate permissions

2. **Configure in Cortiware:**
   ```bash
   # Via API
   curl -X POST https://your-domain.com/api/settings/vendors \
     -H "Content-Type: application/json" \
     -d '{
       "vendor": "samsara",
       "enabled": true,
       "credentials": {
         "apiKey": "your-samsara-api-key",
         "groupId": "optional-group-id"
       },
       "syncFrequency": "hourly"
     }'
   ```

### Geotab (Fleet Telematics)

1. **Get Credentials:**
   - Geotab username
   - Geotab password
   - Database name
   - Server (default: my.geotab.com)

2. **Configure in Cortiware:**
   ```bash
   curl -X POST https://your-domain.com/api/settings/vendors \
     -H "Content-Type: application/json" \
     -d '{
       "vendor": "geotab",
       "enabled": true,
       "credentials": {
         "username": "your-username",
         "password": "your-password",
         "database": "your-database",
         "server": "my.geotab.com"
       },
       "syncFrequency": "daily"
     }'
   ```

### Paylocity (Payroll/HR)

1. **OAuth Setup:**
   - Register application in Paylocity Developer Portal
   - Get Client ID and Client Secret
   - Get Company ID

2. **Configure in Cortiware:**
   ```bash
   curl -X POST https://your-domain.com/api/settings/vendors \
     -H "Content-Type: application/json" \
     -d '{
       "vendor": "paylocity",
       "enabled": true,
       "credentials": {
         "clientId": "your-client-id",
         "clientSecret": "your-client-secret",
         "companyId": "your-company-id"
       },
       "syncFrequency": "daily"
     }'
   ```

### Holman (Fleet Management)

1. **Get API Credentials:**
   - Contact Holman support for API access
   - Get API Key and Client ID

2. **Configure in Cortiware:**
   ```bash
   curl -X POST https://your-domain.com/api/settings/vendors \
     -H "Content-Type: application/json" \
     -d '{
       "vendor": "holman",
       "enabled": true,
       "credentials": {
         "apiKey": "your-api-key",
         "clientId": "your-client-id"
       },
       "syncFrequency": "weekly"
     }'
   ```

---

## Environment Variables

### Worker Environment Variables

Set these in Fly.io:

```bash
# Required
flyctl secrets set REDIS_URL="redis://..." --app cortiware
flyctl secrets set DATABASE_URL="postgresql://..." --app cortiware

# AWS S3 (for image processing and PDF generation)
flyctl secrets set AWS_ACCESS_KEY_ID="AKIA..." --app cortiware
flyctl secrets set AWS_SECRET_ACCESS_KEY="..." --app cortiware
flyctl secrets set AWS_REGION="us-east-1" --app cortiware
flyctl secrets set AWS_S3_BUCKET="cortiware-uploads" --app cortiware

# Optional: Worker Configuration
flyctl secrets set WORKER_CONCURRENCY="8" --app cortiware
flyctl secrets set WORKER_MAX_RETRIES="5" --app cortiware
flyctl secrets set WORKER_BACKOFF_MS="15000" --app cortiware
```

### Vercel Environment Variables

Set these in Vercel dashboard for tenant-app:

```bash
# Same AWS credentials for API routes that trigger jobs
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
AWS_S3_BUCKET=cortiware-uploads
```

---

## Testing

### 1. Test S3 Image Processing

```bash
# Enqueue an image processing job
curl -X POST https://your-domain.com/api/media/process \
  -H "Content-Type: application/json" \
  -d '{
    "fileKey": "uploads/test-image.jpg",
    "mimeType": "image/jpeg"
  }'
```

### 2. Test PDF Generation

```bash
# Generate a proposal PDF
curl -X POST https://your-domain.com/api/proposals/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "proposal",
    "documentId": "estimate-id-here"
  }'
```

### 3. Test Vendor Sync

```bash
# Trigger Samsara sync
curl -X POST https://your-domain.com/api/vendors/sync \
  -H "Content-Type: application/json" \
  -d '{
    "vendor": "samsara",
    "action": "pull"
  }'
```

### 4. Monitor Worker Logs

```bash
# View Fly.io worker logs
flyctl logs --app cortiware

# Follow logs in real-time
flyctl logs --app cortiware -f
```

---

## Production Checklist

- [ ] AWS S3 bucket created and configured
- [ ] IAM user created with appropriate permissions
- [ ] AWS credentials set in Fly.io secrets
- [ ] Vendor API credentials configured (if using)
- [ ] Worker deployed to Fly.io
- [ ] Test image processing with sample file
- [ ] Test PDF generation with sample document
- [ ] Test vendor sync (if configured)
- [ ] Monitor worker logs for errors
- [ ] Set up CloudWatch/monitoring alerts (optional)

---

## Troubleshooting

### Image Processing Fails

1. Check AWS credentials are correct
2. Verify S3 bucket exists and is accessible
3. Check file size limits (max 50MB)
4. Review worker logs for sharp errors

### PDF Generation Fails

1. Verify Puppeteer is installed in worker
2. Check memory limits in Fly.io
3. Review HTML template for errors
4. Check S3 upload permissions

### Vendor Sync Fails

1. Verify vendor credentials are correct
2. Test API connection manually
3. Check rate limits
4. Review vendor API documentation

---

## Next Steps

1. Set up monitoring and alerting
2. Configure backup and disaster recovery
3. Implement rate limiting for vendor APIs
4. Add retry logic for failed syncs
5. Set up scheduled cron jobs for automatic syncs

