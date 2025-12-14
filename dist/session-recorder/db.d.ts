/**
 * IndexedDB utilities for SessionRecorder
 */
import type { SessionRecording } from "./types";
export interface SessionDB {
    dbName: string;
    storeName: string;
    maxSessions: number;
}
/**
 * Open the session database
 */
export declare function openSessionDB(config: SessionDB): Promise<IDBDatabase>;
/**
 * Save a session to IndexedDB
 */
export declare function saveSessionToDB(config: SessionDB, recording: SessionRecording): Promise<void>;
/**
 * Prune old sessions, keeping only the most recent N
 */
export declare function pruneOldSessions(config: SessionDB): Promise<void>;
/**
 * Retrieve all persisted sessions from IndexedDB
 */
export declare function getPersistedSessions(config: SessionDB): Promise<SessionRecording[]>;
/**
 * Clear all persisted sessions from IndexedDB
 */
export declare function clearPersistedSessions(config: SessionDB): Promise<void>;
//# sourceMappingURL=db.d.ts.map