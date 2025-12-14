import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionRecorder, createRecordAppEvent } from "./session-recorder";

describe("SessionRecorder", () => {
	let recorder: SessionRecorder;

	beforeEach(() => {
		recorder = new SessionRecorder({
			dbName: "test-sessions",
			autoSaveIntervalMs: 100000, // Don't auto-save during tests
			memoryIntervalMs: 100000,
		});
	});

	afterEach(() => {
		recorder.dispose();
	});

	describe("initialization", () => {
		it("creates a new recording with session ID", () => {
			const recording = recorder.getRecording();

			expect(recording.sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
			expect(recording.version).toBe("1.0.0");
			expect(recording.startTime).toBeLessThanOrEqual(Date.now());
		});

		it("captures environment info", () => {
			const env = recorder.getEnvironment();

			expect(env.userAgent).toBeDefined();
			expect(env.platform).toBeDefined();
			expect(env.language).toBeDefined();
			expect(typeof env.onLine).toBe("boolean");
		});

		it("initializes empty arrays", () => {
			const recording = recorder.getRecording();

			expect(recording.interactions).toEqual([]);
			expect(recording.stateChanges).toEqual([]);
			expect(recording.memorySnapshots.length).toBeGreaterThanOrEqual(0);
		});
	});

	describe("recordInteraction", () => {
		it("records click events", () => {
			recorder.recordInteraction({
				type: "click",
				timestamp: Date.now(),
				target: "button#submit",
				details: { x: 100, y: 200 },
			});

			const recording = recorder.getRecording();
			expect(recording.interactions).toHaveLength(1);
			expect(recording.interactions[0].type).toBe("click");
			expect(recording.interactions[0].target).toBe("button#submit");
		});

		it("records keydown events", () => {
			recorder.recordInteraction({
				type: "keydown",
				timestamp: Date.now(),
				target: "input#search",
				details: { key: "Enter", ctrl: false },
			});

			const recording = recorder.getRecording();
			expect(recording.interactions).toHaveLength(1);
			expect(recording.interactions[0].type).toBe("keydown");
		});

		it("trims old interactions when exceeding limit", () => {
			const smallRecorder = new SessionRecorder({
				dbName: "test-sessions-small",
				maxInteractions: 3,
				autoSaveIntervalMs: 100000,
				memoryIntervalMs: 100000,
			});

			for (let i = 0; i < 5; i++) {
				smallRecorder.recordInteraction({
					type: "click",
					timestamp: Date.now(),
					target: `button-${i}`,
				});
			}

			const recording = smallRecorder.getRecording();
			expect(recording.interactions).toHaveLength(3);
			// Should keep the most recent
			expect(recording.interactions[0].target).toBe("button-2");
			expect(recording.interactions[2].target).toBe("button-4");

			smallRecorder.dispose();
		});
	});

	describe("recordStateChange", () => {
		it("records state changes", () => {
			recorder.recordStateChange({
				type: "video_load",
				timestamp: Date.now(),
				details: { duration: 120 },
			});

			const recording = recorder.getRecording();
			expect(recording.stateChanges).toHaveLength(1);
			expect(recording.stateChanges[0].type).toBe("video_load");
			expect(recording.stateChanges[0].details).toEqual({ duration: 120 });
		});

		it("records errors", () => {
			recorder.recordStateChange({
				type: "error",
				timestamp: Date.now(),
				details: { message: "Something went wrong" },
			});

			const stats = recorder.getStats();
			expect(stats.errors).toBe(1);
		});

		it("trims old state changes when exceeding limit", () => {
			const smallRecorder = new SessionRecorder({
				dbName: "test-sessions-small2",
				maxStateChanges: 2,
				autoSaveIntervalMs: 100000,
				memoryIntervalMs: 100000,
			});

			for (let i = 0; i < 4; i++) {
				smallRecorder.recordStateChange({
					type: `event-${i}`,
					timestamp: Date.now(),
				});
			}

			const recording = smallRecorder.getRecording();
			expect(recording.stateChanges).toHaveLength(2);
			expect(recording.stateChanges[0].type).toBe("event-2");

			smallRecorder.dispose();
		});
	});

	describe("getStats", () => {
		it("returns correct stats", () => {
			recorder.recordInteraction({
				type: "click",
				timestamp: Date.now(),
				target: "button",
			});
			recorder.recordInteraction({
				type: "click",
				timestamp: Date.now(),
				target: "link",
			});
			recorder.recordStateChange({
				type: "load",
				timestamp: Date.now(),
			});
			recorder.recordStateChange({
				type: "error",
				timestamp: Date.now(),
				details: { message: "fail" },
			});

			const stats = recorder.getStats();

			expect(stats.interactions).toBe(2);
			expect(stats.stateChanges).toBe(2);
			expect(stats.errors).toBe(1);
			expect(stats.duration).toBeGreaterThanOrEqual(0);
		});
	});

	describe("setAppSettings", () => {
		it("stores app settings in environment", () => {
			recorder.setAppSettings({ theme: "dark", version: "1.0.0" });

			const env = recorder.getEnvironment();
			expect(env.appSettings).toEqual({ theme: "dark", version: "1.0.0" });
		});
	});

	describe("getRecording", () => {
		it("includes endTime", () => {
			const recording = recorder.getRecording();

			expect(recording.endTime).toBeDefined();
			expect(recording.endTime).toBeGreaterThanOrEqual(recording.startTime);
		});
	});

	describe("getRecordingAsBlob", () => {
		it("returns a JSON blob", () => {
			const blob = recorder.getRecordingAsBlob();

			expect(blob.type).toBe("application/json");
			expect(blob.size).toBeGreaterThan(0);
		});
	});

	describe("reset", () => {
		it("clears all data and starts fresh", () => {
			recorder.recordInteraction({
				type: "click",
				timestamp: Date.now(),
				target: "button",
			});

			const oldSessionId = recorder.getRecording().sessionId;

			recorder.reset();

			const recording = recorder.getRecording();
			expect(recording.interactions).toHaveLength(0);
			expect(recording.sessionId).not.toBe(oldSessionId);
		});
	});

	describe("buildInfo", () => {
		it("includes build info in environment", () => {
			const recorderWithBuild = new SessionRecorder({
				dbName: "test-build",
				buildInfo: {
					version: "1.2.3",
					commit: "abc1234",
					time: "2024-01-01T00:00:00Z",
				},
				autoSaveIntervalMs: 100000,
				memoryIntervalMs: 100000,
			});

			const env = recorderWithBuild.getEnvironment();

			expect(env.buildVersion).toBe("1.2.3");
			expect(env.buildCommit).toBe("abc1234");
			expect(env.buildTime).toBe("2024-01-01T00:00:00Z");

			recorderWithBuild.dispose();
		});
	});
});

describe("createRecordAppEvent", () => {
	it("creates a convenience function for recording events", () => {
		const recorder = new SessionRecorder({
			dbName: "test-events",
			autoSaveIntervalMs: 100000,
			memoryIntervalMs: 100000,
		});
		const recordEvent = createRecordAppEvent(recorder);

		recordEvent("user_action", { action: "save" });
		recordEvent("navigation", { to: "/home" });

		const recording = recorder.getRecording();
		expect(recording.stateChanges).toHaveLength(2);
		expect(recording.stateChanges[0].type).toBe("user_action");
		expect(recording.stateChanges[1].type).toBe("navigation");

		recorder.dispose();
	});
});
