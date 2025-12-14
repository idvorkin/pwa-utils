/**
 * DeviceService - Humble Object for browser API access
 *
 * Isolates localStorage, sessionStorage, and window calls for testability.
 * All browser API access should go through this service so tests can mock it.
 */
export interface IDeviceService {
    getStorageItem(key: string): string | null;
    setStorageItem(key: string, value: string): void;
    removeStorageItem(key: string): void;
    getSessionItem(key: string): string | null;
    setSessionItem(key: string, value: string): void;
    getUserAgent(): string;
    getPlatform(): string;
    getLanguage(): string;
    isOnline(): boolean;
    getHardwareConcurrency(): number | undefined;
    getDeviceMemory(): number | undefined;
    getScreenWidth(): number;
    getScreenHeight(): number;
    getWindowWidth(): number;
    getWindowHeight(): number;
    getDevicePixelRatio(): number;
    copyToClipboard(text: string): Promise<boolean>;
    copyImageToClipboard(dataUrl: string): Promise<boolean>;
    now(): number;
}
/**
 * Default implementation using real browser APIs
 */
export declare const DeviceService: IDeviceService;
/**
 * Create a mock DeviceService for testing
 */
export declare function createMockDeviceService(overrides?: Partial<IDeviceService>): IDeviceService;
export type DeviceServiceType = typeof DeviceService;
//# sourceMappingURL=index.d.ts.map