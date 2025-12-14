/**
 * PWA Utils - Debugging utilities for Progressive Web Apps
 *
 * @packageDocumentation
 */
export { DeviceService, createMockDeviceService, type IDeviceService, type DeviceServiceType, } from "./device-service";
export { SessionRecorder, createRecordAppEvent, getPersistedSessions, clearPersistedSessions, DEFAULT_CONFIG, type SessionRecording, type SessionRecorderConfig, type InteractionEvent, type StateChangeEvent, type MemorySnapshot, type EnvironmentInfo, } from "./session-recorder";
export { VersionCheckService, createBrowserServiceWorkerAdapter, createMockServiceWorkerAdapter, type IVersionCheckService, type VersionCheckConfig, type VersionCheckState, type ServiceWorkerAdapter, } from "./version-check";
export { BugReporterService, ShakeDetector, buildGitHubIssueUrl, createEnvironmentMetadata, createMockShakeDetector, createScreenshotCapture, isMacPlatform, isMobileDevice, openBugReport, type BugReportConfig, type BugReportData, type IShakeDetector, type ScreenshotCapture, type ShakeDetectorConfig, type ShakeDetectorState, type VersionInfo, } from "./bug-reporter";
export { SyncLogService, createMockSyncLogService, openSyncLogDB, type ISyncLogService, type SyncLog, type SyncLogConfig, type SyncLogEventType, type SyncLogLevel, } from "./sync-log";
//# sourceMappingURL=index.d.ts.map