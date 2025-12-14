/**
 * Tests for React utility functions
 */

import { describe, expect, it } from "vitest";
import { extractBrowser, formatDuration, formatRelativeTime } from "./utils.js";

describe("extractBrowser", () => {
	it("should detect Chrome", () => {
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
		expect(extractBrowser(ua)).toBe("Chrome");
	});

	it("should detect Firefox", () => {
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0";
		expect(extractBrowser(ua)).toBe("Firefox");
	});

	it("should detect Safari", () => {
		const ua =
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
		expect(extractBrowser(ua)).toBe("Safari");
	});

	it("should detect Edge (modern Chromium-based)", () => {
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
		expect(extractBrowser(ua)).toBe("Edge");
	});

	it("should detect Edge before Chrome (Edge UA contains Chrome)", () => {
		// Edge user agent contains both "Chrome" and "Edg" - should detect Edge
		const ua =
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
		expect(extractBrowser(ua)).toBe("Edge");
	});

	it("should return Unknown for unrecognized browsers", () => {
		const ua = "SomeRandomBot/1.0";
		expect(extractBrowser(ua)).toBe("Unknown");
	});

	it("should return Unknown for empty string", () => {
		expect(extractBrowser("")).toBe("Unknown");
	});

	it("should handle mobile Chrome", () => {
		const ua =
			"Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
		expect(extractBrowser(ua)).toBe("Chrome");
	});

	it("should handle mobile Safari", () => {
		const ua =
			"Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
		expect(extractBrowser(ua)).toBe("Safari");
	});
});

describe("formatDuration", () => {
	it("should format 0 milliseconds as 0s", () => {
		expect(formatDuration(0)).toBe("0s");
	});

	it("should format milliseconds less than a second", () => {
		expect(formatDuration(500)).toBe("1s"); // rounds to 1
		expect(formatDuration(100)).toBe("0s"); // rounds to 0
	});

	it("should format exact seconds", () => {
		expect(formatDuration(1000)).toBe("1s");
		expect(formatDuration(5000)).toBe("5s");
		expect(formatDuration(30000)).toBe("30s");
		expect(formatDuration(59000)).toBe("59s");
	});

	it("should format minutes and seconds", () => {
		expect(formatDuration(60000)).toBe("1m 0s");
		expect(formatDuration(90000)).toBe("1m 30s");
		expect(formatDuration(120000)).toBe("2m 0s");
		expect(formatDuration(125000)).toBe("2m 5s");
	});

	it("should format longer durations", () => {
		expect(formatDuration(300000)).toBe("5m 0s"); // 5 minutes
		expect(formatDuration(3600000)).toBe("60m 0s"); // 1 hour
		expect(formatDuration(3661000)).toBe("61m 1s"); // 1 hour 1 min 1 sec
	});

	it("should round milliseconds correctly", () => {
		expect(formatDuration(1499)).toBe("1s"); // rounds down
		expect(formatDuration(1500)).toBe("2s"); // rounds up
	});
});

describe("formatRelativeTime", () => {
	it("should return 'Never' for null", () => {
		expect(formatRelativeTime(null)).toBe("Never");
	});

	it("should return 'Just now' for very recent times", () => {
		const now = new Date();
		expect(formatRelativeTime(now)).toBe("Just now");

		const fiveSecondsAgo = new Date(now.getTime() - 5000);
		expect(formatRelativeTime(fiveSecondsAgo)).toBe("Just now");
	});

	it("should return seconds ago for times under a minute", () => {
		const now = new Date();
		const thirtySecondsAgo = new Date(now.getTime() - 30000);
		expect(formatRelativeTime(thirtySecondsAgo)).toBe("30s ago");

		const fiftyNineSecondsAgo = new Date(now.getTime() - 59000);
		expect(formatRelativeTime(fiftyNineSecondsAgo)).toBe("59s ago");
	});

	it("should return minutes ago for times under an hour", () => {
		const now = new Date();
		const oneMinuteAgo = new Date(now.getTime() - 60000);
		expect(formatRelativeTime(oneMinuteAgo)).toBe("1m ago");

		const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);
		expect(formatRelativeTime(thirtyMinutesAgo)).toBe("30m ago");

		const fiftyNineMinutesAgo = new Date(now.getTime() - 59 * 60000);
		expect(formatRelativeTime(fiftyNineMinutesAgo)).toBe("59m ago");
	});

	it("should return hours ago for times under a day", () => {
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60000);
		expect(formatRelativeTime(oneHourAgo)).toBe("1h ago");

		const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60000);
		expect(formatRelativeTime(twelveHoursAgo)).toBe("12h ago");

		const twentyThreeHoursAgo = new Date(now.getTime() - 23 * 60 * 60000);
		expect(formatRelativeTime(twentyThreeHoursAgo)).toBe("23h ago");
	});

	it("should return formatted date for times over a day", () => {
		const now = new Date();
		const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60000);
		const result = formatRelativeTime(twoDaysAgo);
		// Should be a date string, not relative time
		expect(result).not.toContain("ago");
		expect(result).not.toBe("Never");
	});
});
