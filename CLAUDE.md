# PWA Utils

A TypeScript library providing PWA debugging utilities: session recording, bug reporting, version checking, and sync logging.

## Quick Start

```bash
just install    # Install dependencies
just test       # Run tests
just build      # Build the library
```

## Architecture

This library follows the **Humble Object** pattern for testability. Browser APIs are abstracted through `DeviceService`, allowing all modules to be fully tested without browser dependencies.

### Modules

| Module             | Description                                                         |
| ------------------ | ------------------------------------------------------------------- |
| `device-service`   | Testable interface for browser APIs (localStorage, navigator, etc.) |
| `session-recorder` | IndexedDB-based flight recorder for debugging                       |
| `version-check`    | Service worker update detection and management                      |
| `bug-reporter`     | GitHub issue creation + shake detection for mobile                  |
| `sync-log`         | Debug logging service for sync operations                           |

## Testing

All modules have comprehensive test coverage using Vitest with jsdom and fake-indexeddb.

```bash
just test           # Run all tests
just test-watch     # Run in watch mode
just test-coverage  # Run with coverage report
```

## Usage

```typescript
// Import from main entry
import {
  SessionRecorder,
  DeviceService,
  BugReporterService,
} from "@anthropic/pwa-utils";

// Or import specific modules
import { SessionRecorder } from "@anthropic/pwa-utils/session-recorder";
import { createMockDeviceService } from "@anthropic/pwa-utils/device-service";
```

## Convention Updates

**Last reviewed:** _YYYY-MM-DD (chop-conventions @ COMMIT_ID)_

Projects using chop-conventions should periodically review and update.
