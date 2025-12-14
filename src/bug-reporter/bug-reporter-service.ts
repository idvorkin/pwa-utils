/**
 * Bug Reporter Service
 *
 * Framework-agnostic service for creating and submitting bug reports.
 * Handles screenshot capture, metadata collection, and GitHub integration.
 */

import type { IDeviceService } from "../device-service";
import { DeviceService } from "../device-service";
import type {
	BugReportConfig,
	BugReportData,
	ScreenshotCapture,
} from "./types";

const DEFAULT_SHAKE_ENABLED_KEY = "pwa-bug-reporter-shake-enabled";

/**
 * Create metadata about the current environment
 */
export function createEnvironmentMetadata(
	deviceService: IDeviceService = DeviceService,
): Record<string, unknown> {
	return {
		userAgent: deviceService.getUserAgent(),
		platform: deviceService.getPlatform(),
		language: deviceService.getLanguage(),
		screenWidth: deviceService.getScreenWidth(),
		screenHeight: deviceService.getScreenHeight(),
		windowWidth: deviceService.getWindowWidth(),
		windowHeight: deviceService.getWindowHeight(),
		devicePixelRatio: deviceService.getDevicePixelRatio(),
		online: deviceService.isOnline(),
		timestamp: new Date().toISOString(),
		url: typeof window !== "undefined" ? window.location.href : "unknown",
	};
}

/**
 * Detect if running on a Mac platform
 */
export function isMacPlatform(
	deviceService: IDeviceService = DeviceService,
): boolean {
	const platform = deviceService.getPlatform();
	return platform.toLowerCase().includes("mac");
}

/**
 * Detect if running on a mobile device
 */
export function isMobileDevice(
	deviceService: IDeviceService = DeviceService,
): boolean {
	const userAgent = deviceService.getUserAgent();
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		userAgent,
	);
}

/**
 * Create a screenshot capture utility
 */
export function createScreenshotCapture(): ScreenshotCapture {
	const isSupported =
		typeof navigator !== "undefined" &&
		"mediaDevices" in navigator &&
		"getDisplayMedia" in navigator.mediaDevices &&
		!isMobileDevice();

	return {
		isSupported,
		async capture(): Promise<string | null> {
			if (!isSupported) return null;

			try {
				// Request screen capture
				let stream: MediaStream;
				try {
					stream = await navigator.mediaDevices.getDisplayMedia({
						video: { displaySurface: "browser" } as MediaTrackConstraints,
					});
				} catch {
					// Fallback to basic video capture
					stream = await navigator.mediaDevices.getDisplayMedia({
						video: true,
					});
				}

				// Create video element to capture frame
				const video = document.createElement("video");
				video.srcObject = stream;
				await video.play();

				// Draw frame to canvas
				const canvas = document.createElement("canvas");
				canvas.width = video.videoWidth;
				canvas.height = video.videoHeight;
				const ctx = canvas.getContext("2d");

				if (!ctx) {
					throw new Error("Failed to create canvas context");
				}

				ctx.drawImage(video, 0, 0);

				// Stop all tracks
				for (const track of stream.getTracks()) {
					track.stop();
				}

				// Convert to data URL
				return canvas.toDataURL("image/png");
			} catch (error) {
				// User cancelled or permission denied
				console.log("Screenshot capture cancelled or failed:", error);
				return null;
			}
		},
	};
}

/**
 * Build a GitHub issue URL for a bug report
 */
export function buildGitHubIssueUrl(
	repository: string,
	data: BugReportData,
	metadata?: Record<string, unknown>,
): string {
	const title = encodeURIComponent(data.title || "Bug Report");

	// Build body with description and metadata
	let body = data.description || "";

	if (data.includeMetadata !== false && metadata) {
		body += "\n\n---\n\n**Environment:**\n```json\n";
		body += JSON.stringify(metadata, null, 2);
		body += "\n```";
	}

	if (data.screenshot) {
		body += "\n\n**Screenshot:**\n";
		body += `![Screenshot](${data.screenshot})`;
	}

	const encodedBody = encodeURIComponent(body);
	return `https://github.com/${repository}/issues/new?title=${title}&body=${encodedBody}`;
}

/**
 * Open a bug report in a new GitHub issue
 */
export async function openBugReport(
	repository: string,
	data: BugReportData,
	deviceService: IDeviceService = DeviceService,
): Promise<void> {
	const metadata =
		data.includeMetadata !== false
			? { ...createEnvironmentMetadata(deviceService), ...data.metadata }
			: data.metadata;

	const url = buildGitHubIssueUrl(repository, data, metadata);

	if (typeof window !== "undefined") {
		window.open(url, "_blank");
	}
}

/**
 * Bug Reporter Service for managing bug report state and preferences
 */
export class BugReporterService {
	private config: Required<BugReportConfig>;
	private deviceService: IDeviceService;
	private screenshotCapture: ScreenshotCapture;
	private _shakeEnabled: boolean;

	constructor(
		config: BugReportConfig = {},
		deviceService: IDeviceService = DeviceService,
	) {
		this.config = {
			repository: config.repository ?? "",
			shakeEnabledKey: config.shakeEnabledKey ?? DEFAULT_SHAKE_ENABLED_KEY,
			labels: config.labels ?? ["bug"],
		};
		this.deviceService = deviceService;
		this.screenshotCapture = createScreenshotCapture();

		// Load shake preference from storage
		const stored = this.deviceService.getStorageItem(
			this.config.shakeEnabledKey,
		);
		this._shakeEnabled = stored === "true";
	}

	/** Get whether shake detection is enabled */
	get shakeEnabled(): boolean {
		return this._shakeEnabled;
	}

	/** Set shake detection preference */
	set shakeEnabled(value: boolean) {
		this._shakeEnabled = value;
		this.deviceService.setStorageItem(
			this.config.shakeEnabledKey,
			String(value),
		);
	}

	/** Check if screenshot capture is supported */
	get screenshotSupported(): boolean {
		return this.screenshotCapture.isSupported;
	}

	/** Check if running on mobile */
	get isMobile(): boolean {
		return isMobileDevice(this.deviceService);
	}

	/** Capture a screenshot */
	async captureScreenshot(): Promise<string | null> {
		return this.screenshotCapture.capture();
	}

	/** Get current environment metadata */
	getMetadata(): Record<string, unknown> {
		return createEnvironmentMetadata(this.deviceService);
	}

	/** Open a bug report on GitHub */
	async submitReport(data: BugReportData): Promise<void> {
		if (!this.config.repository) {
			throw new Error("No repository configured for bug reports");
		}
		await openBugReport(this.config.repository, data, this.deviceService);
	}

	/** Build a GitHub issue URL (for preview) */
	buildIssueUrl(data: BugReportData): string {
		if (!this.config.repository) {
			throw new Error("No repository configured for bug reports");
		}
		const metadata =
			data.includeMetadata !== false
				? { ...this.getMetadata(), ...data.metadata }
				: data.metadata;
		return buildGitHubIssueUrl(this.config.repository, data, metadata);
	}
}
