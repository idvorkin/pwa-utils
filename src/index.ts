/**
 * PWA Utils - Debugging utilities for Progressive Web Apps
 *
 * @packageDocumentation
 */

// Device Service
export {
	DeviceService,
	createMockDeviceService,
	type IDeviceService,
	type DeviceServiceType,
} from "./device-service";

// Session Recorder
export {
	SessionRecorder,
	createRecordAppEvent,
	getPersistedSessions,
	clearPersistedSessions,
	DEFAULT_CONFIG,
	type SessionRecording,
	type SessionRecorderConfig,
	type InteractionEvent,
	type StateChangeEvent,
	type MemorySnapshot,
	type EnvironmentInfo,
} from "./session-recorder";

// Version Check
export {
	VersionCheckService,
	createBrowserServiceWorkerAdapter,
	createMockServiceWorkerAdapter,
	type IVersionCheckService,
	type VersionCheckConfig,
	type VersionCheckState,
	type ServiceWorkerAdapter,
} from "./version-check";

// Bug Reporter
export {
	BugReporterService,
	ShakeDetector,
	buildGitHubIssueUrl,
	createEnvironmentMetadata,
	createMockShakeDetector,
	createScreenshotCapture,
	isMacPlatform,
	isMobileDevice,
	openBugReport,
	type BugReportConfig,
	type BugReportData,
	type IShakeDetector,
	type ScreenshotCapture,
	type ShakeDetectorConfig,
	type ShakeDetectorState,
} from "./bug-reporter";

// Sync Log
export {
	SyncLogService,
	createMockSyncLogService,
	openSyncLogDB,
	type ISyncLogService,
	type SyncLog,
	type SyncLogConfig,
	type SyncLogEventType,
	type SyncLogLevel,
} from "./sync-log";
