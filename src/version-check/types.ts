/**
 * Version Check Types
 */

export interface VersionCheckConfig {
	/** Key for storing last update check time (default: 'pwa-last-update-check') */
	storageKey?: string;
	/** Interval in ms for automatic update checks (default: 30 minutes) */
	checkIntervalMs?: number;
}

export interface VersionCheckState {
	/** Whether an update is available */
	updateAvailable: boolean;
	/** Whether currently checking for updates */
	isChecking: boolean;
	/** Last time an update check was performed */
	lastCheckTime: Date | null;
	/** Whether a service worker is registered */
	serviceWorkerAvailable: boolean;
}

export interface IVersionCheckService {
	/** Get current state */
	getState(): VersionCheckState;
	/** Check for updates manually */
	checkForUpdate(): Promise<void>;
	/** Apply the update (reload with new service worker) */
	applyUpdate(): void;
	/** Register a callback for state changes */
	onStateChange(callback: (state: VersionCheckState) => void): () => void;
	/** Dispose of the service and clean up listeners */
	dispose(): void;
}

export interface ServiceWorkerAdapter {
	/** Get the current service worker registration */
	getRegistration(): ServiceWorkerRegistration | null;
	/** Update the service worker */
	update(): Promise<void>;
	/** Skip waiting and activate new service worker */
	skipWaiting(): void;
	/** Register callback for when update is available */
	onUpdateAvailable(callback: () => void): () => void;
}
