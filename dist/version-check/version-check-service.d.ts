/**
 * Version Check Service
 *
 * Framework-agnostic service for checking PWA updates via service worker.
 * Can be used directly or wrapped by framework-specific hooks.
 */
import type { IDeviceService } from "../device-service";
import type { IVersionCheckService, ServiceWorkerAdapter, VersionCheckConfig, VersionCheckState } from "./types";
/**
 * Default service worker adapter that uses the browser's ServiceWorker API
 */
export declare function createBrowserServiceWorkerAdapter(): ServiceWorkerAdapter;
/**
 * Create a mock service worker adapter for testing
 */
export declare function createMockServiceWorkerAdapter(overrides?: Partial<ServiceWorkerAdapter>): ServiceWorkerAdapter;
export declare class VersionCheckService implements IVersionCheckService {
    private state;
    private listeners;
    private checkInterval;
    private unsubscribeUpdate;
    private config;
    private deviceService;
    private swAdapter;
    constructor(config?: VersionCheckConfig, deviceService?: IDeviceService, swAdapter?: ServiceWorkerAdapter);
    getState(): VersionCheckState;
    checkForUpdate(): Promise<void>;
    applyUpdate(): void;
    onStateChange(callback: (state: VersionCheckState) => void): () => void;
    dispose(): void;
    private updateState;
    private startPeriodicChecks;
}
//# sourceMappingURL=version-check-service.d.ts.map