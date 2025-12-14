/**
 * Sync Log Service
 *
 * A lightweight debug logging service for tracking sync operations.
 * Uses IndexedDB for persistence with automatic pruning of old logs.
 */
const DEFAULT_DB_NAME = "pwa-sync-logs";
const DEFAULT_STORE_NAME = "syncLogs";
const DEFAULT_MAX_LOGS = 2000;
const DB_VERSION = 1;
/**
 * Open the sync log database
 */
export async function openSyncLogDB(config) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(config.dbName, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(config.storeName)) {
                const store = db.createObjectStore(config.storeName, { keyPath: "id" });
                store.createIndex("timestamp", "timestamp", { unique: false });
                store.createIndex("eventType", "eventType", { unique: false });
                store.createIndex("level", "level", { unique: false });
            }
        };
    });
}
/**
 * Sync Log Service implementation
 */
export class SyncLogService {
    constructor(config = {}) {
        this.config = {
            dbName: config.dbName ?? DEFAULT_DB_NAME,
            storeName: config.storeName ?? DEFAULT_STORE_NAME,
            maxLogs: config.maxLogs ?? DEFAULT_MAX_LOGS,
        };
    }
    async addLog(eventType, level, message, data) {
        try {
            const log = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                eventType,
                level,
                message,
                data,
            };
            const db = await openSyncLogDB(this.config);
            try {
                await this.saveLog(db, log);
                await this.enforceLimit(db);
            }
            finally {
                db.close();
            }
        }
        catch (error) {
            // Check for QuotaExceededError - needs user attention
            if (error instanceof Error &&
                (error.name === "QuotaExceededError" || error.message.includes("quota"))) {
                console.error("CRITICAL: Storage quota exceeded while adding sync log.", error);
                throw new Error("Storage quota exceeded. Please clear old data or increase storage quota.");
            }
            // Other errors: log but don't throw - don't break the app for logging failures
            console.error("Failed to add sync log:", error);
        }
    }
    async getLogs() {
        const db = await openSyncLogDB(this.config);
        try {
            return new Promise((resolve, reject) => {
                const tx = db.transaction([this.config.storeName], "readonly");
                const store = tx.objectStore(this.config.storeName);
                const index = store.index("timestamp");
                const logs = [];
                // Iterate in reverse order (newest first)
                const request = index.openCursor(null, "prev");
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const cursor = request.result;
                    if (cursor) {
                        logs.push(cursor.value);
                        cursor.continue();
                    }
                    else {
                        resolve(logs);
                    }
                };
            });
        }
        finally {
            db.close();
        }
    }
    async getCount() {
        const db = await openSyncLogDB(this.config);
        try {
            return new Promise((resolve, reject) => {
                const tx = db.transaction([this.config.storeName], "readonly");
                const store = tx.objectStore(this.config.storeName);
                const request = store.count();
                request.onerror = () => reject(request.error);
                request.onsuccess = () => resolve(request.result);
            });
        }
        finally {
            db.close();
        }
    }
    async clearAll() {
        const db = await openSyncLogDB(this.config);
        try {
            return new Promise((resolve, reject) => {
                const tx = db.transaction([this.config.storeName], "readwrite");
                const store = tx.objectStore(this.config.storeName);
                const request = store.clear();
                request.onerror = () => reject(new Error(`Failed to clear sync logs: ${request.error}`));
                request.onsuccess = () => resolve();
            });
        }
        finally {
            db.close();
        }
    }
    async exportLogs() {
        const logs = await this.getLogs();
        return JSON.stringify(logs, null, 2);
    }
    async saveLog(db, log) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction([this.config.storeName], "readwrite");
            const store = tx.objectStore(this.config.storeName);
            const request = store.add(log);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
    /**
     * Enforce the maximum log limit by deleting oldest entries.
     * Uses a single transaction to avoid race conditions under concurrent writes.
     */
    async enforceLimit(db) {
        return new Promise((resolve, reject) => {
            // Use a single readwrite transaction for atomicity
            const tx = db.transaction([this.config.storeName], "readwrite");
            const store = tx.objectStore(this.config.storeName);
            // First, get the count
            const countRequest = store.count();
            countRequest.onerror = () => reject(countRequest.error);
            countRequest.onsuccess = () => {
                const count = countRequest.result;
                if (count <= this.config.maxLogs) {
                    resolve();
                    return;
                }
                const toDelete = count - this.config.maxLogs;
                const index = store.index("timestamp");
                const idsToDelete = [];
                // Get oldest entries within the same transaction
                const cursorRequest = index.openCursor(null, "next");
                cursorRequest.onerror = () => reject(cursorRequest.error);
                cursorRequest.onsuccess = () => {
                    const cursor = cursorRequest.result;
                    if (cursor && idsToDelete.length < toDelete) {
                        idsToDelete.push(cursor.value.id);
                        cursor.continue();
                    }
                    else if (idsToDelete.length > 0) {
                        // Delete all collected IDs within the same transaction
                        let deleted = 0;
                        for (const id of idsToDelete) {
                            const deleteRequest = store.delete(id);
                            deleteRequest.onerror = () => reject(deleteRequest.error);
                            deleteRequest.onsuccess = () => {
                                deleted++;
                                if (deleted === idsToDelete.length) {
                                    resolve();
                                }
                            };
                        }
                    }
                    else {
                        resolve();
                    }
                };
            };
        });
    }
}
/**
 * Create a mock sync log service for testing
 */
export function createMockSyncLogService() {
    const logs = [];
    return {
        logs,
        async addLog(eventType, level, message, data) {
            logs.push({
                id: crypto.randomUUID(),
                timestamp: new Date(),
                eventType,
                level,
                message,
                data,
            });
        },
        async getLogs() {
            return [...logs].reverse();
        },
        async getCount() {
            return logs.length;
        },
        async clearAll() {
            logs.length = 0;
        },
        async exportLogs() {
            return JSON.stringify([...logs].reverse(), null, 2);
        },
    };
}
//# sourceMappingURL=sync-log-service.js.map