# Intelligent Placeholder Detection System

**Status:** ✅ Active (Phase 0.5)  
**Mode:** Strict by default (fails CI on actionable placeholders)  
**Generated Reports:** `.ai-placeholders/` (AI-readable tracking)

---

## Overview

This system automatically analyzes **all placeholders** in the codebase and classifies them into three categories:

1. **🔴 ACTIONABLE** - Can be implemented NOW (fails CI in strict mode)
2. **🟡 BLOCKED** - Legitimately blocked by missing dependencies (non-blocking)
3. **📝 DOCUMENTATION** - Informational comments only (non-blocking)

---

## How It Works

### Detection Patterns

The system scans for these markers:
- `TODO`, `FIXME`, `HACK`, `XXX`, `STUB`
- `"Not implemented"`, `"Coming Soon"`, `"Under Construction"`
- `status: 501` (HTTP Not Implemented)

### Intelligent Classification

**BLOCKED placeholders** are detected when:
- Explicitly marked with `Phase 2`, `Phase 3`, etc.
- Reference missing Prisma models (e.g., "Query from AIUsageEvent table")
- Require external service integration (Twilio, Stripe, SendGrid, etc.)
- Have clear dependency markers:
  - `"TODO: Add X when Y is implemented"`
  - `"depends on: Feature X"`
  - `"blocked by: Service Y"`
  - `"requires: Model Z"`

**ACTIONABLE placeholders** are flagged when:
- Marked as `FIXME`, `HACK`, `XXX` (technical debt)
- Generic stubs without clear phase markers or dependencies
- Temporary workarounds or quick fixes

**DOCUMENTATION placeholders** are:
- Informational comments about future work
- No clear blocker or actionable indicator

---

## Generated Tracking Files

Every run generates three files in `.ai-placeholders/`:

### 1. `placeholders.json` (AI-Readable)

Machine-parseable JSON with all placeholders classified:

```json
{
  "generatedAt": "2025-10-27T17:02:52.909Z",
  "summary": {
    "total": 378,
    "actionable": 53,
    "blocked": 100,
    "documentation": 225
  },
  "actionable": [
    {
      "file": "apps/tenant-app/src/app/api/schedule/jobs/route.ts",
      "line": 36,
      "marker": "STUB",
      "snippet": "// Phase 1: Stub data",
      "reasoning": "Stub implementation without clear phase marker",
      "confidence": 0.6
    }
  ],
  "blocked": [
    {
      "file": "apps/tenant-app/src/app/api/ai/usage/route.ts",
      "line": 19,
      "marker": "TODO",
      "snippet": "// TODO Phase 2: Query real data from AIUsageEvent table",
      "phase": "Phase 2",
      "dependencies": [
        {
          "type": "prisma_model",
          "name": "AIUsageEvent",
          "reason": "Requires real database operations on AIUsageEvent model"
        }
      ],
      "reasoning": "Explicitly marked as Phase 2 work",
      "confidence": 0.95
    }
  ]
}
```

**Use Cases:**
- AI coding agents can parse this to prioritize work
- Automated tools can track placeholder trends over time
- CI/CD can enforce quality gates based on actionable count

### 2. `github-issues.json` (Issue Templates)

Ready-to-create GitHub issues for blocked work:

```json
[
  {
    "title": "[Phase 2] TODO in route.ts",
    "body": "## Context\n\n**File:** `apps/tenant-app/src/app/api/ai/usage/route.ts`\n**Line:** 19\n**Phase:** Phase 2\n\n## Placeholder\n\n```\n// TODO Phase 2: Query real data from AIUsageEvent table\n```\n\n## Dependencies\n\n- **prisma_model**: AIUsageEvent\n  - Requires real database operations on AIUsageEvent model\n\n## Classification\n\n**Type:** BLOCKED\n**Confidence:** 95%\n**Reasoning:** Explicitly marked as Phase 2 work",
    "labels": ["blocked", "phase-2", "placeholder"]
  }
]
```

**Use Cases:**
- Bulk-create GitHub issues for blocked work
- Track dependencies across the project
- Provide context for future developers/agents

### 3. `REPORT.md` (Human-Readable)

Markdown summary with all details:

```markdown
# Placeholder Analysis Report

