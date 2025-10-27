/**
 * Build-time guard helper
 *
 * Detects if we're in a build phase and suppresses noisy console.error
 * when DATABASE_URL is missing (expected during local builds).
 */

/**
 * Check if we're in Next.js build phase
 */
export function isBuildPhase(): boolean {
  return (
    !process.env.DATABASE_URL ||
    process.env.NEXT_PHASE === "phase-production-build"
  );
}

/**
 * Log error only if not in build phase (reduces noise during local builds)
 */
export function logErrorUnlessBuild(message: string, error?: any): void {
  if (!isBuildPhase()) {
    console.error(message, error);
  } else {
    // Silent during build - pages will log friendly messages
  }
}
