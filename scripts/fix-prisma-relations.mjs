/**
 * Fix Prisma Relation Names
 * 
 * Fixes all lowercase relation names to match Prisma's capitalized convention
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Relation mappings
const fixes = [
  // Include statements
  { pattern: /include:\s*\{\s*customer\s*:/g, replacement: 'include: { Customer:' },
  { pattern: /include:\s*\{\s*job\s*:/g, replacement: 'include: { Job:' },
  { pattern: /include:\s*\{\s*invoice\s*:/g, replacement: 'include: { Invoice:' },
  { pattern: /include:\s*\{\s*org\s*:/g, replacement: 'include: { Org:' },
  { pattern: /include:\s*\{\s*user\s*:/g, replacement: 'include: { User:' },
  { pattern: /include:\s*\{\s*payment\s*:/g, replacement: 'include: { Payment:' },
  { pattern: /include:\s*\{\s*payments\s*:/g, replacement: 'include: { Payment:' },
  { pattern: /include:\s*\{\s*contacts\s*:/g, replacement: 'include: { CustomerContact:' },
  { pattern: /include:\s*\{\s*timeline\s*:/g, replacement: 'include: { JobTimeline:' },
  { pattern: /include:\s*\{\s*photos\s*:/g, replacement: 'include: { JobPhoto:' },
  { pattern: /include:\s*\{\s*lineItems\s*:/g, replacement: 'include: { InvoiceLine:' },
  { pattern: /include:\s*\{\s*reminders\s*:/g, replacement: 'include: { InvoiceReminder:' },
  
  // Cleaning vertical
  { pattern: /include:\s*\{\s*lead\s*:/g, replacement: 'include: { CleaningLead:' },
  { pattern: /include:\s*\{\s*estimate\s*:/g, replacement: 'include: { CleaningEstimate:' },
  { pattern: /include:\s*\{\s*estimates\s*:/g, replacement: 'include: { CleaningEstimate:' },
  { pattern: /include:\s*\{\s*contract\s*:/g, replacement: 'include: { CleaningContract:' },
  { pattern: /include:\s*\{\s*workOrders\s*:/g, replacement: 'include: { CleaningWorkOrder:' },
  
  // _count selects
  { pattern: /_count:\s*\{\s*select:\s*\{\s*jobs\s*:/g, replacement: '_count: { select: { Job:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*customers\s*:/g, replacement: '_count: { select: { Customer:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*invoices\s*:/g, replacement: '_count: { select: { Invoice:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*users\s*:/g, replacement: '_count: { select: { User:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*payments\s*:/g, replacement: '_count: { select: { Payment:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*photos\s*:/g, replacement: '_count: { select: { JobPhoto:' },
  
  // Property access on query results (NOT prisma client)
  // Only capitalize if it's NOT prisma.model
  { pattern: /(?<!prisma\.)(\w+)\.customer(?![a-zA-Z])/g, replacement: '$1.Customer' },
  { pattern: /(?<!prisma\.)(\w+)\.job(?![a-zA-Z])/g, replacement: '$1.Job' },
  { pattern: /(?<!prisma\.)(\w+)\.invoice(?![a-zA-Z])/g, replacement: '$1.Invoice' },
  { pattern: /(?<!prisma\.)(\w+)\.org(?![a-zA-Z])/g, replacement: '$1.Org' },
  { pattern: /(?<!prisma\.)(\w+)\.payments(?![a-zA-Z])/g, replacement: '$1.Payment' },

  // More relations
  { pattern: /include:\s*\{\s*template\s*:/g, replacement: 'include: { AgreementTemplate:' },
  { pattern: /include:\s*\{\s*workOrders\s*:/g, replacement: 'include: { CleaningWorkOrder:' },
  { pattern: /include:\s*\{\s*lineItems\s*:/g, replacement: 'include: { InvoiceLine:' },
  { pattern: /include:\s*\{\s*photos\s*:/g, replacement: 'include: { JobPhoto:' },
  { pattern: /include:\s*\{\s*jobs\s*:/g, replacement: 'include: { Job:' },
  { pattern: /include:\s*\{\s*invoices\s*:/g, replacement: 'include: { Invoice:' },

  // Select statements
  { pattern: /select:\s*\{\s*template\s*:/g, replacement: 'select: { AgreementTemplate:' },
  { pattern: /select:\s*\{\s*lead\s*:/g, replacement: 'select: { CleaningLead:' },
  { pattern: /select:\s*\{\s*contract\s*:/g, replacement: 'select: { CleaningContract:' },
  { pattern: /select:\s*\{\s*estimate\s*:/g, replacement: 'select: { CleaningEstimate:' },
  { pattern: /select:\s*\{\s*customer\s*:/g, replacement: 'select: { Customer:' },
  { pattern: /select:\s*\{\s*job\s*:/g, replacement: 'select: { Job:' },

  // More include patterns for Cleaning vertical
  { pattern: /include:\s*\{\s*contract\s*:/g, replacement: 'include: { CleaningContract:' },
  { pattern: /include:\s*\{\s*workOrders\s*:/g, replacement: 'include: { CleaningWorkOrder:' },

  // Select patterns for Cleaning vertical
  { pattern: /select:\s*\{\s*contract\s*:/g, replacement: 'select: { CleaningContract:' },
  { pattern: /select:\s*\{\s*estimate\s*:/g, replacement: 'select: { CleaningEstimate:' },

  // _count selects - more cases
  { pattern: /_count:\s*\{\s*select:\s*\{\s*invoices\s*:/g, replacement: '_count: { select: { Invoice:' },
  { pattern: /_count:\s*\{\s*select:\s*\{\s*timeline\s*:/g, replacement: '_count: { select: { JobTimeline:' },

  // More _count patterns
  { pattern: /select:\s*\{\s*_count:\s*\{\s*select:\s*\{\s*invoices\s*:/g, replacement: 'select: { _count: { select: { Invoice:' },
  { pattern: /select:\s*\{\s*_count:\s*\{\s*select:\s*\{\s*timeline\s*:/g, replacement: 'select: { _count: { select: { JobTimeline:' },

  // Include patterns for Invoice relations
  { pattern: /include:\s*\{\s*payments\s*:/g, replacement: 'include: { Payment:' },
  { pattern: /include:\s*\{\s*lineItems\s*:/g, replacement: 'include: { InvoiceLine:' },

  // Include patterns for Customer and Job
  { pattern: /include:\s*\{\s*jobs\s*:/g, replacement: 'include: { Job:' },
  { pattern: /include:\s*\{\s*invoices\s*:/g, replacement: 'include: { Invoice:' },

  // Where clauses
  { pattern: /where:\s*\{\s*job\s*:/g, replacement: 'where: { Job:' },
  { pattern: /where:\s*\{\s*customer\s*:/g, replacement: 'where: { Customer:' },

  // Nested creates/updates - these are the most important fixes
  { pattern: /contacts:\s*\{/g, replacement: 'CustomerContact: {' },
  { pattern: /timeline:\s*\{/g, replacement: 'JobTimeline: {' },
  { pattern: /lineItems:\s*\{/g, replacement: 'InvoiceLine: {' },
  { pattern: /photos:\s*\{/g, replacement: 'JobPhoto: {' },

  // Fix template relation (Agreement)
  { pattern: /(\s+)template:\s*\{/g, replacement: '$1AgreementTemplate: {' },

  // Fix prisma.Model back to prisma.model (undo over-correction)
  { pattern: /prisma\.Customer/g, replacement: 'prisma.customer' },
  { pattern: /prisma\.Job/g, replacement: 'prisma.job' },
  { pattern: /prisma\.Invoice/g, replacement: 'prisma.invoice' },
  { pattern: /prisma\.Org/g, replacement: 'prisma.org' },
  { pattern: /prisma\.User/g, replacement: 'prisma.user' },
  { pattern: /prisma\.Payment/g, replacement: 'prisma.payment' },
];

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  });
}

let changedFiles = 0;
const tenantAppSrc = path.join(__dirname, '..', 'apps', 'tenant-app', 'src');

walkDir(tenantAppSrc, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  fixes.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    changedFiles++;
  }
});

console.log(`✅ Fixed relation names in ${changedFiles} files`);

