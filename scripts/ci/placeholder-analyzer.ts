/**
 * Intelligent Placeholder Analyzer
 * 
 * Classifies placeholders into:
 * - BLOCKED: Cannot be implemented yet (missing dependencies)
 * - ACTIONABLE: Can be implemented now
 * - DOCUMENTATION: Informational only
 * 
 * Generates structured tracking for AI agents and human developers.
 */

import { readFileSync } from 'fs';

export type PlaceholderType = 'BLOCKED' | 'ACTIONABLE' | 'DOCUMENTATION';

export interface Dependency {
  type: 'prisma_model' | 'api_endpoint' | 'package' | 'service' | 'feature';
  name: string;
  reason: string;
}

export interface PlaceholderClassification {
  file: string;
  line: number;
  marker: string;
  snippet: string;
  contextLines: string[];
  classification: PlaceholderType;
  dependencies: Dependency[];
  phaseMarker?: string; // e.g., "Phase 2", "Phase 3"
  confidence: number; // 0-1
  reasoning: string;
}

/**
 * Patterns that indicate a placeholder is legitimately blocked
 */
const BLOCKER_PATTERNS = [
  // Explicit phase markers
  { regex: /Phase\s+(\d+)[:\s]/i, extract: (match: RegExpMatchArray) => ({ phase: match[1] }) },
  
  // Dependency markers
  { regex: /depends on\s+(.+)/i, extract: (match: RegExpMatchArray) => ({ dependency: match[1] }) },
  { regex: /blocked by\s+(.+)/i, extract: (match: RegExpMatchArray) => ({ blocker: match[1] }) },
  { regex: /requires\s+(.+)/i, extract: (match: RegExpMatchArray) => ({ requirement: match[1] }) },
  { regex: /when\s+(.+?)\s+(?:is|are)\s+(?:implemented|built|ready)/i, extract: (match: RegExpMatchArray) => ({ prerequisite: match[1] }) },
  { regex: /after\s+(.+?)\s+(?:is|are)\s+(?:implemented|built|ready)/i, extract: (match: RegExpMatchArray) => ({ prerequisite: match[1] }) },
  
  // Stub implementations with clear future work markers
  { regex: /stub\s+(?:implementation|data)/i, extract: () => ({ isStub: true }) },
  { regex: /placeholder\s+(?:implementation|data)/i, extract: () => ({ isPlaceholder: true }) },
  
  // Integration markers
  { regex: /(?:integrate|integration)\s+with\s+(.+)/i, extract: (match: RegExpMatchArray) => ({ integration: match[1] }) },
  { regex: /real\s+(.+?)\s+(?:integration|implementation)/i, extract: (match: RegExpMatchArray) => ({ realImplementation: match[1] }) },
  
  // Service/model references
  { regex: /(?:Query|Save|Update|Create)\s+(?:real|from)\s+(.+?)\s+(?:table|model)/i, extract: (match: RegExpMatchArray) => ({ model: match[1] }) },
  { regex: /(?:via|using)\s+(Twilio|Stripe|SendGrid|AWS|Redis|WebSocket|OIDC)/i, extract: (match: RegExpMatchArray) => ({ service: match[1] }) },
];

/**
 * Patterns that indicate actionable work (should be implemented now)
 */
const ACTIONABLE_PATTERNS = [
  /\bFIXME\b/i,
  /\bHACK\b/i,
  /\bXXX\b/i,
  /quick\s+fix/i,
  /temporary/i,
  /workaround/i,
  /refactor\s+this/i,
  /clean\s+this\s+up/i,
];

/**
 * Known dependencies from Prisma schema audit
 */
const KNOWN_PRISMA_MODELS = new Set([
  // Phase 1 (Fully Implemented)
  'Tenant', 'User', 'UserProfile', 'Session', 'PasswordReset', 'Subscription',
  'SubscriptionPlan', 'PricingComponent', 'Invoice', 'Payment',
  
  // Phase 2 (Partially Implemented)
  'Lead', 'Customer', 'Contact', 'Org', 'Opportunity', 'Job', 'Estimate',
  'TimeEntry', 'RecurringService', 'Subcontractor', 'JobCost',
  'Communication', 'CommunicationThread',
  'AIUsageEvent', 'AIBudget', 'AIAlert',
  
  // Phase 2 (Not Implemented)
  'Vehicle', 'Equipment', 'Inventory', 'InventoryLocation', 'StockMovement',
  'Document', 'DocumentTemplate', 'Report', 'ReportSchedule',
  'Notification', 'NotificationPreference', 'NotificationDelivery',
  'Role', 'Permission', 'RolePermission',
  'VerticalPack', 'CustomField', 'CustomFieldValue',
  'Workflow', 'WorkflowStep', 'WorkflowExecution',
  'FeatureFlag', 'FeatureFlagRule',
]);

