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
import { DeviceService, createMockDeviceService } from "@anthropic/pwa-utils";

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
import { SessionRecorder, createRecordAppEvent } from "@anthropic/pwa-utils";

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
import { getPersistedSessions } from "@anthropic/pwa-utils";
const sessions = await getPersistedSessions();
```

### Version Check

Service worker update detection and management.

```typescript
import {
  VersionCheckService,
  createMockServiceWorkerAdapter,
} from "@anthropic/pwa-utils";

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
} from "@anthropic/pwa-utils";

// Bug reporter service
const bugReporter = new BugReporterService({
  repository: "owner/repo",
  shakeEnabledKey: "bug-reporter-shake",
});

// Capture screenshot (desktop only)
const screenshot = await bugReporter.captureScreenshot();

// Submit bug report (opens GitHub)
await bugReporter.submitReport({
  title: "Bug: Something went wrong",
  description: "Steps to reproduce...",
  includeMetadata: true,
  screenshot,
});

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
import { SyncLogService } from "@anthropic/pwa-utils";

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

## Testing

All modules include mock factories for easy testing:

```typescript
import {
  createMockDeviceService,
  createMockServiceWorkerAdapter,
  createMockShakeDetector,
  createMockSyncLogService,
} from "@anthropic/pwa-utils";

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
} from "@anthropic/pwa-utils";

// Direct module imports (for tree-shaking)
import { SessionRecorder } from "@anthropic/pwa-utils/session-recorder";
import { DeviceService } from "@anthropic/pwa-utils/device-service";
import { VersionCheckService } from "@anthropic/pwa-utils/version-check";
import { BugReporterService } from "@anthropic/pwa-utils/bug-reporter";
import { SyncLogService } from "@anthropic/pwa-utils/sync-log";
```

## License

MIT
