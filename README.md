# PWA Utils

A TypeScript library providing debugging utilities for Progressive Web Apps: session recording, bug reporting, version checking, and sync logging.

## Installation

```bash
# From GitHub
npm install github:idvorkin/pwa-utils

# Or clone and link locally
git clone https://github.com/idvorkin/pwa-utils.git
cd pwa-utils
npm install
npm run build
```

## Modules

### Device Service

A "humble object" that abstracts browser APIs for testability. All other modules use this for browser interactions.

```typescript
import { DeviceService, createMockDeviceService } from "@idvorkin/pwa-utils";

// Production: uses real browser APIs
DeviceService.getStorageItem("key");
DeviceService.getUserAgent();
DeviceService.isOnline();

// Testing: use the mock
const mockDevice = createMockDeviceService({
  isOnline: () => false,
  getUserAgent: () => "test-agent",
});
```

### Session Recorder

IndexedDB-based flight recorder for debugging. Captures user interactions, errors, and state changes for later analysis.

```typescript
import { SessionRecorder, createRecordAppEvent } from "@idvorkin/pwa-utils";

// Create recorder
const recorder = new SessionRecorder({
  dbName: "my-app-sessions",
  maxInteractions: 500,
  autoSaveIntervalMs: 5000,
});

// Record app events
const recordEvent = createRecordAppEvent(recorder);
recordEvent("user_login", { userId: "123" });
recordEvent("page_view", { path: "/dashboard" });

// Get recording for bug reports
const recording = recorder.getRecording();
const blob = recorder.getRecordingAsBlob();

// Retrieve persisted sessions (survives page reload)
import { getPersistedSessions } from "@idvorkin/pwa-utils";
const sessions = await getPersistedSessions();
```

### Version Check

Service worker update detection and management.

```typescript
import {
  VersionCheckService,
  createMockServiceWorkerAdapter,
} from "@idvorkin/pwa-utils";

const versionCheck = new VersionCheckService({
  storageKey: "my-app-update-check",
  checkIntervalMs: 30 * 60 * 1000, // 30 minutes
});

// Subscribe to state changes
versionCheck.onStateChange((state) => {
  if (state.updateAvailable) {
    showUpdateBanner();
  }
});

// Manual check
await versionCheck.checkForUpdate();

// Apply update (reloads page)
versionCheck.applyUpdate();

// Cleanup
versionCheck.dispose();
```

### Bug Reporter

GitHub issue creation with shake detection for mobile devices.

```typescript
import {
  BugReporterService,
  ShakeDetector,
  buildGitHubIssueUrl,
  type VersionInfo,
} from "@idvorkin/pwa-utils";

// Import generated version info (see Version Generation below)
import { VERSION_INFO } from "./generated_version";

// Bug reporter service with version info
const bugReporter = new BugReporterService({
  repository: "owner/repo",
  shakeEnabledKey: "bug-reporter-shake",
  versionInfo: VERSION_INFO,
});

// Capture screenshot (desktop only)
const screenshot = await bugReporter.captureScreenshot();

// Submit bug report (opens GitHub)
// Metadata automatically includes: userAgent, platform, screen size,
// online status, timestamp, URL, and version info (sha, branch, commitUrl, buildTimestamp)
await bugReporter.submitReport({
  title: "Bug: Something went wrong",
  description: "Steps to reproduce...",
  includeMetadata: true,
  screenshot,
});

// Get version info programmatically
const version = bugReporter.getVersionInfo();
console.log(`Running build ${version?.shaShort} from ${version?.branch}`);

// Shake detection for mobile
const shakeDetector = new ShakeDetector({
  threshold: 25,
  cooldownMs: 2000,
});

shakeDetector.onShake(() => {
  openBugReportDialog();
});

// Request permission (required on iOS 13+)
await shakeDetector.requestPermission();
shakeDetector.setEnabled(true);
```

### Sync Log

Debug logging service for sync operations with automatic pruning.

