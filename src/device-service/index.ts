/**
 * DeviceService - Humble Object for browser API access
 *
 * Isolates localStorage, sessionStorage, and window calls for testability.
 * All browser API access should go through this service so tests can mock it.
 */

export interface IDeviceService {
	// localStorage
	getStorageItem(key: string): string | null;
	setStorageItem(key: string, value: string): void;
	removeStorageItem(key: string): void;

	// sessionStorage
	getSessionItem(key: string): string | null;
	setSessionItem(key: string, value: string): void;

	// Navigator info
	getUserAgent(): string;
	getPlatform(): string;
	getLanguage(): string;
	isOnline(): boolean;
	getHardwareConcurrency(): number | undefined;
	getDeviceMemory(): number | undefined;

	// Screen info
	getScreenWidth(): number;
	getScreenHeight(): number;
	getWindowWidth(): number;
	getWindowHeight(): number;
	getDevicePixelRatio(): number;

	// Clipboard
	copyToClipboard(text: string): Promise<boolean>;
	copyImageToClipboard(dataUrl: string): Promise<boolean>;

	// Time
	now(): number;
}

/**
 * Default implementation using real browser APIs
 */
export const DeviceService: IDeviceService = {
	// localStorage
	getStorageItem(key: string): string | null {
		try {
			return localStorage.getItem(key);
		} catch {
			return null;
		}
	},

	setStorageItem(key: string, value: string): void {
		try {
			localStorage.setItem(key, value);
		} catch {
			// localStorage unavailable (private browsing, quota exceeded)
		}
	},

	removeStorageItem(key: string): void {
		try {
			localStorage.removeItem(key);
		} catch {
			// localStorage unavailable
		}
	},

	// sessionStorage
	getSessionItem(key: string): string | null {
		try {
			return sessionStorage.getItem(key);
		} catch {
			return null;
		}
	},

	setSessionItem(key: string, value: string): void {
		try {
			sessionStorage.setItem(key, value);
		} catch {
			// sessionStorage unavailable
		}
	},

	// Navigator info
	getUserAgent(): string {
		return typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
	},

	getPlatform(): string {
		return typeof navigator !== "undefined" ? navigator.platform : "unknown";
	},

	getLanguage(): string {
		return typeof navigator !== "undefined" ? navigator.language : "en";
	},

	isOnline(): boolean {
		return typeof navigator !== "undefined" ? navigator.onLine : true;
	},

	getHardwareConcurrency(): number | undefined {
		return typeof navigator !== "undefined"
			? navigator.hardwareConcurrency
			: undefined;
	},

	getDeviceMemory(): number | undefined {
		if (typeof navigator === "undefined") return undefined;
		return (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
	},

	// Screen info
	getScreenWidth(): number {
		return typeof screen !== "undefined" ? screen.width : 0;
	},

	getScreenHeight(): number {
		return typeof screen !== "undefined" ? screen.height : 0;
	},

	getWindowWidth(): number {
		return typeof window !== "undefined" ? window.innerWidth : 0;
	},

	getWindowHeight(): number {
		return typeof window !== "undefined" ? window.innerHeight : 0;
	},

	getDevicePixelRatio(): number {
		return typeof window !== "undefined" ? window.devicePixelRatio : 1;
	},

	// Clipboard
	async copyToClipboard(text: string): Promise<boolean> {
		try {
			await navigator.clipboard.writeText(text);
			return true;
		} catch {
			return false;
		}
	},

	async copyImageToClipboard(dataUrl: string): Promise<boolean> {
		try {
			const response = await fetch(dataUrl);
			const blob = await response.blob();
			await navigator.clipboard.write([
				new ClipboardItem({ [blob.type]: blob }),
			]);
			return true;
		} catch {
			return false;
		}
	},

	// Time
	now(): number {
		return Date.now();
	},
};

/**
 * Create a mock DeviceService for testing
 */
export function createMockDeviceService(
	overrides: Partial<IDeviceService> = {},
): IDeviceService {
	const storage = new Map<string, string>();
	const sessionStorage = new Map<string, string>();

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

export type DeviceServiceType = typeof DeviceService;
