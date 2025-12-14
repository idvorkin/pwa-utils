/**
 * Sync Log Types
 *
 * Types for the synchronization debug log service.
 */

export type SyncLogEventType =
	| "syncState"
	| "webSocket"
	| "persistedState"
	| "syncComplete"
	| "staleAuth"
	| "error"
	| "custom";

export type SyncLogLevel = "info" | "success" | "warning" | "error";

export interface SyncLog {
	/** Unique identifier */
	id: string;
	/** When the log was created */
	timestamp: Date;
	/** Type of sync event */
	eventType: SyncLogEventType;
	/** Severity level */
	level: SyncLogLevel;
	/** Human-readable message */
	message: string;
	/** Additional data (JSON-serializable) */
	data?: unknown;
}

export interface SyncLogConfig {
	/** IndexedDB database name (default: 'pwa-sync-logs') */
	dbName?: string;
	/** Object store name (default: 'syncLogs') */
	storeName?: string;
	/** Maximum number of logs to retain (default: 2000) */
	maxLogs?: number;
}

export interface ISyncLogService {
	/** Add a new log entry */
	addLog(
		eventType: SyncLogEventType,
		level: SyncLogLevel,
		message: string,
		data?: unknown,
	): Promise<void>;
	/** Get all logs, newest first */
	getLogs(): Promise<SyncLog[]>;
	/** Get the total count of logs */
	getCount(): Promise<number>;
	/** Clear all logs */
	clearAll(): Promise<void>;
	/** Export logs as JSON string */
	exportLogs(): Promise<string>;
}
