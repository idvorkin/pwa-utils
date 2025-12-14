/**
 * Version Check Service
 *
 * Framework-agnostic service for checking PWA updates via service worker.
 * Can be used directly or wrapped by framework-specific hooks.
 */
import { DeviceService } from "../device-service";
const DEFAULT_STORAGE_KEY = "pwa-last-update-check";
const DEFAULT_CHECK_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
/**
 * Default service worker adapter that uses the browser's ServiceWorker API
 */
export function createBrowserServiceWorkerAdapter() {
    let registration = null;
    let updateCallback = null;
    // Register for service worker
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
            registration = reg;
            // Listen for new service worker waiting
            reg.addEventListener("updatefound", () => {
                const newWorker = reg.installing;
                if (newWorker) {
                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed" &&
                            navigator.serviceWorker.controller) {
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
        onUpdateAvailable(callback) {
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
export function createMockServiceWorkerAdapter(overrides = {}) {
    let updateCallback = null;
    let hasUpdate = false;
    const adapter = {
        getRegistration: () => null,
        update: async () => {
            // Simulate update check
        },
        skipWaiting: () => {
            // Simulate skip waiting
        },
        onUpdateAvailable(callback) {
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
    adapter.simulateUpdate = () => {
        hasUpdate = true;
        updateCallback?.();
    };
    return adapter;
}
export class VersionCheckService {
    constructor(config = {}, deviceService = DeviceService, swAdapter) {
        this.listeners = new Set();
        this.checkInterval = null;
        this.unsubscribeUpdate = null;
        this.config = {
            storageKey: config.storageKey ?? DEFAULT_STORAGE_KEY,
            checkIntervalMs: config.checkIntervalMs ?? DEFAULT_CHECK_INTERVAL_MS,
        };
        this.deviceService = deviceService;
        this.swAdapter = swAdapter ?? createBrowserServiceWorkerAdapter();
        // Initialize state from storage
        const storedTime = this.deviceService.getStorageItem(this.config.storageKey);
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
    getState() {
        return { ...this.state };
    }
    async checkForUpdate() {
        if (this.state.isChecking)
            return;
        this.updateState({ isChecking: true });
        try {
            await this.swAdapter.update();
            const now = new Date();
            this.deviceService.setStorageItem(this.config.storageKey, now.toISOString());
            this.updateState({
                lastCheckTime: now,
                serviceWorkerAvailable: this.swAdapter.getRegistration() !== null,
            });
        }
        catch (error) {
            console.error("Failed to check for updates:", error);
        }
        finally {
            this.updateState({ isChecking: false });
        }
    }
    applyUpdate() {
        this.swAdapter.skipWaiting();
    }
    onStateChange(callback) {
        this.listeners.add(callback);
        return () => {
            this.listeners.delete(callback);
        };
    }
    dispose() {
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
    updateState(partial) {
        this.state = { ...this.state, ...partial };
        for (const listener of this.listeners) {
            listener(this.getState());
        }
    }
    startPeriodicChecks() {
        if (this.config.checkIntervalMs > 0) {
            this.checkInterval = setInterval(() => {
                this.checkForUpdate();
            }, this.config.checkIntervalMs);
        }
    }
}
//# sourceMappingURL=version-check-service.js.map