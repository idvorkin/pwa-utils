/**
 * SessionRecorder - Flight recorder for PWA debugging
 *
 * Records user interactions, console output, errors, and environment info.
 * Always active, stores in memory AND IndexedDB for crash recovery.
 */

import {
	clearPersistedSessions,
	getPersistedSessions,
	pruneOldSessions,
	saveSessionToDB,
} from "./db";
import {
	DEFAULT_CONFIG,
	type EnvironmentInfo,
	type InteractionEvent,
	type MemorySnapshot,
	type SessionRecorderConfig,
	type SessionRecording,
	type StateChangeEvent,
} from "./types";

export class SessionRecorder {
	private recording: SessionRecording;
	private config: Required<SessionRecorderConfig>;
	private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
	private memoryInterval: ReturnType<typeof setInterval> | null = null;

	// Event handler references for cleanup
	private clickHandler: ((e: MouseEvent) => void) | null = null;
	private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
	private errorHandler: ((e: ErrorEvent) => void) | null = null;
	private rejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null;
	private beforeUnloadHandler: (() => void) | null = null;
	private originalConsoleError: ((...args: unknown[]) => void) | null = null;

	constructor(config: SessionRecorderConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.recording = this.createNewRecording();
	}

	/**
	 * Start recording (call this after construction)
	 */
	start(): void {
		this.setupEventListeners();
		this.startAutoSave();
		this.startMemoryTracking();
	}

	private createNewRecording(): SessionRecording {
		return {
			version: "1.0.0",
			sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			startTime: Date.now(),
			environment: this.captureEnvironment(),
			interactions: [],
			stateChanges: [],
			memorySnapshots: [],
		};
	}

	private captureEnvironment(): EnvironmentInfo {
		const nav = typeof navigator !== "undefined" ? navigator : null;
		const win = typeof window !== "undefined" ? window : null;
		const scr = typeof screen !== "undefined" ? screen : null;

		return {
			// Build info
			buildVersion: this.config.buildInfo.version,
			buildCommit: this.config.buildInfo.commit,
			buildTime: this.config.buildInfo.time,

			// Browser/OS
			userAgent: nav?.userAgent ?? "unknown",
			platform: nav?.platform ?? "unknown",
			language: nav?.language ?? "unknown",
			cookiesEnabled: nav?.cookieEnabled ?? false,
			onLine: nav?.onLine ?? true,

			// Display
			screenWidth: scr?.width ?? 0,
			screenHeight: scr?.height ?? 0,
			windowWidth: win?.innerWidth ?? 0,
			windowHeight: win?.innerHeight ?? 0,
			devicePixelRatio: win?.devicePixelRatio ?? 1,
			colorDepth: scr?.colorDepth ?? 24,

			// Hardware
			hardwareConcurrency: nav?.hardwareConcurrency,
			deviceMemory: (nav as Navigator & { deviceMemory?: number })
				?.deviceMemory,

			// WebGL
			...this.getWebGLInfo(),

			// Video codecs
			videoCodecs: this.checkVideoCodecs(),
		};
	}

