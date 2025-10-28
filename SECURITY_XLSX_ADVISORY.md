# xlsx Library Security Advisory

## Status: Accepted Risk

**Date**: 2025-01-28  
**Package**: `xlsx@0.18.5`  
**Severity**: High  
**CVE References**:
- GHSA-4r6h-8v6p-xvw6 (Prototype Pollution)
- GHSA-5pgg-2g8v-p4x9 (Regular Expression Denial of Service)

## Vulnerability Summary

The `xlsx` library has two known security vulnerabilities:

1. **Prototype Pollution**: Attackers could potentially inject properties into `Object.prototype` through maliciously crafted Excel files
2. **ReDoS**: Regular expression denial of service through specially crafted input

## Current Usage

The xlsx library is used in `src/lib/import/file-parser.ts` for Excel file import functionality:

```typescript
// parseExcelFile() function
const workbook = XLSX.read(buffer, {
  type: buffer instanceof Buffer ? 'buffer' : 'base64',
  cellDates: true,
});

const data = XLSX.utils.sheet_to_json(worksheet, {
  raw: false,
  dateNF: 'yyyy-mm-dd',
});
```

**Features using Excel import**:
- Contact imports
- Lead imports
- Organization imports
- Other bulk data imports

## Risk Assessment

### Why We're Accepting This Risk

1. **No Fix Available**: The xlsx maintainers have not released patches for these vulnerabilities
2. **Limited Attack Surface**: 
   - Only authenticated users can upload Excel files
   - Files are scoped to organization (multi-tenant isolation)
   - Maximum file size is 50MB (enforced in validateFile())
3. **Business Value**: Excel import is a critical feature for customer onboarding and data migration
4. **Existing Mitigations**:
   - Authentication required (`getAuthContext()` in API routes)
   - Organization-level isolation (all data scoped to `orgId`)
   - File size limits (50MB max)
   - File type validation

### Potential Impact

**If exploited**:
- **Prototype Pollution**: Could affect JavaScript object behavior, potentially leading to authentication bypass or data corruption within a single organization's context
- **ReDoS**: Could cause server-side delays or timeouts during Excel parsing, affecting availability

**Blast Radius**: Limited to the organization that uploads the malicious file

## Mitigation Strategies

### Current Mitigations (Already Implemented)

1. ✅ **Authentication & Authorization**: All import endpoints require valid tenant session
2. ✅ **Organization Isolation**: Data is scoped to `auth.orgId`, preventing cross-tenant attacks
3. ✅ **File Size Limits**: 50MB maximum enforced in `validateFile()`
4. ✅ **File Type Validation**: Only `.xlsx` and `.xls` extensions allowed

### Recommended Additional Mitigations

#### High Priority

1. **Input Sanitization** (Immediate):
   ```typescript
   // Add to file-parser.ts after parsing
   function sanitizeObject(obj: any): any {
     if (obj === null || typeof obj !== 'object') return obj;
     
     // Remove dangerous properties
     const clean: any = Array.isArray(obj) ? [] : {};
     for (const key of Object.keys(obj)) {
       if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
         continue; // Skip dangerous properties
       }
       clean[key] = sanitizeObject(obj[key]);
     }
     return clean;
   }
   ```

2. **Rate Limiting** (Immediate):
   - Add per-organization rate limits for file imports (e.g., 10 uploads per hour)
   - Implement in API routes using Redis/KV store

3. **Async Processing with Timeout** (Immediate):
   - Move Excel parsing to background queue (Bull/BullMQ)
   - Set strict timeout (e.g., 30 seconds per file)
   - Prevent ReDoS from blocking main thread

#### Medium Priority

4. **File Scanning** (Optional):
   - Consider adding virus/malware scanning for uploaded files
   - Use ClamAV or third-party service (e.g., VirusTotal API)

5. **Audit Logging** (Recommended):
   - Log all file imports with file hash, user, timestamp
   - Monitor for suspicious patterns (e.g., repeated failures from same user)

#### Long-term Solutions

6. **Replace xlsx Library**:
   - **Candidate**: `exceljs` (actively maintained, better security record)
   - **Candidate**: `xlsx-populate` (smaller, fewer dependencies)
   - **Effort**: High (requires testing across all import flows)
   - **Priority**: Low (evaluate alternatives over next 2-3 months)

## Implementation Plan

### Phase 1: Immediate (This Sprint)

- [ ] Add sanitizeObject() function to file-parser.ts
- [ ] Apply sanitization to all parsed Excel data before database insertion
- [ ] Add comprehensive tests for malicious input patterns
- [ ] Document accepted risk in this advisory

### Phase 2: Short-term (Next Sprint)

- [ ] Implement rate limiting for file imports per organization
- [ ] Add async processing with timeout for Excel parsing
- [ ] Add audit logging for all import operations

### Phase 3: Long-term (2-3 months)

- [ ] Evaluate alternative Excel libraries (exceljs, xlsx-populate)
- [ ] Create proof-of-concept migration
- [ ] Plan deprecation of xlsx library if suitable alternative found

## Monitoring & Detection

### Alerts to Implement

1. **Unusual Import Activity**:
   - More than 10 imports per hour from a single organization
   - Repeated import failures from same user
   - Files > 40MB (approaching limit)

2. **Performance Anomalies**:
   - Excel parsing taking > 10 seconds
   - Memory spikes during import operations
   - CPU usage > 80% during parsing

3. **Security Events**:
   - Prototype pollution attempts detected (look for `__proto__` in logs)
   - Failed imports with suspicious error messages

## References

- CVE GHSA-4r6h-8v6p-xvw6: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
- CVE GHSA-5pgg-2g8v-p4x9: https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
- npm audit report: Run `npm audit` to see full details
- xlsx GitHub Issues: https://github.com/SheetJS/sheetjs/issues (check for security-related discussions)

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-01-28 | Accept Risk | No fix available, critical business feature, limited attack surface with multi-tenant isolation |
| TBD | Implement Phase 1 Mitigations | Reduce risk through input sanitization and defensive programming |
| TBD | Evaluate Alternatives | Assess exceljs and xlsx-populate for potential migration |

## Approval

This risk has been documented and accepted with the understanding that:
1. Additional mitigations will be implemented in phases
2. The vulnerability will be reassessed if a fix becomes available
3. Alternative libraries will be evaluated for future migration
4. Monitoring will be added to detect potential exploitation attempts

**Status**: ✅ Risk accepted with mitigations planned

---

**Last Updated**: 2025-01-28  
**Next Review**: 2025-04-28 (3 months)
