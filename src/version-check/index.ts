/**
 * Version Check Module
 *
 * Provides service worker update detection and management for PWAs.
 */

export type {
	IVersionCheckService,
	ServiceWorkerAdapter,
	VersionCheckConfig,
	VersionCheckState,
} from "./types";

export {
	createBrowserServiceWorkerAdapter,
	createMockServiceWorkerAdapter,
	VersionCheckService,
} from "./version-check-service";
