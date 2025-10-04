# Binder Classification Report

**Generated:** 2025-10-04T21:38:28.840Z

## Summary

| Category | Count | Percentage |
|----------|-------|------------|
| **APIs** |
| Total APIs | 32807 | 100% |
| Required APIs | 58 | 0.18% |
| Candidate for Removal | 32749 | 99.82% |
| **UI** |
| Total UI Files | 40692 | 100% |
| Required UI | 26 | 0.06% |
| Candidate for Removal | 40666 | 99.94% |

## Required APIs (58)

Top 10 examples with reasons:


1. **/api/_health**
   - File: `src\pages\api\_health.ts`
   - Reasons: fetched


2. **/api/quick-actions**
   - File: `src\pages\api\quick-actions.ts`
   - Reasons: fetched


3. **/api/me**
   - File: `src\pages\api\me.ts`
   - Reasons: fetched


4. **/api/leads**
   - File: `src\pages\api\leads.ts`
   - Reasons: fetched


5. **/api/leads.list**
   - File: `src\pages\api\leads.list.ts`
   - Reasons: fetched


6. **/api/themes**
   - File: `src\pages\api\themes\index.ts`
   - Reasons: fetched


7. **/api/tenant/integrations/geotab/sync**
   - File: `src\pages\api\tenant\integrations\geotab\sync.ts`
   - Reasons: fetched


8. **/api/tenant/fleet/vehicles**
   - File: `src\pages\api\tenant\fleet\vehicles\index.ts`
   - Reasons: fetched


9. **/api/tenant/fleet/maintenance_tickets**
   - File: `src\pages\api\tenant\fleet\maintenance_tickets\index.ts`
   - Reasons: fetched


10. **/api/tenant/crm/opportunities**
   - File: `src\pages\api\tenant\crm\opportunities.ts`
   - Reasons: fetched


## Candidate APIs for Removal (32749)

Top 10 examples:


1. **/api/_echo**
   - File: `src\pages\api\_echo.ts`
   - Reason: Not imported, fetched, registered, or tested


2. **/api/whoami**
   - File: `src\pages\api\whoami.ts`
   - Reason: Not imported, fetched, registered, or tested


3. **/api/search**
   - File: `src\pages\api\search.ts`
   - Reason: Not imported, fetched, registered, or tested


4. **/api/leads.convert**
   - File: `src\pages\api\leads.convert.ts`
   - Reason: Not imported, fetched, registered, or tested


5. **/api/health**
   - File: `src\pages\api\health.ts`
   - Reason: Not imported, fetched, registered, or tested


6. **/api/endpoint39999**
   - File: `src\pages\api\endpoint39999.ts`
   - Reason: Not imported, fetched, registered, or tested


7. **/api/endpoint39998**
   - File: `src\pages\api\endpoint39998.ts`
   - Reason: Not imported, fetched, registered, or tested


8. **/api/endpoint39997**
   - File: `src\pages\api\endpoint39997.ts`
   - Reason: Not imported, fetched, registered, or tested


9. **/api/endpoint39996**
   - File: `src\pages\api\endpoint39996.ts`
   - Reason: Not imported, fetched, registered, or tested


10. **/api/endpoint39995**
   - File: `src\pages\api\endpoint39995.ts`
   - Reason: Not imported, fetched, registered, or tested


## Next Steps

1. Review classification results
2. Run dry-run pruning: `node scripts/binder-prune-dryrun.js`
3. Apply safe removals: `node scripts/binder-prune-apply.js`
