# Import Wizard User Guide

**Version**: 2.0 (Production Ready - Phase 1 Complete)
**Last Updated**: 2025-10-15
**Status**: ✅ All Phase 1 Features Implemented

## Overview

The Import Wizard helps you migrate data from your previous software system to Cortiware. It uses AI to automatically map fields, transform data, and validate records - saving you 20-40 minutes per import.

### ✅ Phase 1 Features (Complete)

- **Drag-and-Drop File Upload** - Easy file upload with validation
- **Real-Time Progress Tracking** - Updates every 2 seconds with live metrics
- **Template Management** - Save and reuse mapping configurations
- **Production-Ready Error Handling** - User-friendly messages, no internal details exposed
- **Privacy-First AI** - PII data masked before analysis

---

## Getting Started

### Supported File Formats

- **CSV** (.csv, .txt) - Comma, tab, semicolon, or pipe delimited
- **Excel** (.xlsx, .xls) - First sheet only
- **JSON** (.json) - Array of objects
- **XML** (.xml) - Standard record format

### Supported Entity Types

- **Customers** - Your end customers (homeowners, businesses)
- **Jobs/Projects** - Work orders, service calls, projects
- **Invoices** - Billing records
- **Estimates/Quotes** - Proposals and quotes

### File Size Limits

- Maximum file size: 50 MB
- Recommended: Split large files into batches of 10,000 records

---

## 7-Step Import Process

### Step 1: Upload Sample File

1. Navigate to **Import Wizard** in the Client Portal
2. Select the **Entity Type** you want to import (Customers, Jobs, etc.)
3. Upload a **sample file** containing the first 100 rows of your data
4. Check **"Use AI Assistant"** (recommended - saves 20-40 minutes)
5. Click **Continue**

**Tips:**
- Export a sample from your old system first
- Include column headers in the first row
- Ensure data is clean (no extra blank rows)

---

### Step 2: Review Detection

The wizard analyzes your file and shows:
- Detected file format (CSV, Excel, JSON, XML)
- Number of columns and sample rows
- Estimated AI cost (if AI assist enabled)

**AI Pricing:**
- **Light** (≤10 columns, ≤100 rows): $0.99
- **Standard** (≤30 columns, ≤500 rows): $2.99
- **Complex** (>30 columns or >500 rows): $4.99

Click **Analyze File** to continue.

**What if I don't have enough credits?**
- You'll see a "Payment Required" message
- Click the link to add credits to your wallet
- Return to the wizard and try again

---

### Step 3: Map Fields

The AI suggests field mappings with confidence scores:

```
Customer Name  →  name          95% confident
Email          →  email         98% confident
Phone          →  phone         92% confident
```

**Review each mapping:**
- ✅ Green checkmark = High confidence (>90%)
- ⚠️ Yellow warning = Medium confidence (70-90%)
- ❌ Red X = Low confidence (<70%)

**Adjust mappings if needed:**
- Click on a mapping to change the target field
- Add transformations (trim, lowercase, normalizePhone)
- Set validation rules (required, email format)

Click **Continue** when satisfied.

---

### Step 4: Preview

Review the mapping summary:
- Number of fields mapped
- Transformations applied
- Validation rules configured
- Deduplication strategy

Click **Continue to Upload** to proceed.

---

### Step 5: Upload Full Data

1. Upload your **complete export file** (all records)
2. The wizard validates the file and starts processing
3. You'll see "Uploading and starting import..."

**Important:**
- Use the same file format as your sample
- Ensure column headers match exactly
- Don't close the browser during upload

---

### Step 6: Processing

Watch real-time progress:
- **Progress bar** shows completion percentage
- **Success count** - Records imported successfully
- **Error count** - Records that failed validation
- **Skipped count** - Duplicate records

**Processing time:**
- ~1 minute per 1,000 records
- Runs in batches of 100 records
- Can take 5-15 minutes for large files

**What if processing fails?**
- The wizard will show an error message
- Download the error report to see what went wrong
- Fix the issues in your source file and try again

---

### Step 7: Review Results

Import complete! You'll see:
- **Total imported** - Successfully created records
- **Total errors** - Failed records
- **Total duplicates** - Skipped duplicate records

**If there are errors:**
1. Click **Download Error Report** (CSV format)
2. Review the errors (row number, field, error message)
3. Fix the issues in your source file
4. Run a new import with the corrected data

**Next steps:**
- Click **Start New Import** to import another entity type
- Navigate to your data (Customers, Jobs, etc.) to verify
- Set up any additional configurations (custom fields, workflows)

---

## Common Issues

### "File parsing failed"

**Cause:** Invalid file format or encoding

**Solution:**
- Ensure file is valid CSV, Excel, JSON, or XML
- Check for special characters or encoding issues
- Try saving as UTF-8 encoded CSV

---

### "Payment Required"

**Cause:** Insufficient AI credits

**Solution:**
1. Click the payment link in the error message
2. Add credits to your wallet ($5 minimum)
3. Return to the wizard and retry

---

### "Invalid email format" errors

**Cause:** Email addresses don't match standard format

**Solution:**
- Clean up email addresses in your source file
- Ensure format is: name@domain.com
- Remove any extra spaces or special characters

---

### "Duplicate record" warnings

**Cause:** Record already exists in Cortiware

**Solution:**
- This is normal - duplicates are automatically skipped
- Review the skipped count in the results
- If you want to update existing records, delete them first

---

### High error count

**Cause:** Data doesn't match Cortiware's schema

**Solution:**
1. Download the error report
2. Review common error patterns
3. Adjust field mappings or transformations
4. Clean up source data
5. Run a new import

---

## Best Practices

### Before You Import

1. **Export a sample first** - Test with 100 rows before importing thousands
2. **Clean your data** - Remove blank rows, fix formatting issues
3. **Standardize formats** - Use consistent date, phone, email formats
4. **Check for duplicates** - Remove duplicates in your source system first

### During Import

1. **Use AI Assistant** - Saves 20-40 minutes and improves accuracy
2. **Review mappings carefully** - Don't blindly trust AI suggestions
3. **Test with sample first** - Verify mappings before full import
4. **Don't close browser** - Keep the tab open during processing

### After Import

1. **Review results** - Check success/error counts
2. **Download error report** - Fix any issues
3. **Verify data** - Spot-check imported records
4. **Set up relationships** - Link customers to jobs, jobs to invoices, etc.

---

## FAQ

**Q: Can I import multiple entity types at once?**
A: No, import one entity type at a time (Customers, then Jobs, then Invoices).

**Q: What happens to duplicate records?**
A: Duplicates are automatically skipped based on email (Customers) or job number (Jobs).

**Q: Can I update existing records?**
A: No, the wizard only creates new records. To update, delete the old record first.

**Q: How long does AI analysis take?**
A: Usually 5-10 seconds for most files.

**Q: Can I save my field mappings?**
A: Yes! Check "Save as template" in Step 3 to reuse mappings for future imports.

**Q: What if my file has more than 50 MB?**
A: Split it into multiple files of 10,000 records each and import separately.

**Q: Can I cancel a running import?**
A: Yes, click the "Cancel Import" button in Step 6.

**Q: Where do I find my imported data?**
A: Navigate to the corresponding section (Customers, Jobs, Invoices) in the Client Portal.

---

## Support

Need help? Contact support:
- **Email:** support@cortiware.com
- **Phone:** (555) 123-4567
- **Hours:** Mon-Fri 9am-5pm CST

---

## Changelog

### Version 1.0 (October 2025)
- Initial release
- AI-powered field mapping
- Support for CSV, Excel, JSON, XML
- Real-time progress tracking
- Error reporting and download

