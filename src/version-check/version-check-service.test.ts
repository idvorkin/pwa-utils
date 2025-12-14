import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockDeviceService } from "../device-service";
import type { ServiceWorkerAdapter } from "./types";
import {
	VersionCheckService,
	createMockServiceWorkerAdapter,
} from "./version-check-service";

describe("VersionCheckService", () => {
	let service: VersionCheckService;
	let mockDevice: ReturnType<typeof createMockDeviceService>;
	let mockSwAdapter: ServiceWorkerAdapter & { simulateUpdate?: () => void };

	beforeEach(() => {
		vi.useFakeTimers();
		mockDevice = createMockDeviceService();
		mockSwAdapter = createMockServiceWorkerAdapter() as ServiceWorkerAdapter & {
			simulateUpdate?: () => void;
		};
		service = new VersionCheckService({}, mockDevice, mockSwAdapter);
	});

	afterEach(() => {
		service.dispose();
		vi.useRealTimers();
	});

	describe("initialization", () => {
		it("initializes with default state", () => {
			const state = service.getState();

			expect(state.updateAvailable).toBe(false);
			expect(state.isChecking).toBe(false);
			expect(state.lastCheckTime).toBeNull();
			expect(state.serviceWorkerAvailable).toBe(false);
		});

		it("restores lastCheckTime from storage", () => {
			const storedDate = "2024-01-15T10:30:00.000Z";
			const mockDeviceWithStorage = createMockDeviceService();
			mockDeviceWithStorage.setStorageItem("pwa-last-update-check", storedDate);

			const serviceWithStorage = new VersionCheckService(
				{},
				mockDeviceWithStorage,
				mockSwAdapter,
			);

			const state = serviceWithStorage.getState();
			expect(state.lastCheckTime).toEqual(new Date(storedDate));

			serviceWithStorage.dispose();
		});

		it("uses custom storage key", () => {
			const storedDate = "2024-01-15T10:30:00.000Z";
			const mockDeviceWithStorage = createMockDeviceService();
			mockDeviceWithStorage.setStorageItem("custom-key", storedDate);

			const serviceWithCustomKey = new VersionCheckService(
				{ storageKey: "custom-key" },
				mockDeviceWithStorage,
				mockSwAdapter,
			);

			const state = serviceWithCustomKey.getState();
			expect(state.lastCheckTime).toEqual(new Date(storedDate));

			serviceWithCustomKey.dispose();
		});
	});

	describe("checkForUpdate", () => {
		it("updates lastCheckTime", async () => {
			expect(service.getState().lastCheckTime).toBeNull();

			await service.checkForUpdate();

			expect(service.getState().lastCheckTime).toBeInstanceOf(Date);
		});

		it("persists lastCheckTime to storage", async () => {
			await service.checkForUpdate();

			const stored = mockDevice.getStorageItem("pwa-last-update-check");
			expect(stored).toBeTruthy();
			if (stored) {
				expect(new Date(stored)).toBeInstanceOf(Date);
			}
		});

		it("sets isChecking during check", async () => {
			let checkingDuringCall = false;

			const unsubscribe = service.onStateChange((state) => {
				if (state.isChecking) {
					checkingDuringCall = true;
				}
			});

			await service.checkForUpdate();
			unsubscribe();

			expect(checkingDuringCall).toBe(true);
			expect(service.getState().isChecking).toBe(false);
		});

		it("resets isChecking after completion", async () => {
			await service.checkForUpdate();

			expect(service.getState().isChecking).toBe(false);
		});

		it("prevents concurrent checks", async () => {
			let updateCallCount = 0;
			const mockAdapterWithCounter = createMockServiceWorkerAdapter({
				async update() {
					updateCallCount++;
					await new Promise((resolve) => setTimeout(resolve, 100));
				},
			});

			const serviceWithCounter = new VersionCheckService(
				{ checkIntervalMs: 0 },
				mockDevice,
				mockAdapterWithCounter,
			);

			// Start two checks simultaneously
			const check1 = serviceWithCounter.checkForUpdate();
			const check2 = serviceWithCounter.checkForUpdate();

			await vi.advanceTimersByTimeAsync(200);
			await Promise.all([check1, check2]);

			// Should only have called update once
			expect(updateCallCount).toBe(1);

			serviceWithCounter.dispose();
		});
	});

	describe("state change notifications", () => {
		it("notifies listeners on state change", async () => {
			const stateChanges: Array<ReturnType<typeof service.getState>> = [];

			service.onStateChange((state) => {
				stateChanges.push(state);
			});

			await service.checkForUpdate();

			// Should have received at least 2 changes: isChecking=true, isChecking=false
			expect(stateChanges.length).toBeGreaterThanOrEqual(2);
		});

		it("unsubscribe stops notifications", async () => {
			const stateChanges: Array<ReturnType<typeof service.getState>> = [];

			const unsubscribe = service.onStateChange((state) => {
				stateChanges.push(state);
			});

			unsubscribe();
			await service.checkForUpdate();

			expect(stateChanges.length).toBe(0);
		});

		it("multiple listeners all receive notifications", async () => {
			let listener1Called = false;
			let listener2Called = false;

			service.onStateChange(() => {
				listener1Called = true;
			});
			service.onStateChange(() => {
				listener2Called = true;
			});

			await service.checkForUpdate();

			expect(listener1Called).toBe(true);
			expect(listener2Called).toBe(true);
		});
	});

	describe("update detection", () => {
		it("sets updateAvailable when adapter signals update", () => {
			expect(service.getState().updateAvailable).toBe(false);

			mockSwAdapter.simulateUpdate?.();

			expect(service.getState().updateAvailable).toBe(true);
		});

		it("notifies listeners when update becomes available", () => {
			let receivedUpdateAvailable = false;

			service.onStateChange((state) => {
				if (state.updateAvailable) {
					receivedUpdateAvailable = true;
				}
			});

			mockSwAdapter.simulateUpdate?.();

			expect(receivedUpdateAvailable).toBe(true);
		});
	});

	describe("applyUpdate", () => {
		it("calls skipWaiting on adapter", () => {
			let skipWaitingCalled = false;
			const mockAdapterWithSkip = createMockServiceWorkerAdapter({
				skipWaiting: () => {
					skipWaitingCalled = true;
				},
			});

			const serviceWithSkip = new VersionCheckService(
				{ checkIntervalMs: 0 },
				mockDevice,
				mockAdapterWithSkip,
			);

			serviceWithSkip.applyUpdate();

			expect(skipWaitingCalled).toBe(true);

			serviceWithSkip.dispose();
		});
	});

	describe("periodic checks", () => {
		it("schedules periodic update checks", async () => {
			let updateCallCount = 0;
			const mockAdapterWithCounter = createMockServiceWorkerAdapter({
				async update() {
					updateCallCount++;
				},
			});

			const serviceWithInterval = new VersionCheckService(
				{ checkIntervalMs: 1000 },
				mockDevice,
				mockAdapterWithCounter,
			);

			// No initial check
			expect(updateCallCount).toBe(0);

			// Advance by check interval
			await vi.advanceTimersByTimeAsync(1000);
			expect(updateCallCount).toBe(1);

			// Another interval
			await vi.advanceTimersByTimeAsync(1000);
			expect(updateCallCount).toBe(2);

			serviceWithInterval.dispose();
		});

		it("stops periodic checks after dispose", async () => {
			let updateCallCount = 0;
			const mockAdapterWithCounter = createMockServiceWorkerAdapter({
				async update() {
					updateCallCount++;
				},
			});

			const serviceWithInterval = new VersionCheckService(
				{ checkIntervalMs: 1000 },
				mockDevice,
				mockAdapterWithCounter,
			);

			await vi.advanceTimersByTimeAsync(1000);
			expect(updateCallCount).toBe(1);

			serviceWithInterval.dispose();

			await vi.advanceTimersByTimeAsync(5000);
			// Count should not increase after dispose
			expect(updateCallCount).toBe(1);
		});
	});

	describe("dispose", () => {
		it("clears all listeners", async () => {
			let listenerCalled = false;

			service.onStateChange(() => {
				listenerCalled = true;
			});

			service.dispose();

			// Re-create to trigger state change
			const newService = new VersionCheckService(
				{ checkIntervalMs: 0 },
				mockDevice,
				mockSwAdapter,
			);
			await newService.checkForUpdate();
			newService.dispose();

			expect(listenerCalled).toBe(false);
		});
	});
});

describe("createMockServiceWorkerAdapter", () => {
	it("creates adapter with default methods", async () => {
		const adapter = createMockServiceWorkerAdapter();

		expect(adapter.getRegistration()).toBeNull();
		expect(() => adapter.skipWaiting()).not.toThrow();
		await expect(adapter.update()).resolves.toBeUndefined();
	});

	it("allows overriding methods", () => {
		const mockRegistration = {} as ServiceWorkerRegistration;
		const adapter = createMockServiceWorkerAdapter({
			getRegistration: () => mockRegistration,
		});

		expect(adapter.getRegistration()).toBe(mockRegistration);
	});

	it("can simulate updates", () => {
		let updateReceived = false;
		const adapter = createMockServiceWorkerAdapter() as ServiceWorkerAdapter & {
			simulateUpdate: () => void;
		};

		adapter.onUpdateAvailable(() => {
			updateReceived = true;
		});

		adapter.simulateUpdate();

		expect(updateReceived).toBe(true);
	});
});
