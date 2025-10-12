# Backup and Disaster Recovery Runbook

**Last Updated**: 2025-10-12  
**Owner**: DevOps/Infrastructure Team  
**Review Frequency**: Quarterly

## Overview

This document outlines backup procedures, disaster recovery protocols, and business continuity plans for the Cortiware platform.

## System Components

### 1. Databases (PostgreSQL)

**Primary Database**: Tenant data (tenant-app)
- Location: Managed PostgreSQL service (Vercel Postgres, Supabase, or similar)
- Data: Organizations, Users, Leads, Opportunities, CRM data
- Criticality: **CRITICAL** - Core business data

**Provider Database**: Provider portal data
- Location: Managed PostgreSQL service
- Data: Tenants, Federation keys, API keys, Audit logs, RBAC data
- Criticality: **CRITICAL** - Platform operations

### 2. Key-Value Store (Redis/Vercel KV)

- Location: Vercel KV or Redis
- Data: Sessions, nonces, rate limits, cache
- Criticality: **MEDIUM** - Temporary data, can be regenerated

### 3. Application Code

- Location: GitHub repository
- Data: Source code, configuration
- Criticality: **CRITICAL** - Platform functionality

### 4. Vercel Deployments

- Location: Vercel platform
- Data: Build artifacts, environment variables
- Criticality: **HIGH** - Production availability

## Backup Strategy

### Database Backups

#### Automated Backups

**Daily Full Backups**
- Schedule: 2:00 AM UTC daily
- Retention: 30 days
- Storage: Provider's backup storage (encrypted at rest)
- Verification: Weekly restore test to staging environment

**Point-in-Time Recovery (PITR)**
- Enabled: Yes (if supported by provider)
- Retention: 7 days
- Granularity: 5-minute intervals

#### Manual Backups

**Before Major Changes**
- Trigger: Before schema migrations, major releases
- Process: Manual snapshot via provider dashboard or CLI
- Retention: 90 days
- Label: Include change ticket number and date

**Example (Vercel Postgres)**:
```bash
# Create manual backup
vercel postgres backup create --name="pre-migration-2025-10-12"

# List backups
vercel postgres backup list

# Restore from backup
vercel postgres backup restore <backup-id>
```

#### Backup Verification

**Weekly Restore Tests**
- Schedule: Every Sunday 3:00 AM UTC
- Process:
  1. Restore latest backup to staging database
  2. Run smoke tests (connection, query, data integrity)
  3. Verify row counts match production
  4. Document results in backup log

**Quarterly DR Drills**
- Schedule: First Sunday of each quarter
- Process: Full disaster recovery simulation (see DR Procedures below)
- Duration: 2-4 hours
- Participants: DevOps, Engineering leads, Product owner

### Code Repository Backups

**GitHub Repository**
- Primary: GitHub.com (christcr2012/Cortiware)
- Backup: GitHub's built-in redundancy
- Additional: Weekly clone to secure offline storage (optional)

**Environment Variables**
- Storage: Vercel dashboard (encrypted)
- Backup: Encrypted export stored in secure vault (1Password, AWS Secrets Manager)
- Update: After any environment variable change

### KV/Redis Backups

**Vercel KV**
- Automatic: Managed by Vercel (persistence enabled)
- Manual: Not required (ephemeral data)
- Recovery: Data regenerates on application restart

**Redis (if self-hosted)**
- RDB snapshots: Every 6 hours
- AOF (Append-Only File): Enabled
- Retention: 7 days

## Disaster Recovery Procedures

### Scenario 1: Database Corruption or Data Loss

**Detection**:
- Application errors (500s, database connection failures)
- Data integrity issues reported by users
- Monitoring alerts (error rate spike)

**Recovery Steps**:

1. **Assess Impact** (5 minutes)
   - Identify affected tables/data
   - Determine time of corruption
   - Estimate data loss window

