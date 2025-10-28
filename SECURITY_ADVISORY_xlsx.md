# Security Advisory: xlsx Package Vulnerability

## 📋 Summary

**Date**: 2025-01-27  
**Severity**: HIGH  
**Status**: ⚠️ NEEDS ATTENTION

## 🔍 Issue Description

The `xlsx` package (SheetJS) has known security vulnerabilities:

1. **GHSA-4r6h-8v6p-xvw6**: Prototype Pollution
2. **GHSA-5pgg-2g8v-p4x9**: Regular Expression Denial of Service (ReDoS)

**Current Version**: `^0.18.5`  
**Fix Available**: No fix available from the package maintainer

## 📍 Usage Locations

The `xlsx` package is currently used in:

### 1. Legacy Import System (src/lib/import/file-parser.ts)

```typescript
import * as XLSX from "xlsx";
```

**Status**: Legacy code in `src/` directory (not actively used in monorepo)

### 2. Excel Importers (importers/excel/)

- `importers/excel/import_assets.mjs`
- `importers/excel/import_landfills.mjs`

**Usage Pattern**:

```javascript
import xlsx from "xlsx";
const wb = xlsx.readFile(path);
const ws = wb.Sheets[wb.SheetNames[0]];
return xlsx.utils.sheet_to_json(ws, { defval: "" });
```

## 🛡️ Recommended Actions

### Option 1: Replace with exceljs (Recommended)

**Why**: `exceljs` is a well-maintained, security-focused alternative with active development.

```javascript
// Before (xlsx)
import xlsx from "xlsx";
const wb = xlsx.readFile(path);
const ws = wb.Sheets[wb.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(ws);

// After (exceljs)
import Excel from "exceljs";
const workbook = new Excel.Workbook();
await workbook.xlsx.readFile(path);
const worksheet = workbook.worksheets[0];
const data = [];
worksheet.eachRow((row, rowNumber) => {
  if (rowNumber === 1) return; // Skip header
  data.push(row.values);
});
```

**Installation**:

```powershell
npm uninstall xlsx
npm install exceljs
```

### Option 2: Replace with xlsx-populate

**Why**: Another maintained alternative with good performance.

```javascript
import XlsxPopulate from "xlsx-populate";
const workbook = await XlsxPopulate.fromFileAsync(path);
const sheet = workbook.sheet(0);
const data = sheet.usedRange().value();
```

**Installation**:

```powershell
npm uninstall xlsx
npm install xlsx-populate
```

### Option 3: Use @sheet/community (SheetJS Community Edition)

**Why**: Community-maintained fork of SheetJS with security patches.

**Installation**:

```powershell
npm uninstall xlsx
npm install @sheet/community
```

### Option 4: Risk Mitigation (Short-term)

If replacement is not immediately feasible:

1. **Restrict File Sources**: Only process files from trusted sources
2. **Input Validation**: Validate file size, structure before processing
3. **Sandboxing**: Run import scripts in isolated environments
4. **Rate Limiting**: Limit number of imports per user/time period

```javascript
// Add size limit
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const stats = fs.statSync(path);
if (stats.size > MAX_FILE_SIZE) {
  throw new Error("File too large");
}

// Add timeout
const timeout = setTimeout(() => {
  throw new Error("Processing timeout");
}, 30000); // 30 seconds

try {
  const wb = xlsx.readFile(path);
  // ... process
} finally {
  clearTimeout(timeout);
}
```

## 📊 Impact Assessment

### Risk Level: MEDIUM-HIGH

- **Exploit Difficulty**: Moderate (requires malicious Excel file)
- **Impact**: Could cause server crash (DoS) or data corruption (prototype pollution)
- **Exposure**: Import endpoints that accept user-uploaded Excel files

### Affected Components:

1. ✅ **Legacy Import System**: Not actively used (can be removed)
2. ⚠️ **Excel Importers**: Used in migration scripts (limited exposure)
3. ❌ **Production APIs**: No direct API exposure found

## ✅ Action Plan

### Phase 1: Immediate (This Week)

- [x] Document security issue
- [ ] Assess usage in production
- [ ] Determine migration strategy (exceljs vs xlsx-populate)

### Phase 2: Short-term (Next 2 Weeks)

- [ ] Replace `xlsx` with chosen alternative
- [ ] Update import scripts in `importers/excel/`
- [ ] Remove legacy `src/lib/import/file-parser.ts` if unused
- [ ] Test import functionality with new library

### Phase 3: Long-term (Next Month)

- [ ] Add file upload security controls
- [ ] Implement file size limits
- [ ] Add timeout protection
- [ ] Document secure import patterns

## 📝 Notes

- The `xlsx` package maintainer has not provided a fix
- SheetJS Pro (paid version) may have additional security features
- Community alternatives are actively maintained
- Consider server-side file processing limits

## 🔗 References

- [GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6)
- [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)
- [exceljs on npm](https://www.npmjs.com/package/exceljs)
- [xlsx-populate on npm](https://www.npmjs.com/package/xlsx-populate)

---

**Created**: 2025-01-27  
**Status**: Open  
**Assignee**: TBD  
**Priority**: Medium-High
