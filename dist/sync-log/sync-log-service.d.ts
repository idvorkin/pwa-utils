/**
 * Sync Log Service
 *
 * A lightweight debug logging service for tracking sync operations.
 * Uses IndexedDB for persistence with automatic pruning of old logs.
 */
import type { ISyncLogService, SyncLog, SyncLogConfig, SyncLogEventType, SyncLogLevel } from "./types";
/**
 * Open the sync log database
 */
export declare function openSyncLogDB(config: Required<SyncLogConfig>): Promise<IDBDatabase>;
/**
 * Sync Log Service implementation
 */
export declare class SyncLogService implements ISyncLogService {
    private config;
    constructor(config?: SyncLogConfig);
    addLog(eventType: SyncLogEventType, level: SyncLogLevel, message: string, data?: unknown): Promise<void>;
    getLogs(): Promise<SyncLog[]>;
    getCount(): Promise<number>;
    clearAll(): Promise<void>;
    exportLogs(): Promise<string>;
    private saveLog;
    /**
     * Enforce the maximum log limit by deleting oldest entries.
     * Uses a single transaction to avoid race conditions under concurrent writes.
     */
    private enforceLimit;
}
/**
 * Create a mock sync log service for testing
 */
export declare function createMockSyncLogService(): ISyncLogService & {
    logs: SyncLog[];
};
//# sourceMappingURL=sync-log-service.d.ts.map