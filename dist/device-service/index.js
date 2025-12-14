/**
 * DeviceService - Humble Object for browser API access
 *
 * Isolates localStorage, sessionStorage, and window calls for testability.
 * All browser API access should go through this service so tests can mock it.
 */
/**
 * Default implementation using real browser APIs
 */
export const DeviceService = {
    // localStorage
    getStorageItem(key) {
        try {
            return localStorage.getItem(key);
        }
        catch {
            return null;
        }
    },
    setStorageItem(key, value) {
        try {
            localStorage.setItem(key, value);
        }
        catch {
            // localStorage unavailable (private browsing, quota exceeded)
        }
    },
    removeStorageItem(key) {
        try {
            localStorage.removeItem(key);
        }
        catch {
            // localStorage unavailable
        }
    },
    // sessionStorage
    getSessionItem(key) {
        try {
            return sessionStorage.getItem(key);
        }
        catch {
            return null;
        }
    },
    setSessionItem(key, value) {
        try {
            sessionStorage.setItem(key, value);
        }
        catch {
            // sessionStorage unavailable
        }
    },
    // Navigator info
    getUserAgent() {
        return typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
    },
    getPlatform() {
        return typeof navigator !== "undefined" ? navigator.platform : "unknown";
    },
    getLanguage() {
        return typeof navigator !== "undefined" ? navigator.language : "en";
    },
    isOnline() {
        return typeof navigator !== "undefined" ? navigator.onLine : true;
    },
    getHardwareConcurrency() {
        return typeof navigator !== "undefined"
            ? navigator.hardwareConcurrency
            : undefined;
    },
    getDeviceMemory() {
        if (typeof navigator === "undefined")
            return undefined;
        return navigator.deviceMemory;
    },
    // Screen info
    getScreenWidth() {
        return typeof screen !== "undefined" ? screen.width : 0;
    },
    getScreenHeight() {
        return typeof screen !== "undefined" ? screen.height : 0;
    },
    getWindowWidth() {
        return typeof window !== "undefined" ? window.innerWidth : 0;
    },
    getWindowHeight() {
        return typeof window !== "undefined" ? window.innerHeight : 0;
    },
    getDevicePixelRatio() {
        return typeof window !== "undefined" ? window.devicePixelRatio : 1;
    },
    // Clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        }
        catch {
            return false;
        }
    },
    async copyImageToClipboard(dataUrl) {
        try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ [blob.type]: blob }),
            ]);
            return true;
        }
        catch {
            return false;
        }
    },
    // Time
    now() {
        return Date.now();
    },
};
/**
 * Create a mock DeviceService for testing
 */
export function createMockDeviceService(overrides = {}) {
    const storage = new Map();
    const sessionStorage = new Map();
    return {
        getStorageItem: (key) => storage.get(key) ?? null,
        setStorageItem: (key, value) => storage.set(key, value),
        removeStorageItem: (key) => storage.delete(key),
        getSessionItem: (key) => sessionStorage.get(key) ?? null,
        setSessionItem: (key, value) => sessionStorage.set(key, value),
        getUserAgent: () => "test-user-agent",
        getPlatform: () => "test-platform",
        getLanguage: () => "en-US",
        isOnline: () => true,
        getHardwareConcurrency: () => 4,
        getDeviceMemory: () => 8,
        getScreenWidth: () => 1920,
        getScreenHeight: () => 1080,
        getWindowWidth: () => 1280,
        getWindowHeight: () => 720,
        getDevicePixelRatio: () => 2,
        copyToClipboard: async () => true,
        copyImageToClipboard: async () => true,
        now: () => Date.now(),
        ...overrides,
    };
}
//# sourceMappingURL=index.js.map