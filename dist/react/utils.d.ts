/**
 * Utility functions for React integrations
 */
/**
 * Extract browser name from user agent string
 *
 * @param userAgent - The navigator.userAgent string
 * @returns Browser name (Chrome, Firefox, Safari, Edge, or Unknown)
 */
export declare function extractBrowser(userAgent: string): string;
/**
 * Format a duration in milliseconds to a human-readable string
 *
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string like "5m 30s" or "45s"
 */
export declare function formatDuration(durationMs: number): string;
/**
 * Format a date relative to now
 *
 * @param date - The date to format
 * @returns Relative time string like "Just now", "5m ago", "2h ago", or formatted date
 */
export declare function formatRelativeTime(date: Date | null): string;
//# sourceMappingURL=utils.d.ts.map