const KNOWN_SERVICES = new Set([
  'Twilio', 'SendGrid', 'AWS SES', 'Stripe', 'Redis', 'WebSocket', 'OIDC',
  'Resend', 'Vercel Blob', 'BullMQ',
]);

/**
 * Analyze a placeholder and classify it
 */
export function analyzePlaceholder(
  file: string,
  line: number,
  marker: string,
  snippet: string,
  fullFileContent: string
): PlaceholderClassification {
  const lines = fullFileContent.split(/\r?\n/);
  const contextStart = Math.max(0, line - 6);
  const contextEnd = Math.min(lines.length, line + 5);
  const contextLines = lines.slice(contextStart, contextEnd);
  const fullContext = contextLines.join('\n');
  
  // Check for explicit phase markers
  let phaseMarker: string | undefined;
  const phaseMatch = fullContext.match(/Phase\s+(\d+)/i);
  if (phaseMatch) {
    phaseMarker = `Phase ${phaseMatch[1]}`;
  }
  
  // Extract dependencies
  const dependencies: Dependency[] = [];
  
  // Check for blocker patterns
  let hasBlocker = false;
  for (const pattern of BLOCKER_PATTERNS) {
    const match = fullContext.match(pattern.regex);
    if (match) {
      hasBlocker = true;
      const extracted = pattern.extract(match) as any;
      
      // Extract specific dependency info
      if (extracted.model) {
        dependencies.push({
          type: 'prisma_model',
          name: extracted.model,
          reason: `Requires Prisma model: ${extracted.model}`
        });
      }
      if (extracted.service) {
        dependencies.push({
          type: 'service',
          name: extracted.service,
          reason: `Requires external service: ${extracted.service}`
        });
      }
      if (extracted.integration) {
        dependencies.push({
          type: 'service',
          name: extracted.integration,
          reason: `Requires integration: ${extracted.integration}`
        });
      }
      if (extracted.dependency || extracted.blocker || extracted.prerequisite) {
        const depName = extracted.dependency || extracted.blocker || extracted.prerequisite;
        dependencies.push({
          type: 'feature',
          name: depName,
          reason: `Depends on: ${depName}`
        });
      }
    }
  }
  
  // Detect Prisma model references
  for (const model of KNOWN_PRISMA_MODELS) {
    const modelRegex = new RegExp(`\\b${model}\\b`, 'i');
    if (fullContext.match(modelRegex)) {
      // Check if it's a "not yet implemented" context
      if (fullContext.match(/(?:from|query|save|update|create).{0,30}table/i)) {
        dependencies.push({
          type: 'prisma_model',
          name: model,
          reason: `Requires real database operations on ${model} model`
        });
        hasBlocker = true;
      }
    }
  }
  
  // Detect service references
  for (const service of KNOWN_SERVICES) {
    const serviceRegex = new RegExp(`\\b${service}\\b`, 'i');
    if (fullContext.match(serviceRegex)) {
      if (fullContext.match(/(?:via|using|send|integrate|implementation)/i)) {
        dependencies.push({
          type: 'service',
          name: service,
          reason: `Requires ${service} integration`
        });
        hasBlocker = true;
      }
    }
  }
  
  // Check for actionable patterns
  let isActionable = false;
  for (const pattern of ACTIONABLE_PATTERNS) {
    if (fullContext.match(pattern)) {
      isActionable = true;
      break;
    }
  }
  
  // Classify
  let classification: PlaceholderType;
  let confidence: number;
  let reasoning: string;
  
  if (phaseMarker && phaseMarker !== 'Phase 1') {
    // Explicitly marked for future phase
    classification = 'BLOCKED';
    confidence = 0.95;
    reasoning = `Explicitly marked as ${phaseMarker} work`;
  } else if (dependencies.length > 0 && hasBlocker) {
    // Has clear dependencies
    classification = 'BLOCKED';
    confidence = 0.85;
    reasoning = `Blocked by ${dependencies.length} dependency/dependencies: ${dependencies.map(d => d.name).join(', ')}`;
  } else if (isActionable) {
    // Marked as something that should be fixed now
    classification = 'ACTIONABLE';
    confidence = 0.9;
    reasoning = 'Contains actionable marker (FIXME, HACK, temporary workaround, etc.)';
  } else if (fullContext.match(/stub\s+(?:implementation|data)/i)) {
    // Generic stub without clear phase marker - might be actionable
    classification = 'ACTIONABLE';
    confidence = 0.6;
    reasoning = 'Stub implementation without clear phase marker or dependencies';
  } else {
    // Documentation or unclear
    classification = 'DOCUMENTATION';
    confidence = 0.7;
    reasoning = 'No clear blockers or actionable indicators - may be documentation';
  }
  
  return {
    file,
    line,
    marker,
    snippet,
    contextLines,
    classification,
    dependencies,
    phaseMarker,
    confidence,
    reasoning,
  };
}