**Generated:** 2025-10-27T17:02:52.909Z

## Summary

- **Total Placeholders:** 378
- **🔴 Actionable:** 53
- **🟡 Blocked:** 100
- **📝 Documentation:** 225

## 🔴 Actionable Items

These can be implemented immediately:

### `apps/tenant-app/src/app/api/schedule/jobs/route.ts:36`
**Marker:** STUB
**Reasoning:** Stub implementation without clear phase marker
```
// Phase 1: Stub data
```

## 🟡 Blocked Items

These require dependencies to be built first:

### `apps/tenant-app/src/app/api/ai/usage/route.ts:19`
**Marker:** TODO
**Phase:** Phase 2
**Reasoning:** Explicitly marked as Phase 2 work
**Dependencies:**
- `[prisma_model]` AIUsageEvent: Requires real database operations on AIUsageEvent model
```
// TODO Phase 2: Query real data from AIUsageEvent table
```
```

---

## CI Integration

### Strict Mode (Default)

```bash
npm run ci:placeholders
# Fails CI if actionable placeholders are found
```

**When it fails:**
- ❌ 53 actionable placeholders → CI exits with code 1
- ✅ 0 actionable placeholders → CI passes

**When it passes (non-blocking):**
- 🟡 Blocked placeholders → Always allowed
- 📝 Documentation placeholders → Always allowed

### Non-Strict Mode

```bash
PLACEHOLDER_STRICT=false npm run ci:placeholders
# Reports placeholders but never fails CI
```

---

## Best Practices

### ✅ DO: Write Smart Placeholders

**Blocked by dependency:**
```typescript
// TODO Phase 2: Query real alerts from AIAlert table
const alerts = await prisma.aiAlert.findMany({
  where: { tenantId, acknowledged: false }
});
```
→ ✅ **BLOCKED** (non-blocking, properly documented)

**Service integration:**
```typescript
// TODO: Send via Twilio (SMS) or Resend (email)
await twilioService.sendSMS({
  to: customer.phone,
  body: message
});
```
→ ✅ **BLOCKED** (requires Twilio integration)

**Explicit phase marker:**
```typescript
// TODO Phase 3: Set up automatic job creation schedule based on frequency
scheduleRecurringJob(service);
```
→ ✅ **BLOCKED** (Phase 3 work)

### ❌ DON'T: Write Lazy Placeholders

**Generic stub:**
```typescript
// Phase 1: Stub data
return { data: [] };
```
→ ❌ **ACTIONABLE** (no clear blocker, should be implemented)

**Vague TODO:**
```typescript
// TODO: Fix this later
```
→ ❌ **ACTIONABLE** (no dependency explanation)

**Technical debt markers:**
```typescript
// FIXME: This is a hack
// XXX: Temporary workaround
```
→ ❌ **ACTIONABLE** (should be fixed now)

---

## For AI Coding Agents

### Reading the Tracking Data

```typescript
import placeholders from './.ai-placeholders/placeholders.json';

// Find actionable work
const workToDo = placeholders.actionable.filter(
  p => p.confidence > 0.8
);

// Find blocked work ready to unblock
const blockedByModel = placeholders.blocked.filter(
  p => p.dependencies.some(d => d.type === 'prisma_model')
);

