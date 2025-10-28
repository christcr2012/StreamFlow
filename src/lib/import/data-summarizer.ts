/**
 * Data Summarizer - Analyze sample data to infer types and patterns
 *
 * Provides statistical summaries and type inference for AI field mapping.
 */

// Simple masking for examples (full masking is in data-masking.ts)
function maskValue(fieldName: string, value: any): string {
  if (value === null || value === undefined || value === "")
    return String(value);
  const str = String(value);
  const name = fieldName.toLowerCase();

  // Email
  if (name.includes("email") || /@/.test(str)) {
    const match = str.match(/^([^@]+)@(.+)$/);
    if (match) return `${match[1][0]}***@${match[2]}`;
  }

  // Phone
  if (name.includes("phone") || name.includes("tel")) {
    const digits = str.replace(/\D/g, "");
    if (digits.length >= 4) return `***-***-${digits.slice(-4)}`;
  }

  // Keep short values, truncate long ones
  return str.length > 20 ? str.slice(0, 20) + "..." : str;
}

export interface ColumnSummary {
  name: string;
  inferredType: string;
  uniquePercent: number;
  emptyPercent: number;
  examples: string[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  avgLength?: number;
}

/**
 * Infer data type from sample values
 */
function inferType(values: any[]): string {
  if (values.length === 0) return "unknown";

  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (nonEmpty.length === 0) return "empty";

  // Check for numeric
  const numericCount = nonEmpty.filter((v) => !isNaN(Number(v))).length;
  if (numericCount / nonEmpty.length > 0.9) {
    // Check if integers or decimals
    const hasDecimals = nonEmpty.some((v) => String(v).includes("."));
    return hasDecimals ? "decimal" : "integer";
  }

  // Check for boolean
  const boolCount = nonEmpty.filter((v) => {
    const str = String(v).toLowerCase();
    return [
      "true",
      "false",
      "yes",
      "no",
      "1",
      "0",
      "t",
      "f",
      "y",
      "n",
    ].includes(str);
  }).length;
  if (boolCount / nonEmpty.length > 0.9) return "boolean";

  // Check for date
  const dateCount = nonEmpty.filter((v) => {
    const str = String(v);
    return (
      /^\d{4}-\d{2}-\d{2}/.test(str) || /^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(str)
    );
  }).length;
  if (dateCount / nonEmpty.length > 0.8) return "date";

  // Check for email
  const emailCount = nonEmpty.filter((v) => /@/.test(String(v))).length;
  if (emailCount / nonEmpty.length > 0.8) return "email";

  // Check for phone
  const phoneCount = nonEmpty.filter((v) => {
    const str = String(v).replace(/\D/g, "");
    return str.length >= 10 && str.length <= 15;
  }).length;
  if (phoneCount / nonEmpty.length > 0.8) return "phone";

  // Check for URL
  const urlCount = nonEmpty.filter((v) =>
    /^https?:\/\//.test(String(v)),
  ).length;
  if (urlCount / nonEmpty.length > 0.8) return "url";

  // Default to text
  return "text";
}

/**
 * Detect common patterns in values
 */
function detectPattern(values: any[]): string | undefined {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (nonEmpty.length === 0) return undefined;

  const firstValue = String(nonEmpty[0]);

  // Numeric patterns
  if (/^\d+$/.test(firstValue)) return "digits";
  if (/^\d+\.\d+$/.test(firstValue)) return "decimal";

  // Date patterns
  if (/^\d{4}-\d{2}-\d{2}$/.test(firstValue)) return "YYYY-MM-DD";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(firstValue)) return "MM/DD/YYYY";
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(firstValue)) return "YYYY/MM/DD";

  // Phone patterns (use # to avoid placeholder tokens)
  if (/^\(\d{3}\)\s*\d{3}-\d{4}$/.test(firstValue)) return "(###) ###-####";
  if (/^\d{3}-\d{3}-\d{4}$/.test(firstValue)) return "###-###-####";
  if (/^\+\d{1,3}\s*\d+$/.test(firstValue)) return "+# ###...";

  // Email pattern
  if (/@/.test(firstValue)) return "email";

  // Alpha patterns
  if (/^[A-Z]+$/.test(firstValue)) return "UPPERCASE";
  if (/^[a-z]+$/.test(firstValue)) return "lowercase";
  if (/^[A-Z][a-z]+$/.test(firstValue)) return "Titlecase";

  return "mixed";
}

/**
 * Get representative examples (masked for privacy)
 */
function getExamples(
  columnName: string,
  values: any[],
  count: number = 3,
): string[] {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (nonEmpty.length === 0) return ["(empty)"];

  // Get unique values
  const unique = Array.from(new Set(nonEmpty));

  // Take first N unique values
  const samples = unique.slice(0, count);

  // Mask for privacy
  return samples.map((v) => String(maskValue(columnName, v)));
}

