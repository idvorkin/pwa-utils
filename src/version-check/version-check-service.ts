/**
 * Version Check Service
 *
 * Framework-agnostic service for checking PWA updates via service worker.
 * Can be used directly or wrapped by framework-specific hooks.
 */

import type { IDeviceService } from "../device-service";
import { DeviceService } from "../device-service";
import type {
	IVersionCheckService,
	ServiceWorkerAdapter,
	VersionCheckConfig,
	VersionCheckState,
} from "./types";

const DEFAULT_STORAGE_KEY = "pwa-last-update-check";
const DEFAULT_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Default service worker adapter that uses the browser's ServiceWorker API
 */
export function createBrowserServiceWorkerAdapter(): ServiceWorkerAdapter {
	let registration: ServiceWorkerRegistration | null = null;
	let updateCallback: (() => void) | null = null;

	// Register for service worker
	if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
		navigator.serviceWorker.ready.then((reg) => {
			registration = reg;

			// Listen for new service worker waiting
			reg.addEventListener("updatefound", () => {
				const newWorker = reg.installing;
				if (newWorker) {
					newWorker.addEventListener("statechange", () => {
						if (
							newWorker.state === "installed" &&
							navigator.serviceWorker.controller
						) {
							// New service worker is installed and waiting
							updateCallback?.();
						}
					});
				}
			});
		});
	}

	return {
		getRegistration() {
			return registration;
		},
		async update() {
			if (registration) {
				await registration.update();
			}
		},
		skipWaiting() {
			if (registration?.waiting) {
				registration.waiting.postMessage({ type: "SKIP_WAITING" });
			}
			window.location.reload();
		},
		onUpdateAvailable(callback: () => void) {
			updateCallback = callback;
			return () => {
				updateCallback = null;
			};
		},
	};
}

/**
 * Create a mock service worker adapter for testing
 */
export function createMockServiceWorkerAdapter(
	overrides: Partial<ServiceWorkerAdapter> = {},
): ServiceWorkerAdapter {
	let updateCallback: (() => void) | null = null;
	let hasUpdate = false;

	const adapter: ServiceWorkerAdapter = {
		getRegistration: () => null,
		update: async () => {
			// Simulate update check
		},
		skipWaiting: () => {
			// Simulate skip waiting
		},
		onUpdateAvailable(callback: () => void) {
			updateCallback = callback;
			// Trigger callback if update was already set
			if (hasUpdate) {
				callback();
			}
			return () => {
				updateCallback = null;
			};
		},
		...overrides,
	};

	// Add helper to simulate update for testing
	(
		adapter as ServiceWorkerAdapter & { simulateUpdate: () => void }
	).simulateUpdate = () => {
		hasUpdate = true;
		updateCallback?.();
	};

	return adapter;
}

export class VersionCheckService implements IVersionCheckService {
	private state: VersionCheckState;
	private listeners: Set<(state: VersionCheckState) => void> = new Set();
	private checkInterval: ReturnType<typeof setInterval> | null = null;
	private unsubscribeUpdate: (() => void) | null = null;
	private config: Required<VersionCheckConfig>;
	private deviceService: IDeviceService;
	private swAdapter: ServiceWorkerAdapter;

	constructor(
		config: VersionCheckConfig = {},
		deviceService: IDeviceService = DeviceService,
		swAdapter?: ServiceWorkerAdapter,
	) {
		this.config = {
			storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
			checkIntervalMs: config.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS,
		};
		this.deviceService = deviceService;
		this.swAdapter = swAdapter ?? createBrowserServiceWorkerAdapter();

		// Initialize state from storage
		const storedTime = this.deviceService.getStorageItem(
			this.config.storageKey,
		);
		this.state = {
			updateAvailable: false,
			isChecking: false,
			lastCheckTime: storedTime ? new Date(storedTime) : null,
			serviceWorkerAvailable: false,
		};

		// Subscribe to update notifications
		this.unsubscribeUpdate = this.swAdapter.onUpdateAvailable(() => {
			this.updateState({ updateAvailable: true });
		});

		// Start periodic update checks
		this.startPeriodicChecks();
	}

	getState(): VersionCheckState {
		return { ...this.state };
	}

	async checkForUpdate(): Promise<void> {
		if (this.state.isChecking) return;

		this.updateState({ isChecking: true });

		try {
			await this.swAdapter.update();
			const now = new Date();
			this.deviceService.setStorageItem(
				this.config.storageKey,
				now.toISOString(),
			);
			this.updateState({
				lastCheckTime: now,
				serviceWorkerAvailable: this.swAdapter.getRegistration() !== null,
			});
		} catch (error) {
			console.error("Failed to check for updates:", error);
		} finally {
			this.updateState({ isChecking: false });
		}
	}

	applyUpdate(): void {
		this.swAdapter.skipWaiting();
	}

	onStateChange(callback: (state: VersionCheckState) => void): () => void {
		this.listeners.add(callback);
		return () => {
			this.listeners.delete(callback);
		};
	}

	dispose(): void {
		if (this.checkInterval) {
			clearInterval(this.checkInterval);
			this.checkInterval = null;
		}
		if (this.unsubscribeUpdate) {
			this.unsubscribeUpdate();
			this.unsubscribeUpdate = null;
		}
		this.listeners.clear();
	}

	private updateState(partial: Partial<VersionCheckState>): void {
		this.state = { ...this.state, ...partial };
		for (const listener of this.listeners) {
			listener(this.getState());
		}
	}

	private startPeriodicChecks(): void {
		if (this.config.checkIntervalMs > 0) {
			this.checkInterval = setInterval(() => {
				this.checkForUpdate();
			}, this.config.checkIntervalMs);
		}
	}
}
