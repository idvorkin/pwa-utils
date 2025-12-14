/**
 * React integration module for pwa-utils
 *
 * Provides React hooks and components for bug reporting and version checking.
 *
 * @packageDocumentation
 */

export type {
	BugReportMetadata,
	BugReporterContextType,
	BugReporterProviderProps,
	VersionCheckHookReturn,
	VersionCheckHookState,
} from "./types.js";

export { BugReporterProvider, useBugReporter } from "./useBugReporter.js";

export { useVersionCheck } from "./useVersionCheck.js";

export { extractBrowser, formatDuration, formatRelativeTime } from "./utils.js";
