/**
 * Utility functions for React integrations
 */
/**
 * Extract browser name from user agent string
 *
 * @param userAgent - The navigator.userAgent string
 * @returns Browser name (Chrome, Firefox, Safari, Edge, or Unknown)
 */
export function extractBrowser(userAgent) {
    if (userAgent.includes("Edg"))
        return "Edge"; // Modern Edge uses "Edg"
    if (userAgent.includes("Chrome"))
        return "Chrome";
    if (userAgent.includes("Firefox"))
        return "Firefox";
    if (userAgent.includes("Safari"))
        return "Safari";
    return "Unknown";
}
/**
 * Format a duration in milliseconds to a human-readable string
 *
 * @param durationMs - Duration in milliseconds
 * @returns Formatted string like "5m 30s" or "45s"
 */
export function formatDuration(durationMs) {
    const durationSec = Math.round(durationMs / 1000);
    const durationMin = Math.floor(durationSec / 60);
    if (durationMin > 0) {
        return `${durationMin}m ${durationSec % 60}s`;
    }
    return `${durationSec}s`;
}
/**
 * Format a date relative to now
 *
 * @param date - The date to format
 * @returns Relative time string like "Just now", "5m ago", "2h ago", or formatted date
 */
export function formatRelativeTime(date) {
    if (!date)
        return "Never";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    if (diffSec < 10)
        return "Just now";
    if (diffSec < 60)
        return `${diffSec}s ago`;
    if (diffMin < 60)
        return `${diffMin}m ago`;
    if (diffHour < 24)
        return `${diffHour}h ago`;
    return date.toLocaleDateString();
}
//# sourceMappingURL=utils.js.map