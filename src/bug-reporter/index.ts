/**
 * Bug Reporter Module
 *
 * Provides bug reporting functionality including shake detection,
 * screenshot capture, and GitHub integration.
 */

export type {
	BugReportConfig,
	BugReportData,
	IShakeDetector,
	ScreenshotCapture,
	ShakeDetectorConfig,
	ShakeDetectorState,
	VersionInfo,
} from "./types";

export {
	buildGitHubIssueUrl,
	BugReporterService,
	createEnvironmentMetadata,
	createScreenshotCapture,
	isMacPlatform,
	isMobileDevice,
	openBugReport,
} from "./bug-reporter-service";

export {
	createMockShakeDetector,
	ShakeDetector,
} from "./shake-detector";
