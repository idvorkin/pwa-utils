import { beforeEach, describe, expect, it } from "vitest";
import {
	clearPersistedSessions,
	getPersistedSessions,
	openSessionDB,
	pruneOldSessions,
	saveSessionToDB,
} from "./db";
import type { SessionRecording } from "./types";

const TEST_CONFIG = {
	dbName: "test-db",
	storeName: "sessions",
	maxSessions: 3,
};

function createMockRecording(
	overrides: Partial<SessionRecording> = {},
): SessionRecording {
	return {
		version: "1.0.0",
		sessionId: `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		startTime: Date.now(),
		environment: {
			userAgent: "test",
			platform: "test",
			language: "en",
			cookiesEnabled: true,
			onLine: true,
			screenWidth: 1920,
			screenHeight: 1080,
			windowWidth: 1280,
			windowHeight: 720,
			devicePixelRatio: 1,
			colorDepth: 24,
			videoCodecs: {
				h264: true,
				h265: false,
				vp8: true,
				vp9: true,
				av1: false,
				webm: true,
			},
		},
		interactions: [],
		stateChanges: [],
		memorySnapshots: [],
		...overrides,
	};
}

describe("IndexedDB operations", () => {
	beforeEach(async () => {
		// Clear the test database before each test
		await clearPersistedSessions(TEST_CONFIG);
	});

	describe("openSessionDB", () => {
		it("opens a database connection", async () => {
			const db = await openSessionDB(TEST_CONFIG);

			expect(db).toBeDefined();
			expect(db.name).toBe(TEST_CONFIG.dbName);

			db.close();
		});

		it("creates the sessions store with startTime index", async () => {
			const db = await openSessionDB(TEST_CONFIG);

			expect(db.objectStoreNames.contains(TEST_CONFIG.storeName)).toBe(true);

			const tx = db.transaction([TEST_CONFIG.storeName], "readonly");
			const store = tx.objectStore(TEST_CONFIG.storeName);
			expect(store.indexNames.contains("startTime")).toBe(true);

			db.close();
		});
	});

	describe("saveSessionToDB", () => {
		it("saves a session recording", async () => {
			const recording = createMockRecording();

			await saveSessionToDB(TEST_CONFIG, recording);

			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toHaveLength(1);
			expect(sessions[0].sessionId).toBe(recording.sessionId);
		});

		it("updates existing session with same ID", async () => {
			const recording = createMockRecording();

			await saveSessionToDB(TEST_CONFIG, recording);

			// Update the recording
			recording.interactions.push({
				type: "click",
				timestamp: Date.now(),
				target: "button",
			});

			await saveSessionToDB(TEST_CONFIG, recording);

			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toHaveLength(1);
			expect(sessions[0].interactions).toHaveLength(1);
		});
	});

	describe("getPersistedSessions", () => {
		it("returns empty array when no sessions", async () => {
			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toEqual([]);
		});

		it("returns sessions newest first", async () => {
			const recording1 = createMockRecording({ startTime: 1000 });
			const recording2 = createMockRecording({ startTime: 2000 });
			const recording3 = createMockRecording({ startTime: 3000 });

			await saveSessionToDB(TEST_CONFIG, recording1);
			await saveSessionToDB(TEST_CONFIG, recording2);
			await saveSessionToDB(TEST_CONFIG, recording3);

			const sessions = await getPersistedSessions(TEST_CONFIG);

			expect(sessions).toHaveLength(3);
			expect(sessions[0].startTime).toBe(3000);
			expect(sessions[1].startTime).toBe(2000);
			expect(sessions[2].startTime).toBe(1000);
		});
	});

	describe("clearPersistedSessions", () => {
		it("removes all sessions", async () => {
			await saveSessionToDB(TEST_CONFIG, createMockRecording());
			await saveSessionToDB(TEST_CONFIG, createMockRecording());

			await clearPersistedSessions(TEST_CONFIG);

			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toHaveLength(0);
		});
	});

	describe("pruneOldSessions", () => {
		it("keeps only maxSessions most recent", async () => {
			const recordings = [];
			for (let i = 0; i < 5; i++) {
				const recording = createMockRecording({ startTime: i * 1000 });
				recordings.push(recording);
				await saveSessionToDB(TEST_CONFIG, recording);
			}

			await pruneOldSessions(TEST_CONFIG);

			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toHaveLength(TEST_CONFIG.maxSessions);

			// Should keep the newest 3
			expect(sessions[0].startTime).toBe(4000);
			expect(sessions[1].startTime).toBe(3000);
			expect(sessions[2].startTime).toBe(2000);
		});

		it("does nothing when under limit", async () => {
			await saveSessionToDB(TEST_CONFIG, createMockRecording({ startTime: 1 }));
			await saveSessionToDB(TEST_CONFIG, createMockRecording({ startTime: 2 }));

			await pruneOldSessions(TEST_CONFIG);

			const sessions = await getPersistedSessions(TEST_CONFIG);
			expect(sessions).toHaveLength(2);
		});
	});
});
