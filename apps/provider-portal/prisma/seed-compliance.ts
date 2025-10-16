/**
 * Seed Compliance Data
 *
 * Creates initial compliance frameworks, data retention policies,
 * encryption configurations, and vulnerability scan records.
 */

import { PrismaClient } from '@prisma/client-provider';

const prisma = new PrismaClient();

async function seedCompliance() {
  console.log('🔒 Seeding compliance data...');

  // Create Compliance Frameworks
  const frameworks = await Promise.all([
    prisma.complianceFramework.upsert({
      where: { framework: 'SOC2' },
      update: {},
      create: {
        framework: 'SOC2',
        status: 'compliant',
        lastAuditDate: new Date('2024-09-15'),
        nextAuditDate: new Date('2025-09-15'),
        certificationUrl: 'https://example.com/soc2-cert.pdf',
        notes: 'SOC 2 Type II certification completed. All controls in place.',
      },
    }),
    prisma.complianceFramework.upsert({
      where: { framework: 'HIPAA' },
      update: {},
      create: {
        framework: 'HIPAA',
        status: 'partial',
        lastAuditDate: new Date('2024-08-01'),
        nextAuditDate: new Date('2025-02-01'),
        notes: 'HIPAA compliance in progress. Encryption and access controls implemented. Awaiting final audit.',
      },
    }),
    prisma.complianceFramework.upsert({
      where: { framework: 'GDPR' },
      update: {},
      create: {
        framework: 'GDPR',
        status: 'compliant',
        lastAuditDate: new Date('2024-07-20'),
        nextAuditDate: new Date('2025-07-20'),
        notes: 'GDPR compliance achieved. Data processing agreements in place. Privacy policy updated.',
      },
    }),
    prisma.complianceFramework.upsert({
      where: { framework: 'PCI-DSS' },
      update: {},
      create: {
        framework: 'PCI-DSS',
        status: 'non-compliant',
        notes: 'PCI-DSS compliance not yet required. Will implement when payment processing is added.',
      },
    }),
  ]);

  console.log(`✅ Created ${frameworks.length} compliance frameworks`);

  // Create Data Retention Policies
  const policies = await Promise.all([
    prisma.dataRetentionPolicy.upsert({
      where: { dataType: 'audit_logs' },
      update: {},
      create: {
        dataType: 'audit_logs',
        retentionDays: 2555, // 7 years
        autoDelete: true,
        lastReviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-09-01'),
        notes: 'Audit logs retained for 7 years per SOC 2 requirements.',
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { dataType: 'customer_data' },
      update: {},
      create: {
        dataType: 'customer_data',
        retentionDays: 1825, // 5 years
        autoDelete: false,
        lastReviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-09-01'),
        notes: 'Customer data retained for 5 years. Manual review required before deletion.',
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { dataType: 'payment_records' },
      update: {},
      create: {
        dataType: 'payment_records',
        retentionDays: 2555, // 7 years
        autoDelete: false,
        lastReviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-09-01'),
        notes: 'Payment records retained for 7 years per financial regulations.',
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { dataType: 'session_logs' },
      update: {},
      create: {
        dataType: 'session_logs',
        retentionDays: 90,
        autoDelete: true,
        lastReviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-09-01'),
        notes: 'Session logs retained for 90 days for security monitoring.',
      },
    }),
    prisma.dataRetentionPolicy.upsert({
      where: { dataType: 'error_logs' },
      update: {},
      create: {
        dataType: 'error_logs',
        retentionDays: 365,
        autoDelete: true,
        lastReviewDate: new Date('2024-09-01'),
        nextReviewDate: new Date('2025-09-01'),
        notes: 'Error logs retained for 1 year for debugging and analysis.',
      },
    }),
  ]);

  console.log(`✅ Created ${policies.length} data retention policies`);

  // Create Encryption Configurations
  const encryptionConfigs = await Promise.all([
    prisma.encryptionConfig.upsert({
      where: { component: 'database' },
      update: {},
      create: {
        component: 'database',
        encrypted: true,
        algorithm: 'AES-256-GCM',
        keyRotationDate: new Date('2024-09-01'),
        nextRotationDate: new Date('2025-03-01'),
        notes: 'Database encryption at rest using Neon PostgreSQL built-in encryption.',
      },
    }),
    prisma.encryptionConfig.upsert({
      where: { component: 'api_keys' },
      update: {},
      create: {
        component: 'api_keys',
        encrypted: true,
        algorithm: 'AES-256-GCM',
        keyRotationDate: new Date('2024-09-01'),
        nextRotationDate: new Date('2025-03-01'),
        notes: 'API keys encrypted using application-level encryption before storage.',
      },
    }),
    prisma.encryptionConfig.upsert({
      where: { component: 'backups' },
      update: {},
      create: {
        component: 'backups',
        encrypted: true,
        algorithm: 'AES-256-GCM',
        notes: 'Automated backups encrypted by Neon PostgreSQL.',
      },
    }),
    prisma.encryptionConfig.upsert({
      where: { component: 'file_storage' },
      update: {},
      create: {
        component: 'file_storage',
        encrypted: true,
        algorithm: 'AES-256',
        notes: 'File storage encryption provided by Vercel Blob storage.',
      },
    }),
    prisma.encryptionConfig.upsert({
      where: { component: 'transit' },
      update: {},
      create: {
        component: 'transit',
        encrypted: true,
        algorithm: 'TLS 1.3',
        notes: 'All data in transit encrypted using TLS 1.3.',
      },
    }),
  ]);

  console.log(`✅ Created ${encryptionConfigs.length} encryption configurations`);

  // Create Sample Vulnerability Scans
  const scans = await Promise.all([
    prisma.vulnerabilityScan.create({
      data: {
        scanDate: new Date('2024-10-15'),
        scanner: 'Snyk',
        totalVulns: 12,
        criticalVulns: 0,
        highVulns: 2,
        mediumVulns: 5,
        lowVulns: 5,
        resolvedVulns: 10,
        reportUrl: 'https://app.snyk.io/org/cortiware/reports/2024-10-15',
        notes: 'Monthly vulnerability scan. 2 high-severity issues identified and patched.',
      },
    }),
    prisma.vulnerabilityScan.create({
      data: {
        scanDate: new Date('2024-09-15'),
        scanner: 'Snyk',
        totalVulns: 8,
        criticalVulns: 0,
        highVulns: 1,
        mediumVulns: 3,
        lowVulns: 4,
        resolvedVulns: 8,
        reportUrl: 'https://app.snyk.io/org/cortiware/reports/2024-09-15',
        notes: 'Monthly vulnerability scan. All issues resolved.',
      },
    }),
    prisma.vulnerabilityScan.create({
      data: {
        scanDate: new Date('2024-08-15'),
        scanner: 'Dependabot',
        totalVulns: 15,
        criticalVulns: 1,
        highVulns: 3,
        mediumVulns: 6,
        lowVulns: 5,
        resolvedVulns: 15,
        reportUrl: 'https://github.com/cortiware/platform/security/dependabot',
        notes: 'Automated dependency scan. 1 critical vulnerability in lodash patched immediately.',
      },
    }),
  ]);

  console.log(`✅ Created ${scans.length} vulnerability scan records`);

  // Create Sample Compliance Audits
  const soc2Framework = frameworks.find(f => f.framework === 'SOC2');
  if (soc2Framework) {
    const audit = await prisma.complianceAudit.create({
      data: {
        frameworkId: soc2Framework.id,
        auditDate: new Date('2024-09-15'),
        auditor: 'Deloitte & Touche LLP',
        result: 'pass',
        reportUrl: 'https://example.com/soc2-audit-2024.pdf',
        notes: 'SOC 2 Type II audit completed successfully. No major findings.',
      },
    });

    // Create Sample Findings
    await Promise.all([
      prisma.complianceFinding.create({
        data: {
          frameworkId: soc2Framework.id,
          auditId: audit.id,
          severity: 'low',
          title: 'Password complexity requirements documentation',
          description: 'Password complexity requirements should be documented in security policy.',
          remediation: 'Updated security policy to include password complexity requirements.',
          status: 'resolved',
          resolvedDate: new Date('2024-09-20'),
          assignedTo: 'security-team@cortiware.com',
        },
      }),
      prisma.complianceFinding.create({
        data: {
          frameworkId: soc2Framework.id,
          auditId: audit.id,
          severity: 'medium',
          title: 'Access review process automation',
          description: 'Quarterly access reviews should be automated to ensure consistency.',
          remediation: 'Implemented automated access review workflow.',
          status: 'resolved',
          resolvedDate: new Date('2024-09-25'),
          assignedTo: 'engineering@cortiware.com',
        },
      }),
    ]);

    console.log(`✅ Created audit and findings for SOC2 framework`);
  }

  console.log('✅ Compliance data seeding complete!');
}

async function main() {
  try {
    await seedCompliance();
  } catch (error) {
    console.error('❌ Error seeding compliance data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

