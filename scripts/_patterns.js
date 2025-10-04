export const PATTERNS = {
  // Headings used across binders
  HEADINGS: [
    /^#{3}\s*API\b.*$/i,
    /^#{3}\s*SQL\b.*$/i,
    /^#{3}\s*ENDPOINTS?\b.*$/i,
    /^#{3}\s*ROUTES?\b.*$/i,
    /^#{3}\s*ACTIONS?\b.*$/i,
  ],
  // Inline cues that often appear in dense sections
  INLINE: [
    /\bGET|POST|PUT|PATCH|DELETE\b\s+\/[A-Za-z0-9/_:{-]+/i,
    /\bpath\s*:\s*\/[A-Za-z0-9/_:{-]+/i,
    /\brequest\b|\bresponse\b|\bpayload\b/i,
    /\bINSERT INTO\b|\bUPDATE\b|\bDELETE FROM\b|\bSELECT\b/i
  ]
};

export function detectCounts(text) {
  const lines = text.split(/\r?\n/);
  const primary = lines.filter(l => PATTERNS.HEADINGS.some(rx => rx.test(l))).length;
  const fallback = lines.filter(l => PATTERNS.INLINE.some(rx => rx.test(l))).length;
  return { primary, fallback, total: primary + fallback };
}

