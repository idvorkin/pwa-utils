import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { SyncLogService, createMockSyncLogService } from "./sync-log-service";

const TEST_CONFIG = {
	dbName: "test-sync-logs",
	storeName: "syncLogs",
	maxLogs: 10,
};

describe("SyncLogService", () => {
	let service: SyncLogService;

	beforeEach(async () => {
		service = new SyncLogService(TEST_CONFIG);
		await service.clearAll();
	});

	afterEach(async () => {
		await service.clearAll();
	});

	describe("addLog", () => {
		it("adds a log entry", async () => {
			await service.addLog("syncState", "info", "Test message");

			const logs = await service.getLogs();
			expect(logs).toHaveLength(1);
			expect(logs[0].eventType).toBe("syncState");
			expect(logs[0].level).toBe("info");
			expect(logs[0].message).toBe("Test message");
			expect(logs[0].id).toBeDefined();
			expect(logs[0].timestamp).toBeInstanceOf(Date);
		});

		it("adds a log entry with data", async () => {
			const testData = { foo: "bar", count: 42 };
			await service.addLog("webSocket", "success", "Connected", testData);

			const logs = await service.getLogs();
			expect(logs).toHaveLength(1);
			expect(logs[0].data).toEqual(testData);
		});

		it("handles different event types", async () => {
			await service.addLog("syncState", "info", "Sync state");
			await service.addLog("webSocket", "success", "WebSocket");
			await service.addLog("persistedState", "warning", "Persisted");
			await service.addLog("syncComplete", "success", "Complete");

			const logs = await service.getLogs();
			expect(logs).toHaveLength(4);
			const eventTypes = logs.map((l) => l.eventType).sort();
			expect(eventTypes).toEqual([
				"persistedState",
				"syncComplete",
				"syncState",
				"webSocket",
			]);
		});

		it("handles different log levels", async () => {
			await service.addLog("syncState", "info", "Info");
			await service.addLog("syncState", "success", "Success");
			await service.addLog("syncState", "warning", "Warning");
			await service.addLog("syncState", "error", "Error");

			const logs = await service.getLogs();
			expect(logs).toHaveLength(4);
			const levels = logs.map((l) => l.level).sort();
			expect(levels).toEqual(["error", "info", "success", "warning"]);
		});
	});

	describe("getLogs", () => {
		it("returns empty array when no logs exist", async () => {
			const logs = await service.getLogs();
			expect(logs).toEqual([]);
		});

		it("returns logs in reverse chronological order (newest first)", async () => {
			await service.addLog("syncState", "info", "First");
			await new Promise((resolve) => setTimeout(resolve, 10));
			await service.addLog("syncState", "info", "Second");
			await new Promise((resolve) => setTimeout(resolve, 10));
			await service.addLog("syncState", "info", "Third");

			const logs = await service.getLogs();

			expect(logs).toHaveLength(3);
			expect(logs[0].message).toBe("Third");
			expect(logs[1].message).toBe("Second");
			expect(logs[2].message).toBe("First");
		});
	});

	describe("getCount", () => {
		it("returns 0 when no logs exist", async () => {
			const count = await service.getCount();
			expect(count).toBe(0);
		});

		it("returns correct count of logs", async () => {
			await service.addLog("syncState", "info", "Log 1");
			await service.addLog("syncState", "info", "Log 2");
			await service.addLog("syncState", "info", "Log 3");

			const count = await service.getCount();
			expect(count).toBe(3);
		});
	});

	describe("clearAll", () => {
		it("removes all logs from database", async () => {
			await service.addLog("syncState", "info", "Log 1");
			await service.addLog("syncState", "info", "Log 2");

			await service.clearAll();

			const logs = await service.getLogs();
			expect(logs).toHaveLength(0);
		});

		it("works when database is already empty", async () => {
			await service.clearAll();

			const logs = await service.getLogs();
			expect(logs).toHaveLength(0);
		});
	});

	describe("enforceLimit", () => {
		it("keeps logs under maxLogs limit", async () => {
			// Add 15 logs (maxLogs is 10)
			for (let i = 0; i < 15; i++) {
				await service.addLog("syncState", "info", `Log ${i}`);
			}

			const count = await service.getCount();
			expect(count).toBe(TEST_CONFIG.maxLogs);
		});

		it("removes oldest logs when limit exceeded", async () => {
			// Add 15 logs
			for (let i = 0; i < 15; i++) {
				await service.addLog("syncState", "info", `Log ${i}`);
			}

			const count = await service.getCount();
			expect(count).toBe(TEST_CONFIG.maxLogs);

			// Verify we have the recent logs
			const logs = await service.getLogs();
			expect(logs).toHaveLength(TEST_CONFIG.maxLogs);

			// Verify recent logs exist (should have Log 5-14, not Log 0-4)
			const hasRecentLogs = logs.some((l) =>
				l.message.match(/Log (1[0-4]|[5-9])/),
			);
			expect(hasRecentLogs).toBe(true);
		});
	});

	describe("exportLogs", () => {
		it("exports empty array when no logs exist", async () => {
			const json = await service.exportLogs();
			expect(json).toBe("[]");
		});

		it("exports logs as formatted JSON string", async () => {
			await service.addLog("syncState", "info", "Test log");

			const json = await service.exportLogs();
			const parsed = JSON.parse(json);

			expect(Array.isArray(parsed)).toBe(true);
			expect(parsed).toHaveLength(1);
			expect(parsed[0].message).toBe("Test log");
		});

		it("exports logs in reverse chronological order", async () => {
			await service.addLog("syncState", "info", "First");
			await new Promise((resolve) => setTimeout(resolve, 10));
			await service.addLog("syncState", "info", "Second");

			const json = await service.exportLogs();
			const parsed = JSON.parse(json);

			expect(parsed).toHaveLength(2);
			expect(parsed[0].message).toBe("Second");
			expect(parsed[1].message).toBe("First");
		});

		it("includes all log fields in export", async () => {
			const testData = { phase: "pushing", progress: 50 };
			await service.addLog("syncState", "warning", "Test message", testData);

			const json = await service.exportLogs();
			const parsed = JSON.parse(json);

			expect(parsed[0]).toMatchObject({
				eventType: "syncState",
				level: "warning",
				message: "Test message",
				data: testData,
			});
			expect(parsed[0].id).toBeDefined();
			expect(parsed[0].timestamp).toBeDefined();
		});
	});

	describe("integration scenarios", () => {
		it("handles rapid log additions", async () => {
			const promises = [];
			for (let i = 0; i < 20; i++) {
				promises.push(service.addLog("syncState", "info", `Event ${i}`));
			}
			await Promise.all(promises);

			const count = await service.getCount();
			// Should have pruned to maxLogs
			expect(count).toBeLessThanOrEqual(TEST_CONFIG.maxLogs);
		});

		it("maintains data integrity across operations", async () => {
			await service.addLog("syncState", "info", "Log 1");
			await service.addLog("webSocket", "success", "Log 2");

			expect(await service.getCount()).toBe(2);

			const json = await service.exportLogs();
			expect(JSON.parse(json)).toHaveLength(2);

			await service.clearAll();
			expect(await service.getCount()).toBe(0);

			await service.addLog("syncState", "info", "Log 3");
			expect(await service.getCount()).toBe(1);
		});
	});
});

describe("createMockSyncLogService", () => {
	it("creates a mock service", async () => {
		const mock = createMockSyncLogService();

		await mock.addLog("syncState", "info", "Test");

		expect(mock.logs).toHaveLength(1);
		expect(await mock.getCount()).toBe(1);
	});

	it("getLogs returns newest first", async () => {
		const mock = createMockSyncLogService();

		await mock.addLog("syncState", "info", "First");
		await mock.addLog("syncState", "info", "Second");

		const logs = await mock.getLogs();
		expect(logs[0].message).toBe("Second");
		expect(logs[1].message).toBe("First");
	});

	it("clearAll removes all logs", async () => {
		const mock = createMockSyncLogService();

		await mock.addLog("syncState", "info", "Test");
		await mock.clearAll();

		expect(mock.logs).toHaveLength(0);
		expect(await mock.getCount()).toBe(0);
	});

	it("exportLogs returns JSON", async () => {
		const mock = createMockSyncLogService();

		await mock.addLog("syncState", "info", "Test");

		const json = await mock.exportLogs();
		const parsed = JSON.parse(json);

		expect(parsed).toHaveLength(1);
		expect(parsed[0].message).toBe("Test");
	});
});
