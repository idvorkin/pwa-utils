/**
 * Tests for useBugReporter hook and BugReporterProvider
 */

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BugReporterProvider, useBugReporter } from "./useBugReporter.js";

// Mock the pwa-utils modules
vi.mock("../bug-reporter/index.js", () => ({
	BugReporterService: vi.fn().mockImplementation(() => ({
		shakeEnabled: false,
		getMetadata: vi.fn(() => ({
			platform: "MacIntel",
			userAgent: "Mozilla/5.0 Chrome/120.0.0.0",
			screenWidth: 1920,
			screenHeight: 1080,
		})),
		getVersionInfo: vi.fn(() => ({
			sha: "abc1234567890",
			shaShort: "abc1234",
		})),
		submitReport: vi.fn(async () => {}),
	})),
	ShakeDetector: vi.fn().mockImplementation(() => ({
		getState: vi.fn(() => ({ isSupported: true, isEnabled: false })),
		setEnabled: vi.fn(),
		onShake: vi.fn(() => () => {}),
		onStateChange: vi.fn(() => () => {}),
		requestPermission: vi.fn(async () => true),
	})),
}));

vi.mock("../session-recorder/index.js", () => ({
	SessionRecorder: vi.fn().mockImplementation(() => ({
		start: vi.fn(),
		getStats: vi.fn(() => ({
			duration: 120000, // 2 minutes
			interactions: 42,
			errors: 0,
		})),
	})),
}));

describe("BugReporterProvider", () => {
	const defaultProps = {
		repository: "owner/repo",
		labels: ["bug"],
	};

	const wrapper = ({ children }: { children: ReactNode }) => (
		<BugReporterProvider {...defaultProps}>{children}</BugReporterProvider>
	);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("context value", () => {
		it("should provide all expected values", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current).toHaveProperty("shakeEnabled");
			expect(result.current).toHaveProperty("setShakeEnabled");
			expect(result.current).toHaveProperty("isShakeSupported");
			expect(result.current).toHaveProperty("requestShakePermission");
			expect(result.current).toHaveProperty("submitBugReport");
			expect(result.current).toHaveProperty("showDialog");
			expect(result.current).toHaveProperty("showBugDialog");
			expect(result.current).toHaveProperty("dismissBugDialog");
			expect(result.current).toHaveProperty("getMetadata");
		});

		it("should initialize with shake disabled", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current.shakeEnabled).toBe(false);
		});

		it("should report shake support from detector", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current.isShakeSupported).toBe(true);
		});

		it("should initialize with dialog hidden", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current.showBugDialog).toBe(false);
		});
	});

	describe("setShakeEnabled", () => {
		it("should update shakeEnabled state", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current.shakeEnabled).toBe(false);

			act(() => {
				result.current.setShakeEnabled(true);
			});

			expect(result.current.shakeEnabled).toBe(true);
		});
	});

	describe("dialog management", () => {
		it("should show dialog when showDialog called", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			expect(result.current.showBugDialog).toBe(false);

			act(() => {
				result.current.showDialog();
			});

			expect(result.current.showBugDialog).toBe(true);
		});

		it("should hide dialog when dismissBugDialog called", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			act(() => {
				result.current.showDialog();
			});
			expect(result.current.showBugDialog).toBe(true);

			act(() => {
				result.current.dismissBugDialog();
			});
			expect(result.current.showBugDialog).toBe(false);
		});
	});

	describe("getMetadata", () => {
		it("should return formatted metadata", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata).toHaveProperty("device");
			expect(metadata).toHaveProperty("screen");
			expect(metadata).toHaveProperty("browser");
			expect(metadata).toHaveProperty("version");
			expect(metadata).toHaveProperty("sessionDuration");
			expect(metadata).toHaveProperty("interactions");
			expect(metadata).toHaveProperty("errors");
		});

		it("should format screen dimensions", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata.screen).toBe("1920×1080");
		});

		it("should extract browser from user agent", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata.browser).toBe("Chrome");
		});

		it("should format session duration", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata.sessionDuration).toBe("2m 0s");
		});

		it("should include interaction count", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata.interactions).toBe(42);
		});

		it("should include version info", () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			const metadata = result.current.getMetadata();

			expect(metadata.version).toBe("abc1234");
		});
	});

	describe("submitBugReport", () => {
		it("should close dialog after submit", async () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			act(() => {
				result.current.showDialog();
			});
			expect(result.current.showBugDialog).toBe(true);

			await act(async () => {
				await result.current.submitBugReport("Test Title", "Test Description");
			});

			expect(result.current.showBugDialog).toBe(false);
		});
	});

	describe("requestShakePermission", () => {
		it("should return permission result", async () => {
			const { result } = renderHook(() => useBugReporter(), { wrapper });

			let granted: boolean | undefined;
			await act(async () => {
				granted = await result.current.requestShakePermission();
			});

			expect(granted).toBe(true);
		});
	});
});

describe("useBugReporter", () => {
	it("should throw when used outside provider", () => {
		// Suppress console.error for this test
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			renderHook(() => useBugReporter());
		}).toThrow("useBugReporter must be used within BugReporterProvider");

		consoleSpy.mockRestore();
	});
});