/**
 * Generate a structured TODO comment for a blocked placeholder
 */
export function generateStructuredTodo(classification: PlaceholderClassification): string {
  const lines: string[] = [];
  
  lines.push(`// TODO [${classification.classification}]`);
  if (classification.phaseMarker) {
    lines.push(`// Phase: ${classification.phaseMarker}`);
  }
  if (classification.dependencies.length > 0) {
    lines.push(`// Dependencies:`);
    for (const dep of classification.dependencies) {
      lines.push(`//   - [${dep.type}] ${dep.name}: ${dep.reason}`);
    }
  }
  lines.push(`// Reasoning: ${classification.reasoning}`);
  lines.push(`// Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
  
  return lines.join('\n');
}

/**
 * Generate GitHub issue body for a blocked placeholder
 */
export function generateGitHubIssue(classification: PlaceholderClassification): {
  title: string;
  body: string;
  labels: string[];
} {
  const title = classification.phaseMarker 
    ? `[${classification.phaseMarker}] ${classification.marker} in ${classification.file.split(/[\\/]/).pop()}`
    : `${classification.marker} in ${classification.file.split(/[\\/]/).pop()}`;
  
  const bodyLines: string[] = [];
  bodyLines.push(`## Context`);
  bodyLines.push('');
  bodyLines.push(`**File:** \`${classification.file}\``);
  bodyLines.push(`**Line:** ${classification.line}`);
  if (classification.phaseMarker) {
    bodyLines.push(`**Phase:** ${classification.phaseMarker}`);
  }
  bodyLines.push('');
  bodyLines.push(`## Placeholder`);
  bodyLines.push('');
  bodyLines.push('```');
  bodyLines.push(classification.snippet);
  bodyLines.push('```');
  bodyLines.push('');
  
  if (classification.dependencies.length > 0) {
    bodyLines.push(`## Dependencies`);
    bodyLines.push('');
    for (const dep of classification.dependencies) {
      bodyLines.push(`- **${dep.type}**: ${dep.name}`);
      bodyLines.push(`  - ${dep.reason}`);
    }
    bodyLines.push('');
  }
  
  bodyLines.push(`## Classification`);
  bodyLines.push('');
  bodyLines.push(`**Type:** ${classification.classification}`);
  bodyLines.push(`**Confidence:** ${(classification.confidence * 100).toFixed(0)}%`);
  bodyLines.push(`**Reasoning:** ${classification.reasoning}`);
  bodyLines.push('');
  
  bodyLines.push(`## Context`);
  bodyLines.push('');
  bodyLines.push('```');
  bodyLines.push(classification.contextLines.join('\n'));
  bodyLines.push('```');
  
  const labels: string[] = [];
  if (classification.classification === 'BLOCKED') {
    labels.push('blocked');
  } else if (classification.classification === 'ACTIONABLE') {
    labels.push('technical-debt');
  }
  if (classification.phaseMarker) {
    labels.push(classification.phaseMarker.toLowerCase().replace(/\s+/g, '-'));
  }
  labels.push('placeholder');
  
  return { title, body: bodyLines.join('\n'), labels };
}