/**
 * Calculate length statistics
 */
function getLengthStats(values: any[]): {
  min: number;
  max: number;
  avg: number;
} {
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  if (nonEmpty.length === 0) return { min: 0, max: 0, avg: 0 };

  const lengths = nonEmpty.map((v) => String(v).length);
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  const avg = Math.round(
    lengths.reduce((sum, len) => sum + len, 0) / lengths.length,
  );

  return { min, max, avg };
}

/**
 * Summarize a single column
 */
export function summarizeColumn(
  rows: any[],
  columnName: string,
): ColumnSummary {
  const values = rows.map((row) => row[columnName]);
  const totalCount = values.length;

  // Count unique and empty
  const nonEmpty = values.filter(
    (v) => v !== null && v !== undefined && v !== "",
  );
  const uniqueCount = new Set(nonEmpty).size;
  const emptyCount = totalCount - nonEmpty.length;

  // Calculate percentages
  const uniquePercent =
    totalCount > 0 ? Math.round((uniqueCount / totalCount) * 100) : 0;
  const emptyPercent =
    totalCount > 0 ? Math.round((emptyCount / totalCount) * 100) : 0;

  // Infer type and pattern
  const inferredType = inferType(values);
  const pattern = detectPattern(values);

  // Get examples
  const examples = getExamples(columnName, values);

  // Get length stats
  const lengthStats = getLengthStats(values);

  return {
    name: columnName,
    inferredType,
    uniquePercent,
    emptyPercent,
    examples,
    pattern,
    minLength: lengthStats.min,
    maxLength: lengthStats.max,
    avgLength: lengthStats.avg,
  };
}

/**
 * Summarize all columns in sample data
 */
export function summarizeColumns(
  rows: any[],
  columnNames: string[],
): ColumnSummary[] {
  return columnNames.map((name) => summarizeColumn(rows, name));
}

/**
 * Detect relationships between columns (e.g., Customer → Jobs)
 */
export function detectRelationships(summaries: ColumnSummary[]): Array<{
  from: string;
  to: string;
  type: "foreign_key" | "composite";
  confidence: number;
}> {
  const relationships: Array<{
    from: string;
    to: string;
    type: "foreign_key" | "composite";
    confidence: number;
  }> = [];

  // Look for ID-like columns
  const idColumns = summaries.filter(
    (s) =>
      s.name.toLowerCase().includes("id") &&
      s.inferredType === "text" &&
      s.uniquePercent > 80,
  );

  // Look for potential foreign keys
  for (const idCol of idColumns) {
    const baseName = idCol.name
      .toLowerCase()
      .replace(/id$/i, "")
      .replace(/_/g, "");

    // Find matching entity columns
    const matchingCols = summaries.filter(
      (s) => s.name.toLowerCase().includes(baseName) && s.name !== idCol.name,
    );

    if (matchingCols.length > 0) {
      relationships.push({
        from: idCol.name,
        to: matchingCols[0].name,
        type: "foreign_key",
        confidence: 0.8,
      });
    }
  }

  return relationships;
}

/**
 * Suggest entity type based on column names
 */
export function suggestEntityType(
  columnNames: string[],
):
  | "CUSTOMERS"
  | "JOBS"
  | "INVOICES"
  | "ESTIMATES"
  | "CONTACTS"
  | "ADDRESSES"
  | "NOTES"
  | "UNKNOWN" {
  const names = columnNames.map((n) => n.toLowerCase()).join(" ");

  // Customer indicators
  if (
    names.includes("customer") ||
    names.includes("client") ||
    names.includes("account")
  ) {
    return "CUSTOMERS";
  }

  // Job indicators
  if (
    names.includes("job") ||
    names.includes("project") ||
    names.includes("work order") ||
    names.includes("service")
  ) {
    return "JOBS";
  }

  // Invoice indicators
  if (
    names.includes("invoice") ||
    names.includes("bill") ||
    names.includes("amount") ||
    names.includes("payment")
  ) {
    return "INVOICES";
  }

  // Estimate indicators
  if (
    names.includes("estimate") ||
    names.includes("quote") ||
    names.includes("proposal")
  ) {
    return "ESTIMATES";
  }

  // Contact indicators
  if (
    names.includes("contact") ||
    (names.includes("email") && names.includes("phone"))
  ) {
    return "CONTACTS";
  }

  // Address indicators
  if (
    names.includes("address") ||
    names.includes("street") ||
    names.includes("city") ||
    names.includes("zip")
  ) {
    return "ADDRESSES";
  }

  // Notes indicators
  if (
    names.includes("note") ||
    names.includes("comment") ||
    names.includes("description")
  ) {
    return "NOTES";
  }

  return "UNKNOWN";
}
