# Hybrid Binder Executor - System Documentation

## 🎯 Overview

The Hybrid Binder Executor is an autonomous, self-healing system that processes all binder files sequentially with automatic fallback, validation, and quality gates.

## 📦 Components

### Core Scripts

1. **`scripts/hybrid-binder-executor.js`**
   - Main orchestrator for sequential binder processing
   - Handles pre/post validation
   - Auto-fallback to orchestrator on primary generator failure
   - Generates comprehensive reports
   - Runs quality gates and guard checks

2. **`scripts/report-failures.js`**
   - Generates detailed failure analysis
   - Provides actionable recommendations
   - Creates markdown reports with manual retry commands

3. **`.github/workflows/hybrid-binders.yml`**
   - CI/CD enforcement via GitHub Actions
   - Runs on PR to main and manual dispatch
   - Uploads reports as artifacts
   - Comments on commits with results

## 🚀 Usage

### Local Execution

```bash
# Run the complete hybrid pipeline
npm run hybrid:binders
```

This single command will:
1. Run pre-validation on all binders
2. Process each binder sequentially
3. Auto-fallback to orchestrator if primary generator fails
4. Run post-validation
5. Generate comprehensive reports
6. Run guard checks if success rate ≥95%

### Manual Workflow

```bash
# Step 1: Pre-validation
npm run binders:pre

# Step 2: Run orchestrator
npm run binders:run

# Step 3: Post-validation
npm run binders:post

# Step 4: Retry failed binders
npm run binders:retry

# Step 5: Verify code generation
npm run binders:verify

# Step 6: Run guard
npm run guard:binders
```

## 📊 Reports Generated

All reports are saved to `ops/reports/`:

### Primary Reports

- **`hybrid-run-report.json`** - Complete execution summary with per-binder status
- **`FAILURE_REPORT.md`** - Detailed failure analysis with actionable fixes
- **`validation_pre.json`** - Pre-execution validation state
- **`validation_post.json`** - Post-execution validation state
- **`orchestrator-report.json`** - Orchestrator execution details
- **`VERIFY_SUMMARY.md`** - Code verification summary
- **`verify_binder_to_code.json`** - Machine-readable verification data

### Report Structure

#### hybrid-run-report.json
```json
{
  "timestamp": "2025-10-04T16:52:04.711Z",
  "duration_seconds": 450,
  "total_binders": 28,
  "successful": 27,
  "failed": 0,
  "skipped": 1,
  "success_rate": 96,
  "binders": [
    {
      "binder": "binder1_FULL.md",
      "status": "fallback_success",
      "preValidation": {
        "detected": 3220,
        "primary": 0,
        "fallback": 3220,
        "hasContent": true
      },
      "method": "orchestrator"
    }
  ]
}
```

## 🎯 Quality Gates

### Hard Requirements (Blocking)

- **Success Rate**: ≥95%
- **Mapping Score**: 100%
- **Binder14 Artifacts**: All present
  - `src/config/system-registry.ts`
  - `src/config/binder-map.json`
  - `src/app/admin/orchestrator-panel.tsx`
- **Reports**: All generated and consistent

### Advisory Only (Non-Blocking)

- Pre-existing TypeScript errors
- API marker detection (uses orchestrator report instead)

## 🔄 Execution Flow

```
┌─────────────────────────────────────────┐
│  1. Pre-Validation                      │
│     - Detect items in all binders       │
│     - Generate validation_pre.json      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Sequential Binder Processing        │
│     For each binder:                    │
│     - Pre-validate content              │
│     - Try primary generator             │
│     - Fallback to orchestrator if fail  │
│     - Special handling for Binder14     │
│     - 1s pause between binders          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Post-Validation                     │
│     - Re-detect items                   │
│     - Generate validation_post.json     │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Report Generation                   │
│     - Calculate success rate            │
│     - Generate hybrid-run-report.json   │
│     - Print summary table               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Quality Gate Check                  │
│     If success_rate ≥ 95%:              │
│     - Run guard-binders.js              │
│     - Exit 0 on pass, 2 on fail         │
│     Else:                               │
│     - Exit 1 (low success rate)         │
└─────────────────────────────────────────┘
```

## 🛠️ System Requirements

- **Memory**: 8GB Node.js heap (configurable via NODE_OPTIONS)
- **CPU**: 13th Gen i7 or equivalent
- **GPU**: RTX 3070 (for potential future optimizations)
- **RAM**: 16GB system RAM
- **Node.js**: v20 or later
- **Platform**: Windows (PowerShell scripts), Linux/Mac compatible

## 🔧 Configuration

### Memory Limits

Adjust in `package.json`:
```json
"hybrid:binders": "cross-env NODE_OPTIONS=--max-old-space-size=8192 node scripts/hybrid-binder-executor.js"
```

### Binder Directory

Default: `C:/Users/chris/OneDrive/Desktop/binderfiles`

Change in `scripts/hybrid-binder-executor.js`:
```javascript
const BASE_DIR = "C:/Users/chris/OneDrive/Desktop/binderfiles";
```

### Success Rate Threshold

Change in `scripts/hybrid-binder-executor.js`:
```javascript
if (report.success_rate >= 95) {
  // Run guard
}
```

## 📈 Exit Codes

- **0**: All quality gates passed
- **1**: Success rate < 95% (guard not run)
- **2**: Guard failed (quality gates not met)

## 🐛 Troubleshooting

### Common Issues

#### 1. Out of Memory
**Symptom**: Process crashes with "JavaScript heap out of memory"
**Solution**: Increase memory limit in package.json

#### 2. Binder Not Found
**Symptom**: "Binder directory not found" error
**Solution**: Verify BASE_DIR path in hybrid-binder-executor.js

#### 3. Low Success Rate
**Symptom**: Exit code 1, success rate < 95%
**Solution**: Check FAILURE_REPORT.md for specific binder issues

#### 4. Guard Failure
**Symptom**: Exit code 2, guard checks fail
**Solution**: Review guard-binders.js output for specific failures

### Debug Mode

Enable verbose logging:
```javascript
// In hybrid-binder-executor.js
const DEBUG = true;
```

## 🔐 CI/CD Integration

### GitHub Actions

The workflow runs automatically on:
- Push to `main` or `binder-*` branches
- Manual workflow dispatch

### Workflow Features

- Uploads all reports as artifacts (30-day retention)
- Comments on commits with execution summary
- Blocks merge if quality gates fail
- Configurable memory limit via workflow input

### Manual Trigger

```bash
# Via GitHub CLI
gh workflow run hybrid-binders.yml

# With custom memory limit
gh workflow run hybrid-binders.yml -f memory_limit=16384
```

## 📝 Best Practices

1. **Always run locally first** before pushing to CI
2. **Review FAILURE_REPORT.md** for any failed binders
3. **Check hybrid-run-report.json** for detailed metrics
4. **Monitor memory usage** during execution
5. **Keep binder files organized** in the designated directory
6. **Commit reports** after successful runs for historical tracking

## 🎉 Success Criteria

A successful hybrid execution means:
- ✅ All binders processed (or skipped if empty)
- ✅ Success rate ≥ 95%
- ✅ All reports generated
- ✅ Guard checks passed
- ✅ Exit code 0

## 📚 Related Documentation

- `ops/reports/README.md` - Self-heal and guard documentation
- `scripts/_patterns.js` - Detection pattern definitions
- `.augment/rules/rules.md` - Binder execution rules

