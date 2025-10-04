# Binder Execution Summary

Generated: 2025-10-04T14:03:54.000Z

## Summary

- **Total Binders**: 28
- **Binders with Content**: 22 (78.6%)
- **Binders Processed**: 22
- **Success Rate**: 78.6%
- **Threshold**: 95.0%
- **Status**: ❌ FAILED (Below 95% threshold)

## System Health Checks

- **Prisma Generation**: ✅ PASSED
- **TypeScript Check**: ❌ FAILED (Memory limit exceeded)
- **Binder14 Config Hub**: ✅ GENERATED
  - src/config/system-registry.ts
  - src/config/binder-map.json
  - src/app/admin/orchestrator-panel.tsx

## Detailed Results

| Binder | Items Detected | Status |
|--------|---------------:|--------|
| binder1_FULL.md | 3,318 | ✅ PROCESSED |
| binder2_FULL.md | 14,897 | ✅ PROCESSED |
| binder3_FULL.md | 7,163 | ✅ PROCESSED |
| binder3A_FULL.md | 386,007 | ✅ PROCESSED |
| binder3B_FULL.md | 1 | ✅ PROCESSED |
| binder3C_full_FULL.md | 156,373 | ✅ PROCESSED |
| binder3C_full.md | 156,373 | ✅ PROCESSED |
| binder4_FULL.md | 17,715 | ✅ PROCESSED |
| binder5_FULL.md | 56,545 | ✅ PROCESSED |
| binder6_FULL.md | 34,114 | ✅ PROCESSED |
| binder7_FULL.md | 599,999 | ✅ PROCESSED |
| binder8_FULL.md | 100,000 | ✅ PROCESSED |
| binder9_FULL.md | 352,000 | ✅ PROCESSED |
| binder10_FULL.md | 804,014 | ✅ PROCESSED |
| binder11_FULL.md | 168,896 | ✅ PROCESSED |
| binder12_FULL.md | 339,709 | ✅ PROCESSED |
| binder13_FULL.md | 0 | ❌ NO CONTENT |
| binder14_ready_FULL.md | 0 | 🎛️ CONFIG HUB |
| binder15_ready_FULL.md | 0 | ❌ NO CONTENT |
| binder16_ready_FULL.md | 0 | ❌ NO CONTENT |
| binder17_ready_FULL.md | 0 | ❌ NO CONTENT |
| binder18_ready_FULL.md | 0 | ❌ NO CONTENT |
| binder19_ready_FULL.md | 164,160 | ✅ PROCESSED |
| binder20_ready_FULL.md | 180,790 | ✅ PROCESSED |
| binder21_ready_FULL.md | 76,065 | ✅ PROCESSED |
| binder22_ready_FULL.md | 169,600 | ✅ PROCESSED |
| binder23_ready_FULL.md | 235,960 | ✅ PROCESSED |
| EXPAND-REPORT.md | 1 | ✅ PROCESSED |

## Issues Identified

1. **6 binders have no detectable content** (binder13, binder15-18)
2. **TypeScript compilation failed** due to memory constraints
3. **Success rate 78.6% < 95% threshold**

## Generated Artifacts

- ✅ Binder14 configuration hub files
- ✅ Orchestrator report: ops/reports/orchestrator-report.json
- ✅ Validation data: ops/reports/validation_pre.json
- ✅ Prisma schema fixed (38 duplicate IDs removed)

## Recommendation

**DO NOT MERGE** - Success rate below 95% threshold. 

**Next Steps:**
1. Investigate binders 13, 15-18 for missing content
2. Increase Node.js memory limit for TypeScript check
3. Re-run pipeline after fixes
