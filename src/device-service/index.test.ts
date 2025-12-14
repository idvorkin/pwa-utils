import { afterEach, describe, expect, it } from "vitest";
import {
	DeviceService,
	type IDeviceService,
	createMockDeviceService,
} from "./index";

describe("DeviceService", () => {
	// Use unique keys per test to avoid interference
	const uniqueKey = () => `test-${Date.now()}-${Math.random()}`;

	describe("localStorage", () => {
		// Note: jsdom's localStorage is limited; use createMockDeviceService for testing
		// These tests verify the interface doesn't throw, not full functionality

		it("handles storage operations without throwing", () => {
			const key = uniqueKey();
			// Should not throw even if storage is unavailable
			expect(() =>
				DeviceService.setStorageItem(key, "test-value"),
			).not.toThrow();
			expect(() => DeviceService.removeStorageItem(key)).not.toThrow();
		});

		it("returns null for missing items", () => {
			expect(DeviceService.getStorageItem("nonexistent-key-xyz")).toBeNull();
		});
	});

	describe("sessionStorage", () => {
		it("stores and retrieves session items", () => {
			const key = uniqueKey();
			DeviceService.setSessionItem(key, "session-value");
			expect(DeviceService.getSessionItem(key)).toBe("session-value");
		});

		it("returns null for missing session items", () => {
			expect(DeviceService.getSessionItem("nonexistent-session")).toBeNull();
		});
	});

	describe("navigator info", () => {
		it("returns user agent", () => {
			const ua = DeviceService.getUserAgent();
			expect(typeof ua).toBe("string");
			expect(ua.length).toBeGreaterThan(0);
		});

		it("returns platform", () => {
			expect(typeof DeviceService.getPlatform()).toBe("string");
		});

		it("returns language", () => {
			expect(DeviceService.getLanguage()).toBeTruthy();
		});

		it("returns online status", () => {
			expect(typeof DeviceService.isOnline()).toBe("boolean");
		});
	});

	describe("screen info", () => {
		it("returns screen dimensions", () => {
			expect(typeof DeviceService.getScreenWidth()).toBe("number");
			expect(typeof DeviceService.getScreenHeight()).toBe("number");
		});

		it("returns window dimensions", () => {
			expect(typeof DeviceService.getWindowWidth()).toBe("number");
			expect(typeof DeviceService.getWindowHeight()).toBe("number");
		});

		it("returns device pixel ratio", () => {
			expect(typeof DeviceService.getDevicePixelRatio()).toBe("number");
		});
	});

	describe("time", () => {
		it("returns current timestamp", () => {
			const before = Date.now();
			const result = DeviceService.now();
			const after = Date.now();

			expect(result).toBeGreaterThanOrEqual(before);
			expect(result).toBeLessThanOrEqual(after);
		});
	});
});

describe("createMockDeviceService", () => {
	it("creates a mock with default values", () => {
		const mock = createMockDeviceService();

		expect(mock.getUserAgent()).toBe("test-user-agent");
		expect(mock.getPlatform()).toBe("test-platform");
		expect(mock.isOnline()).toBe(true);
	});

	it("supports storage operations", () => {
		const mock = createMockDeviceService();

		mock.setStorageItem("key", "value");
		expect(mock.getStorageItem("key")).toBe("value");

		mock.removeStorageItem("key");
		expect(mock.getStorageItem("key")).toBeNull();
	});

	it("allows overriding specific methods", () => {
		const mock = createMockDeviceService({
			isOnline: () => false,
			getUserAgent: () => "custom-agent",
		});

		expect(mock.isOnline()).toBe(false);
		expect(mock.getUserAgent()).toBe("custom-agent");
		// Other methods still have defaults
		expect(mock.getPlatform()).toBe("test-platform");
	});

	it("supports async clipboard operations", async () => {
		const mock = createMockDeviceService();

		expect(await mock.copyToClipboard("test")).toBe(true);
		expect(await mock.copyImageToClipboard("data:image/png;base64,test")).toBe(
			true,
		);
	});

	it("can mock failed clipboard operations", async () => {
		const mock = createMockDeviceService({
			copyToClipboard: async () => false,
		});

		expect(await mock.copyToClipboard("test")).toBe(false);
	});

	it("isolates storage between instances", () => {
		const mock1 = createMockDeviceService();
		const mock2 = createMockDeviceService();

		mock1.setStorageItem("key", "value1");
		mock2.setStorageItem("key", "value2");

		expect(mock1.getStorageItem("key")).toBe("value1");
		expect(mock2.getStorageItem("key")).toBe("value2");
	});
});

describe("DeviceService type safety", () => {
	it("mock implements IDeviceService interface", () => {
		const mock = createMockDeviceService();

		// This is a compile-time check - if types don't match, this would fail
		const service: IDeviceService = mock;
		expect(service).toBeDefined();
	});
});