2. **Stop Writes** (2 minutes)
   - Enable maintenance mode (if available)
   - Or: Scale down application to 0 instances temporarily

3. **Restore from Backup** (15-30 minutes)
   ```bash
   # Identify backup to restore
   vercel postgres backup list
   
   # Restore to new database instance
   vercel postgres backup restore <backup-id> --target=recovery-db
   
   # Verify data integrity
   psql -h recovery-db -U user -d cortiware -c "SELECT COUNT(*) FROM organizations;"
   ```

4. **Update Connection Strings** (5 minutes)
   - Update `DATABASE_URL` in Vercel environment variables
   - Point to recovered database

5. **Redeploy Applications** (10 minutes)
   ```bash
   # Trigger redeployment
   vercel --prod
   ```

6. **Verify Recovery** (10 minutes)
   - Test critical user flows (login, CRM access, data retrieval)
   - Check error rates in monitoring
   - Verify data integrity with spot checks

7. **Post-Mortem** (within 24 hours)
   - Document root cause
   - Identify prevention measures
   - Update runbook if needed

**Total RTO (Recovery Time Objective)**: 1 hour  
**Total RPO (Recovery Point Objective)**: 24 hours (daily backups) or 5 minutes (PITR)

### Scenario 2: Complete Platform Outage (Vercel Down)

**Detection**:
- All apps return 503/504 errors
- Vercel status page shows incident
- Monitoring alerts (uptime checks fail)

**Recovery Steps**:

1. **Verify Outage** (2 minutes)
   - Check Vercel status page: https://www.vercel-status.com/
   - Confirm with Vercel support

2. **Communicate** (5 minutes)
   - Post status update to customers (status page, email)
   - Notify internal stakeholders

3. **Monitor Vercel Status** (ongoing)
   - Track incident updates
   - Estimate restoration time

4. **If Extended Outage (>4 hours)**: Deploy to Backup Platform
   - **Option A**: Deploy to Netlify
     ```bash
     # Install Netlify CLI
     npm install -g netlify-cli
     
     # Deploy apps
     cd apps/tenant-app && netlify deploy --prod
     cd apps/provider-portal && netlify deploy --prod
     ```
   
   - **Option B**: Deploy to AWS Amplify, Railway, or Render
   
   - **Update DNS**: Point domains to new platform (if using custom domains)

5. **Verify Recovery** (15 minutes)
   - Test all critical flows
   - Verify database connectivity
   - Check environment variables

**Total RTO**: 4-6 hours (for backup platform deployment)  
**Total RPO**: 0 (database not affected)

### Scenario 3: Accidental Data Deletion

**Detection**:
- User reports missing data
- Audit logs show DELETE operations
- Data integrity checks fail

**Recovery Steps**:

1. **Identify Scope** (10 minutes)
   - Query audit logs for deletion events
   - Identify affected records and time range
   - Determine if soft-delete or hard-delete

2. **If Soft-Delete**: Restore from Application
   ```sql
   -- Restore soft-deleted records
   UPDATE organizations 
   SET deleted_at = NULL 
   WHERE id IN (...);
   ```

3. **If Hard-Delete**: Restore from Backup
   - Restore backup to temporary database
   - Export affected records
   ```sql
   -- Export deleted records
   COPY (SELECT * FROM organizations WHERE id IN (...)) 
   TO '/tmp/deleted_orgs.csv' CSV HEADER;
   ```
   - Import to production database
   ```sql
   -- Import records
   COPY organizations FROM '/tmp/deleted_orgs.csv' CSV HEADER;
   ```

4. **Verify Recovery** (10 minutes)
   - Confirm records are restored
   - Verify data integrity
   - Test affected user workflows

**Total RTO**: 30 minutes - 2 hours  
**Total RPO**: 24 hours (daily backups)

### Scenario 4: Security Breach / Compromised Credentials

**Detection**:
- Unusual API activity
- Failed authentication attempts spike
- Security alerts from monitoring tools

