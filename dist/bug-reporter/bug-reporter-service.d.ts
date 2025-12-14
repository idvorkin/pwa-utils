/**
 * Bug Reporter Service
 *
 * Framework-agnostic service for creating and submitting bug reports.
 * Handles screenshot capture, metadata collection, and GitHub integration.
 */
import type { IDeviceService } from "../device-service";
import type { BugReportConfig, BugReportData, ScreenshotCapture, VersionInfo } from "./types";
/**
 * Create metadata about the current environment
 */
export declare function createEnvironmentMetadata(deviceService?: IDeviceService): Record<string, unknown>;
/**
 * Detect if running on a Mac platform
 */
export declare function isMacPlatform(deviceService?: IDeviceService): boolean;
/**
 * Detect if running on a mobile device
 */
export declare function isMobileDevice(deviceService?: IDeviceService): boolean;
/**
 * Create a screenshot capture utility
 */
export declare function createScreenshotCapture(): ScreenshotCapture;
/**
 * Build a GitHub issue URL for a bug report
 *
 * Note: Screenshots as data URLs are NOT embedded in the URL due to length limits.
 * Data URLs can be hundreds of KB which exceeds browser URL limits (~2000-8000 chars).
 * Screenshots should be uploaded separately and linked, or pasted manually.
 */
export declare function buildGitHubIssueUrl(repository: string, data: BugReportData, metadata?: Record<string, unknown>): string;
/**
 * Open a bug report in a new GitHub issue
 */
export declare function openBugReport(repository: string, data: BugReportData, deviceService?: IDeviceService): Promise<void>;
/**
 * Bug Reporter Service for managing bug report state and preferences
 */
export declare class BugReporterService {
    private config;
    private deviceService;
    private screenshotCapture;
    private _shakeEnabled;
    constructor(config?: BugReportConfig, deviceService?: IDeviceService);
    /** Get whether shake detection is enabled */
    get shakeEnabled(): boolean;
    /** Set shake detection preference */
    set shakeEnabled(value: boolean);
    /** Check if screenshot capture is supported */
    get screenshotSupported(): boolean;
    /** Check if running on mobile */
    get isMobile(): boolean;
    /** Capture a screenshot */
    captureScreenshot(): Promise<string | null>;
    /** Get current environment metadata (includes version info if configured) */
    getMetadata(): Record<string, unknown>;
    /** Get version info (if configured) */
    getVersionInfo(): VersionInfo | undefined;
    /** Open a bug report on GitHub */
    submitReport(data: BugReportData): Promise<void>;
    /** Build a GitHub issue URL (for preview) */
    buildIssueUrl(data: BugReportData): string;
}
//# sourceMappingURL=bug-reporter-service.d.ts.map