	private getWebGLInfo(): Partial<EnvironmentInfo> {
		if (typeof document === "undefined") return {};

		try {
			const canvas = document.createElement("canvas");
			const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
			if (!gl) return {};

			const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
			return {
				webglRenderer: debugInfo
					? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
					: undefined,
				webglVendor: debugInfo
					? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string)
					: undefined,
				webglVersion: gl.getParameter(gl.VERSION) as string,
			};
		} catch {
			return {};
		}
	}

	private checkVideoCodecs(): EnvironmentInfo["videoCodecs"] {
		if (typeof document === "undefined") {
			return {
				h264: false,
				h265: false,
				vp8: false,
				vp9: false,
				av1: false,
				webm: false,
			};
		}

		try {
			const video = document.createElement("video");
			return {
				h264: video.canPlayType('video/mp4; codecs="avc1.42E01E"') !== "",
				h265: video.canPlayType('video/mp4; codecs="hev1.1.6.L93.B0"') !== "",
				vp8: video.canPlayType('video/webm; codecs="vp8"') !== "",
				vp9: video.canPlayType('video/webm; codecs="vp9"') !== "",
				av1: video.canPlayType('video/mp4; codecs="av01.0.01M.08"') !== "",
				webm: video.canPlayType("video/webm") !== "",
			};
		} catch {
			return {
				h264: false,
				h265: false,
				vp8: false,
				vp9: false,
				av1: false,
				webm: false,
			};
		}
	}

	private setupEventListeners(): void {
		if (typeof window === "undefined") return;

		// Capture clicks
		this.clickHandler = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			this.recordInteraction({
				type: "click",
				timestamp: Date.now(),
				target: this.describeElement(target),
				details: {
					x: e.clientX,
					y: e.clientY,
					button: e.button,
				},
			});
		};
		window.addEventListener("click", this.clickHandler, { capture: true });

		// Capture key presses (only shortcuts, not typing)
		this.keydownHandler = (e: KeyboardEvent) => {
			if (e.key.length > 1 || e.ctrlKey || e.metaKey || e.altKey) {
				this.recordInteraction({
					type: "keydown",
					timestamp: Date.now(),
					target: this.describeElement(e.target as HTMLElement),
					details: {
						key: e.key,
						code: e.code,
						ctrl: e.ctrlKey,
						meta: e.metaKey,
						alt: e.altKey,
						shift: e.shiftKey,
					},
				});
			}
		};
		window.addEventListener("keydown", this.keydownHandler, { capture: true });

		// Capture console errors
		this.originalConsoleError = console.error;
		console.error = (...args: unknown[]) => {
			this.recordStateChange({
				type: "error",
				timestamp: Date.now(),
				details: {
					source: "console.error",
					message: args
						.map((a) => {
							if (typeof a === "string") return a;
							if (a instanceof Error) return `${a.name}: ${a.message}`;
							try {
								return JSON.stringify(a);
							} catch {
								return String(a);
							}
						})
						.join(" "),
				},
			});
			this.originalConsoleError?.apply(console, args);
		};

		// Capture unhandled errors
		this.errorHandler = (e: ErrorEvent) => {
			this.recordStateChange({
				type: "error",
				timestamp: Date.now(),
				details: {
					source: "window.onerror",
					message: e.message,
					filename: e.filename,
					lineno: e.lineno,
					colno: e.colno,
				},
			});
		};
		window.addEventListener("error", this.errorHandler);

		// Capture unhandled promise rejections
		this.rejectionHandler = (e: PromiseRejectionEvent) => {
			this.recordStateChange({
				type: "error",
				timestamp: Date.now(),
				details: {
					source: "unhandledrejection",
					message: `Unhandled rejection: ${e.reason}`,
				},
			});
		};
		window.addEventListener("unhandledrejection", this.rejectionHandler);
	}

	private describeElement(el: HTMLElement | null): string {
		if (!el) return "unknown";

		const parts: string[] = [el.tagName.toLowerCase()];

		if (el.id) {
			parts.push(`#${el.id}`);
		}

		if (el.className && typeof el.className === "string") {
			const classes = el.className.split(" ").filter(Boolean).slice(0, 3);
			if (classes.length > 0) {
				parts.push(`.${classes.join(".")}`);
			}
		}

		const fullText = el.textContent?.trim();
		const text = fullText?.slice(0, 30);
		if (text) {
			parts.push(`"${text}${fullText && fullText.length > 30 ? "..." : ""}"`);
		}

		return parts.join("");
	}

	private startAutoSave(): void {
		if (typeof window === "undefined") return;

		this.autoSaveInterval = setInterval(() => {
			this.persistToStorage();
		}, this.config.autoSaveIntervalMs);

		// Also save on page unload
		this.beforeUnloadHandler = () => {
			this.persistToStorage();
		};
		window.addEventListener("beforeunload", this.beforeUnloadHandler);

		// Initial save after setup
		setTimeout(() => this.persistToStorage(), 1000);
	}

	private async persistToStorage(): Promise<void> {
		const recording = this.getRecording();
		const dbConfig = {
			dbName: this.config.dbName,
			storeName: this.config.storeName,
			maxSessions: this.config.maxSessions,
		};
		await saveSessionToDB(dbConfig, recording);
		await pruneOldSessions(dbConfig);
	}

	private startMemoryTracking(): void {
		if (typeof window === "undefined") return;

		const perf = performance as Performance & {
			memory?: {
				usedJSHeapSize: number;
				totalJSHeapSize: number;
				jsHeapSizeLimit: number;
			};
		};

		if (!perf.memory) {
			return;
		}

		this.memoryInterval = setInterval(() => {
			this.captureMemorySnapshot();
		}, this.config.memoryIntervalMs);

		// Initial capture
		this.captureMemorySnapshot();
	}

	private captureMemorySnapshot(): void {
		const perf = performance as Performance & {
			memory?: {
				usedJSHeapSize: number;
				totalJSHeapSize: number;
				jsHeapSizeLimit: number;
			};
		};

		if (!perf.memory) return;

		const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = perf.memory;
		const usedMB = Math.round((usedJSHeapSize / 1024 / 1024) * 100) / 100;
		const totalMB = Math.round((totalJSHeapSize / 1024 / 1024) * 100) / 100;
		const limitMB = Math.round((jsHeapSizeLimit / 1024 / 1024) * 100) / 100;
		const percentUsed =
			Math.round((usedJSHeapSize / jsHeapSizeLimit) * 10000) / 100;

		const snapshot: MemorySnapshot = {
			timestamp: Date.now(),
			usedJSHeapSize,
			totalJSHeapSize,
			jsHeapSizeLimit,
			usedMB,
			totalMB,
			limitMB,
			percentUsed,
		};

		this.recording.memorySnapshots.push(snapshot);

		// Trim old snapshots if over limit
		if (
			this.recording.memorySnapshots.length > this.config.maxMemorySnapshots
		) {
			this.recording.memorySnapshots = this.recording.memorySnapshots.slice(
				-this.config.maxMemorySnapshots,
			);
		}

		// Log warning if memory usage is high
		if (percentUsed > this.config.highMemoryThreshold) {
			console.warn(
				`[SessionRecorder] HIGH MEMORY: ${usedMB}MB / ${limitMB}MB (${percentUsed}%)`,
			);
		}
	}

	/**
	 * Record a user interaction
	 */
	recordInteraction(event: InteractionEvent): void {
		this.recording.interactions.push(event);

		if (this.recording.interactions.length > this.config.maxInteractions) {
			this.recording.interactions = this.recording.interactions.slice(
				-this.config.maxInteractions,
			);
		}
	}

	/**
	 * Record a state change event
	 */
	recordStateChange(event: StateChangeEvent): void {
		this.recording.stateChanges.push(event);

		if (this.recording.stateChanges.length > this.config.maxStateChanges) {
			this.recording.stateChanges = this.recording.stateChanges.slice(
				-this.config.maxStateChanges,
			);
		}
	}

	/**
	 * Set app settings for debugging
	 */
	setAppSettings(settings: Record<string, unknown>): void {
		this.recording.environment.appSettings = settings;
	}

	/**
	 * Get current environment info
	 */
	getEnvironment(): EnvironmentInfo {
		return this.recording.environment;
	}

	/**
	 * Get the current recording
	 */
	getRecording(): SessionRecording {
		return {
			...this.recording,
			endTime: Date.now(),
		};
	}

	/**
	 * Get recording as downloadable blob
	 */
	getRecordingAsBlob(): Blob {
		const recording = this.getRecording();
		const json = JSON.stringify(recording, null, 2);
		return new Blob([json], { type: "application/json" });
	}

	/**
	 * Download the recording
	 */
	downloadRecording(filename?: string): void {
		const blob = this.getRecordingAsBlob();
		const url = URL.createObjectURL(blob);
		try {
			const a = document.createElement("a");
			a.href = url;
			a.download = filename ?? `session-${this.recording.sessionId}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		} finally {
			URL.revokeObjectURL(url);
		}
	}

	/**
	 * Get recording stats
	 */
	getStats(): {
		duration: number;
		interactions: number;
		stateChanges: number;
		memorySnapshots: number;
		errors: number;
	} {
		const errors = this.recording.stateChanges.filter(
			(e) => e.type === "error",
		).length;
		return {
			duration: Date.now() - this.recording.startTime,
			interactions: this.recording.interactions.length,
			stateChanges: this.recording.stateChanges.length,
			memorySnapshots: this.recording.memorySnapshots.length,
			errors,
		};
	}

	/**
	 * Get persisted sessions from IndexedDB
	 */
	async getPersistedSessions(): Promise<SessionRecording[]> {
		return getPersistedSessions({
			dbName: this.config.dbName,
			storeName: this.config.storeName,
			maxSessions: this.config.maxSessions,
		});
	}

	/**
	 * Clear all persisted sessions
	 */
	async clearPersistedSessions(): Promise<void> {
		return clearPersistedSessions({
			dbName: this.config.dbName,
			storeName: this.config.storeName,
			maxSessions: this.config.maxSessions,
		});
	}

	/**
	 * Clear and start a new recording
	 */
	reset(): void {
		this.recording = this.createNewRecording();
	}

	/**
	 * Cleanup - remove all event listeners and stop intervals
	 */
	dispose(): void {
		if (this.autoSaveInterval) {
			clearInterval(this.autoSaveInterval);
			this.autoSaveInterval = null;
		}

		if (this.memoryInterval) {
			clearInterval(this.memoryInterval);
			this.memoryInterval = null;
		}

		// Final save before disposing (fire-and-forget with error handling)
		this.persistToStorage().catch((error) => {
			console.error("Failed to persist session on dispose:", error);
		});

		if (typeof window !== "undefined") {
			if (this.clickHandler) {
				window.removeEventListener("click", this.clickHandler, {
					capture: true,
				});
				this.clickHandler = null;
			}
			if (this.keydownHandler) {
				window.removeEventListener("keydown", this.keydownHandler, {
					capture: true,
				});
				this.keydownHandler = null;
			}
			if (this.errorHandler) {
				window.removeEventListener("error", this.errorHandler);
				this.errorHandler = null;
			}
			if (this.rejectionHandler) {
				window.removeEventListener("unhandledrejection", this.rejectionHandler);
				this.rejectionHandler = null;
			}
			if (this.beforeUnloadHandler) {
				window.removeEventListener("beforeunload", this.beforeUnloadHandler);
				this.beforeUnloadHandler = null;
			}
		}

		// Restore original console.error
		if (this.originalConsoleError) {
			console.error = this.originalConsoleError;
			this.originalConsoleError = null;
		}
	}
}

/**
 * Convenience function to record an app event
 */
export function createRecordAppEvent(recorder: SessionRecorder) {
	return function recordAppEvent(
		type: string,
		details?: Record<string, unknown>,
	): void {
		recorder.recordStateChange({
			type,
			timestamp: Date.now(),
			details,
		});
	};
}