```typescript
import { SyncLogService } from "@idvorkin/pwa-utils";

const syncLog = new SyncLogService({
  dbName: "my-app-sync-logs",
  maxLogs: 2000,
});

// Add log entries
await syncLog.addLog("syncState", "info", "Starting sync");
await syncLog.addLog("webSocket", "success", "Connected", { latency: 42 });
await syncLog.addLog("syncComplete", "error", "Sync failed", {
  error: "timeout",
});

// Retrieve logs (newest first)
const logs = await syncLog.getLogs();

// Export for debugging
const json = await syncLog.exportLogs();

// Clear old logs
await syncLog.clearAll();
```

### Version Generation

Generate build-time version info for bug reports and debugging. Run `scripts/generate-version.sh` during your build process.

```bash
# Add to your package.json scripts:
{
  "scripts": {
    "predev": "./scripts/generate-version.sh",
    "prebuild": "./scripts/generate-version.sh"
  }
}
```

This generates `src/generated_version.ts`:

```typescript
// Auto-generated at build time - DO NOT EDIT
export const GIT_SHA: string = "abc123def456...";
export const GIT_SHA_SHORT: string = "abc123d";
export const GIT_COMMIT_URL: string =
  "https://github.com/owner/repo/commit/abc123...";
export const GIT_CURRENT_URL: string =
  "https://github.com/owner/repo/tree/main";
export const GIT_BRANCH: string = "main";
export const BUILD_TIMESTAMP: string = "2025-01-15T12:00:00Z";

export const VERSION_INFO = {
  sha: GIT_SHA,
  shaShort: GIT_SHA_SHORT,
  commitUrl: GIT_COMMIT_URL,
  currentUrl: GIT_CURRENT_URL,
  branch: GIT_BRANCH,
  buildTimestamp: BUILD_TIMESTAMP,
} as const;

export type VersionInfo = typeof VERSION_INFO;
```

Use with BugReporterService:

```typescript
import { BugReporterService } from "@idvorkin/pwa-utils";
import { VERSION_INFO } from "./generated_version";

const bugReporter = new BugReporterService({
  repository: "owner/repo",
  versionInfo: VERSION_INFO,
});

// Version info is now included in all bug reports automatically
```

**Setup:**

1. Copy `scripts/generate-version.sh` to your project
2. Add pre-build hooks to `package.json`
3. Add `src/generated_version.ts` to `.gitignore`
4. Import `VERSION_INFO` where needed

## Testing

All modules include mock factories for easy testing:

```typescript
import {
  createMockDeviceService,
  createMockServiceWorkerAdapter,
  createMockShakeDetector,
  createMockSyncLogService,
} from "@idvorkin/pwa-utils";

// Mock device service
const mockDevice = createMockDeviceService({
  isOnline: () => false,
});

// Mock service worker adapter
const mockSW = createMockServiceWorkerAdapter();
mockSW.simulateUpdate(); // Triggers update available

// Mock shake detector
const mockShake = createMockShakeDetector({ enabled: true });
mockShake.simulateShake(); // Triggers shake callback

// Mock sync log (in-memory)
const mockLog = createMockSyncLogService();
await mockLog.addLog("test", "info", "Test message");
```

## Development

```bash
# Install dependencies
npm install

# Run tests
just test

# Run tests in watch mode
just test-watch

# Build
just build

# Type check
just typecheck
```

## Module Exports

The library supports both main entry and direct module imports:

```typescript
// Main entry (all modules)
import {
  SessionRecorder,
  DeviceService,
  BugReporterService,
} from "@idvorkin/pwa-utils";

// Direct module imports (for tree-shaking)
import { SessionRecorder } from "@idvorkin/pwa-utils/session-recorder";
import { DeviceService } from "@idvorkin/pwa-utils/device-service";
import { VersionCheckService } from "@idvorkin/pwa-utils/version-check";
import { BugReporterService } from "@idvorkin/pwa-utils/bug-reporter";
import { SyncLogService } from "@idvorkin/pwa-utils/sync-log";
```

## License

MIT