// Prioritize by phase
const phase2Work = placeholders.blocked.filter(
  p => p.phase === 'Phase 2'
);
```

### Continuation Strategy

1. **Review actionable items** - Implement these first
2. **Check blocked dependencies** - Identify what's blocking progress
3. **Cross-reference with audit** - Use `PRISMA_SCHEMA_AUDIT.md` to understand models
4. **Implement dependencies** - Build missing models/services
5. **Unblock placeholders** - Remove TODOs as dependencies are resolved

---

## Configuration

### Environment Variables

- `PLACEHOLDER_STRICT=false` - Disable strict mode (allow actionable placeholders)
- `PLACEHOLDER_STRICT=true` - Enable strict mode (default, fail on actionable)

### Exclusions

Add to `EXCLUDED_DIRS` in `scripts/ci/verify_no_placeholders.ts`:
```typescript
const EXCLUDED_DIRS = new Set<string>([
  "node_modules",
  ".next",
  "dist",
  "docs",  // Documentation can have TODOs
  // Add your directories here
]);
```

Add to `.gitignore` (tracking files are auto-generated):
```gitignore
# Generated placeholder analysis (AI-readable tracking)
.ai-placeholders/
```

---

## Examples from Your Codebase

### Current Statistics (Oct 27, 2025)

- **Total Placeholders:** 378
- **🔴 Actionable:** 53 (14%)
  - Generic "Phase 1" stubs without dependencies
  - `FIXME`, `HACK`, `XXX` markers
  - Temporary workarounds
- **🟡 Blocked:** 100 (26%)
  - Phase 2+ work (AIUsageEvent, AIAlert, AIBudget tracking)
  - Service integrations (Twilio, Stripe, Resend)
  - Missing Prisma models (Organization, Activity, Quote)
  - Authentication dependencies (OIDC, breakglass recovery)
- **📝 Documentation:** 225 (60%)
  - Informational comments about future features

### Top Blockers

1. **Phase 2 Models:** AIUsageEvent, AIAlert, AIBudget (20 placeholders)
2. **Service Integrations:** Twilio, Stripe, Resend (15 placeholders)
3. **Auth System:** User/role system, OIDC (12 placeholders)
4. **CRM Models:** Organization, Activity, Quote (8 placeholders)

---

## Maintenance

### Adding New Patterns

Edit `scripts/ci/placeholder-analyzer.ts`:

```typescript
const BLOCKER_PATTERNS = [
  // Add your pattern here
  { 
    regex: /waiting for\s+(.+)/i, 
    extract: (match) => ({ waitingFor: match[1] }) 
  },
];
```

### Adding New Services/Models

```typescript
const KNOWN_SERVICES = new Set([
  'Twilio', 'SendGrid', 'Stripe',
  'YourNewService',  // Add here
]);

const KNOWN_PRISMA_MODELS = new Set([
  'Lead', 'Customer', 'Opportunity',
  'YourNewModel',  // Add here
]);
```

---

## Benefits

### For Developers
- **Clear visibility** - Know exactly what's blocked vs. actionable
- **Context preservation** - Dependencies documented in place
- **Quality enforcement** - Can't merge lazy TODOs

### For AI Agents
- **Machine-readable** - JSON format for easy parsing
- **Prioritization** - Confidence scores guide work order
- **Dependency mapping** - Understand what blocks what

### For Project Management
- **Progress tracking** - Watch actionable count decrease over time
- **Issue generation** - Bulk-create GitHub issues for blocked work
- **Phase planning** - Know what's ready vs. what's waiting

---

## FAQ

**Q: Why does my "Phase 1" stub still fail CI?**  
A: Generic "Phase 1" markers without clear dependencies are flagged as actionable. Be specific: "Phase 1 STUB: Waiting for AIUsageEvent model implementation"

**Q: How do I disable strict mode temporarily?**  
A: `PLACEHOLDER_STRICT=false npm run ci:placeholders`

**Q: Can I add my own classification logic?**  
A: Yes! Edit `analyzePlaceholder()` in `scripts/ci/placeholder-analyzer.ts`

**Q: Where are the tracking files stored?**  
A: `.ai-placeholders/` directory (gitignored, regenerated on every run)

**Q: How do I create GitHub issues from blocked placeholders?**  
A: Use the `.ai-placeholders/github-issues.json` file with GitHub API or CLI

---

## Next Steps

1. **Review actionable items** - 53 placeholders need attention
2. **Document blockers** - Ensure all blocked placeholders have clear dependencies
3. **Implement Phase 2 models** - Unblock 20+ placeholders waiting on AI tracking models
4. **Integrate services** - Twilio/Stripe/Resend integrations will unblock 15+ placeholders

See `.ai-placeholders/REPORT.md` for the full analysis.
