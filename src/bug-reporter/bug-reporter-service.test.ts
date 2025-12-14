import { describe, expect, it, vi } from "vitest";
import { createMockDeviceService } from "../device-service";
import {
	BugReporterService,
	buildGitHubIssueUrl,
	createEnvironmentMetadata,
	isMacPlatform,
	isMobileDevice,
} from "./bug-reporter-service";

describe("createEnvironmentMetadata", () => {
	it("collects environment info from device service", () => {
		const mockDevice = createMockDeviceService({
			getUserAgent: () => "Test-Agent",
			getPlatform: () => "TestOS",
			getLanguage: () => "en-US",
			getScreenWidth: () => 1920,
			getScreenHeight: () => 1080,
			getWindowWidth: () => 1280,
			getWindowHeight: () => 720,
			getDevicePixelRatio: () => 2,
			isOnline: () => true,
		});

		const metadata = createEnvironmentMetadata(mockDevice);

		expect(metadata.userAgent).toBe("Test-Agent");
		expect(metadata.platform).toBe("TestOS");
		expect(metadata.language).toBe("en-US");
		expect(metadata.screenWidth).toBe(1920);
		expect(metadata.screenHeight).toBe(1080);
		expect(metadata.windowWidth).toBe(1280);
		expect(metadata.windowHeight).toBe(720);
		expect(metadata.devicePixelRatio).toBe(2);
		expect(metadata.online).toBe(true);
		expect(metadata.timestamp).toBeDefined();
	});
});

describe("isMacPlatform", () => {
	it("returns true for Mac platforms", () => {
		const mockDevice = createMockDeviceService({
			getPlatform: () => "MacIntel",
		});

		expect(isMacPlatform(mockDevice)).toBe(true);
	});

	it("returns true for lowercase mac", () => {
		const mockDevice = createMockDeviceService({
			getPlatform: () => "macos",
		});

		expect(isMacPlatform(mockDevice)).toBe(true);
	});

	it("returns false for Windows", () => {
		const mockDevice = createMockDeviceService({
			getPlatform: () => "Win32",
		});

		expect(isMacPlatform(mockDevice)).toBe(false);
	});
});

describe("isMobileDevice", () => {
	it("returns true for iPhone", () => {
		const mockDevice = createMockDeviceService({
			getUserAgent: () =>
				"Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
		});

		expect(isMobileDevice(mockDevice)).toBe(true);
	});

	it("returns true for Android", () => {
		const mockDevice = createMockDeviceService({
			getUserAgent: () =>
				"Mozilla/5.0 (Linux; Android 10; SM-G960U) AppleWebKit/537.36",
		});

		expect(isMobileDevice(mockDevice)).toBe(true);
	});

	it("returns false for desktop", () => {
		const mockDevice = createMockDeviceService({
			getUserAgent: () =>
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
		});

		expect(isMobileDevice(mockDevice)).toBe(false);
	});
});

describe("buildGitHubIssueUrl", () => {
	it("builds URL with title and description", () => {
		const url = buildGitHubIssueUrl("owner/repo", {
			title: "Test Bug",
			description: "Bug description",
		});

		expect(url).toContain("https://github.com/owner/repo/issues/new");
		expect(url).toContain("title=Test%20Bug");
		expect(url).toContain("Bug%20description");
	});

	it("includes metadata when enabled", () => {
		const url = buildGitHubIssueUrl(
			"owner/repo",
			{
				title: "Bug",
				description: "Desc",
				includeMetadata: true,
			},
			{ platform: "TestOS" },
		);

		expect(url).toContain("Environment");
		expect(url).toContain("TestOS");
	});

	it("excludes metadata when disabled", () => {
		const url = buildGitHubIssueUrl(
			"owner/repo",
			{
				title: "Bug",
				description: "Desc",
				includeMetadata: false,
			},
			{ platform: "TestOS" },
		);

		expect(url).not.toContain("Environment");
	});

	it("uses default title when empty", () => {
		const url = buildGitHubIssueUrl("owner/repo", {
			title: "",
			description: "Desc",
		});

		expect(url).toContain("title=Bug%20Report");
	});
});

describe("BugReporterService", () => {
	it("initializes with default config", () => {
		const mockDevice = createMockDeviceService();
		const service = new BugReporterService({}, mockDevice);

		expect(service.shakeEnabled).toBe(false);
		expect(service.isMobile).toBe(false);
	});

	it("loads shake preference from storage", () => {
		const mockDevice = createMockDeviceService();
		mockDevice.setStorageItem("pwa-bug-reporter-shake-enabled", "true");

		const service = new BugReporterService({}, mockDevice);

		expect(service.shakeEnabled).toBe(true);
	});

	it("persists shake preference to storage", () => {
		const mockDevice = createMockDeviceService();
		const service = new BugReporterService({}, mockDevice);

		service.shakeEnabled = true;

		expect(mockDevice.getStorageItem("pwa-bug-reporter-shake-enabled")).toBe(
			"true",
		);
	});

	it("uses custom storage key", () => {
		const mockDevice = createMockDeviceService();
		mockDevice.setStorageItem("custom-shake-key", "true");

		const service = new BugReporterService(
			{ shakeEnabledKey: "custom-shake-key" },
			mockDevice,
		);

		expect(service.shakeEnabled).toBe(true);
	});

	it("getMetadata returns environment info", () => {
		const mockDevice = createMockDeviceService({
			getPlatform: () => "TestPlatform",
		});
		const service = new BugReporterService({}, mockDevice);

		const metadata = service.getMetadata();

		expect(metadata.platform).toBe("TestPlatform");
	});

	it("buildIssueUrl throws without repository", () => {
		const mockDevice = createMockDeviceService();
		const service = new BugReporterService({}, mockDevice);

		expect(() =>
			service.buildIssueUrl({ title: "Bug", description: "Desc" }),
		).toThrow("No repository configured");
	});

	it("buildIssueUrl works with repository", () => {
		const mockDevice = createMockDeviceService();
		const service = new BugReporterService(
			{ repository: "test/repo" },
			mockDevice,
		);

		const url = service.buildIssueUrl({ title: "Bug", description: "Desc" });

		expect(url).toContain("https://github.com/test/repo/issues/new");
	});

	it("submitReport throws without repository", async () => {
		const mockDevice = createMockDeviceService();
		const service = new BugReporterService({}, mockDevice);

		await expect(
			service.submitReport({ title: "Bug", description: "Desc" }),
		).rejects.toThrow("No repository configured");
	});

	it("detects mobile device", () => {
		const mockDevice = createMockDeviceService({
			getUserAgent: () => "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
		});
		const service = new BugReporterService({}, mockDevice);

		expect(service.isMobile).toBe(true);
	});
});