**Recovery Steps**:

1. **Immediate Actions** (5 minutes)
   - Rotate all API keys and secrets
   - Invalidate all active sessions
   - Enable IP allowlisting (if available)

2. **Assess Damage** (30 minutes)
   - Review audit logs for unauthorized access
   - Identify compromised data
   - Determine breach timeline

3. **Rotate Credentials** (15 minutes)
   ```bash
   # Rotate database credentials
   # Rotate Vercel KV tokens
   # Rotate SendGrid API keys
   # Rotate Stripe API keys
   # Rotate any third-party API keys
   ```

4. **Update Environment Variables** (10 minutes)
   - Update all secrets in Vercel dashboard
   - Redeploy all applications

5. **Notify Affected Users** (if applicable)
   - Send security notification emails
   - Force password resets (if user credentials compromised)

6. **Post-Incident Review** (within 48 hours)
   - Document breach details
   - Implement additional security measures
   - Update security policies

**Total RTO**: 1-2 hours  
**Total RPO**: N/A (security incident)

## Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

| Scenario | RTO | RPO | Priority |
|----------|-----|-----|----------|
| Database corruption | 1 hour | 24 hours (daily) or 5 min (PITR) | P0 |
| Platform outage (Vercel) | 4-6 hours | 0 | P1 |
| Accidental data deletion | 30 min - 2 hours | 24 hours | P1 |
| Security breach | 1-2 hours | N/A | P0 |
| KV/Redis failure | 15 minutes | 0 (ephemeral) | P2 |

## Monitoring and Alerting

### Critical Alerts

**Database Health**
- Metric: Connection failures, query latency
- Threshold: >5% error rate or >1s p95 latency
- Alert: PagerDuty, Slack #alerts

**Application Uptime**
- Metric: HTTP 5xx error rate
- Threshold: >1% error rate
- Alert: PagerDuty, Slack #alerts

**Backup Success**
- Metric: Backup job completion
- Threshold: Failed backup
- Alert: Email, Slack #ops

### Monitoring Tools

- **Vercel Analytics**: Application performance, error rates
- **Database Provider Dashboard**: Database health, query performance
- **Uptime Monitoring**: Pingdom, UptimeRobot, or similar
- **Error Tracking**: Sentry (recommended for future implementation)

## Contact Information

### Escalation Path

1. **On-Call Engineer**: [Contact info]
2. **Engineering Lead**: [Contact info]
3. **CTO/VP Engineering**: [Contact info]

### External Contacts

- **Vercel Support**: support@vercel.com, https://vercel.com/support
- **Database Provider Support**: [Provider-specific contact]
- **GitHub Support**: https://support.github.com/

## Appendix

### Backup Verification Checklist

- [ ] Backup completed successfully
- [ ] Backup size is reasonable (not 0 bytes, not unexpectedly large)
- [ ] Restore test to staging completed
- [ ] Row counts match production
- [ ] Sample queries return expected results
- [ ] Backup retention policy enforced (old backups deleted)

### DR Drill Checklist

- [ ] Scenario selected and documented
- [ ] Participants notified
- [ ] Backup identified for restore
- [ ] Restore to staging environment
- [ ] Application redeployed
- [ ] Smoke tests passed
- [ ] Recovery time measured
- [ ] Lessons learned documented
- [ ] Runbook updated (if needed)

### Useful Commands

```bash
# Vercel Postgres
vercel postgres backup list
vercel postgres backup create --name="manual-backup"
vercel postgres backup restore <backup-id>

# Database connection test
psql $DATABASE_URL -c "SELECT 1;"

# Export database schema
pg_dump $DATABASE_URL --schema-only > schema.sql

# Export database data
pg_dump $DATABASE_URL --data-only > data.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

## Revision History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-12 | 1.0 | Initial runbook creation | AI Agent |

## Next Review Date

**2026-01-12** (Quarterly review)

