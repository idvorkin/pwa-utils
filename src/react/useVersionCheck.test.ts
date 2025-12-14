/**
 * Tests for useVersionCheck hook
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useVersionCheck } from "./useVersionCheck.js";

// Mock VersionCheckService
function createMockVersionChecker(initialState = {}) {
	const state = {
		updateAvailable: false,
		isChecking: false,
		lastCheckTime: null as Date | null,
		...initialState,
	};

	const listeners: Array<(state: typeof state) => void> = [];

	return {
		getState: vi.fn(() => ({ ...state })),
		onStateChange: vi.fn((callback: (state: typeof state) => void) => {
			listeners.push(callback);
			return () => {
				const index = listeners.indexOf(callback);
				if (index > -1) listeners.splice(index, 1);
			};
		}),
		checkForUpdate: vi.fn(async () => {
			state.isChecking = true;
			for (const l of listeners) l({ ...state });
			await Promise.resolve();
			state.isChecking = false;
			for (const l of listeners) l({ ...state });
		}),
		applyUpdate: vi.fn(() => {
			// Mock reload
		}),
		// Helper to simulate state changes in tests
		_setState: (newState: Partial<typeof state>) => {
			Object.assign(state, newState);
			for (const l of listeners) l({ ...state });
		},
	};
}

describe("useVersionCheck", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("initialization", () => {
		it("should initialize with state from service", async () => {
			const mockChecker = createMockVersionChecker({
				updateAvailable: false,
				isChecking: false,
				lastCheckTime: new Date("2024-01-01"),
			});

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			// Wait for initial checkForUpdate to complete
			await act(async () => {
				await Promise.resolve();
			});

			expect(result.current.updateAvailable).toBe(false);
			expect(result.current.isChecking).toBe(false);
			expect(result.current.lastCheckTime).toEqual(new Date("2024-01-01"));
		});

		it("should call checkForUpdate on mount", () => {
			const mockChecker = createMockVersionChecker();

			renderHook(() => useVersionCheck(mockChecker as never));

			expect(mockChecker.checkForUpdate).toHaveBeenCalledTimes(1);
		});

		it("should subscribe to state changes", () => {
			const mockChecker = createMockVersionChecker();

			renderHook(() => useVersionCheck(mockChecker as never));

			expect(mockChecker.onStateChange).toHaveBeenCalledTimes(1);
		});
	});

	describe("state updates", () => {
		it("should update when service reports update available", () => {
			const mockChecker = createMockVersionChecker();

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			expect(result.current.updateAvailable).toBe(false);

			act(() => {
				mockChecker._setState({ updateAvailable: true });
			});

			expect(result.current.updateAvailable).toBe(true);
		});

		it("should update isChecking during check", async () => {
			const mockChecker = createMockVersionChecker();

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			// Initial check on mount completes
			await act(async () => {
				await Promise.resolve();
			});

			expect(result.current.isChecking).toBe(false);
		});

		it("should update lastCheckTime", () => {
			const mockChecker = createMockVersionChecker();
			const newDate = new Date("2024-06-15");

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			act(() => {
				mockChecker._setState({ lastCheckTime: newDate });
			});

			expect(result.current.lastCheckTime).toEqual(newDate);
		});
	});

	describe("checkForUpdate", () => {
		it("should call service checkForUpdate", async () => {
			const mockChecker = createMockVersionChecker();

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			// Clear the initial call
			mockChecker.checkForUpdate.mockClear();

			await act(async () => {
				await result.current.checkForUpdate();
			});

			expect(mockChecker.checkForUpdate).toHaveBeenCalledTimes(1);
		});
	});

	describe("applyUpdate", () => {
		it("should call service applyUpdate", () => {
			const mockChecker = createMockVersionChecker();

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			act(() => {
				result.current.applyUpdate();
			});

			expect(mockChecker.applyUpdate).toHaveBeenCalledTimes(1);
		});
	});

	describe("dismissUpdate", () => {
		it("should hide update banner when dismissed", () => {
			const mockChecker = createMockVersionChecker({
				updateAvailable: true,
			});

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			expect(result.current.updateAvailable).toBe(true);

			act(() => {
				result.current.dismissUpdate();
			});

			expect(result.current.updateAvailable).toBe(false);
		});

		it("should reset dismissed state when new update available", () => {
			const mockChecker = createMockVersionChecker({
				updateAvailable: true,
			});

			const { result } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			// Dismiss the update
			act(() => {
				result.current.dismissUpdate();
			});
			expect(result.current.updateAvailable).toBe(false);

			// Simulate new update
			act(() => {
				mockChecker._setState({ updateAvailable: true });
			});

			expect(result.current.updateAvailable).toBe(true);
		});
	});

	describe("cleanup", () => {
		it("should unsubscribe on unmount", () => {
			const mockChecker = createMockVersionChecker();
			const unsubscribe = vi.fn();
			mockChecker.onStateChange.mockReturnValue(unsubscribe);

			const { unmount } = renderHook(() =>
				useVersionCheck(mockChecker as never),
			);

			unmount();

			expect(unsubscribe).toHaveBeenCalledTimes(1);
		});
	});
});
