/**
 * IndexedDB utilities for SessionRecorder
 */
/**
 * Open the session database
 */
export function openSessionDB(config) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(config.dbName, 1);
        request.onerror = () => {
            reject(new Error("Failed to open session database"));
        };
        request.onsuccess = () => {
            resolve(request.result);
        };
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(config.storeName)) {
                const store = db.createObjectStore(config.storeName, {
                    keyPath: "sessionId",
                });
                store.createIndex("startTime", "startTime", { unique: false });
            }
        };
    });
}
/**
 * Save a session to IndexedDB
 */
export async function saveSessionToDB(config, recording) {
    try {
        const db = await openSessionDB(config);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([config.storeName], "readwrite");
            transaction.onerror = () => {
                db.close();
                reject(new Error("Failed to save session"));
            };
            const store = transaction.objectStore(config.storeName);
            const request = store.put(recording);
            request.onerror = () => {
                reject(new Error("Failed to save session record"));
            };
            request.onsuccess = () => {
                resolve();
            };
            transaction.oncomplete = () => {
                db.close();
            };
        });
    }
    catch (e) {
        // Silently fail - don't break the app if IndexedDB fails
        console.warn("[SessionRecorder] Failed to persist session:", e);
    }
}
/**
 * Prune old sessions, keeping only the most recent N
 */
export async function pruneOldSessions(config) {
    try {
        const db = await openSessionDB(config);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([config.storeName], "readwrite");
            transaction.onerror = () => {
                db.close();
                reject(new Error("Failed to prune sessions"));
            };
            const store = transaction.objectStore(config.storeName);
            const index = store.index("startTime");
            const request = index.openCursor(null, "prev"); // Newest first
            let count = 0;
            const toDelete = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    count++;
                    if (count > config.maxSessions) {
                        toDelete.push(cursor.value.sessionId);
                    }
                    cursor.continue();
                }
                else {
                    // Done iterating, delete old sessions
                    for (const id of toDelete) {
                        store.delete(id);
                    }
                }
            };
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
        });
    }
    catch (e) {
        console.warn("[SessionRecorder] Failed to prune old sessions:", e);
    }
}
/**
 * Retrieve all persisted sessions from IndexedDB
 */
export async function getPersistedSessions(config) {
    try {
        const db = await openSessionDB(config);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([config.storeName], "readonly");
            transaction.onerror = () => {
                db.close();
                reject(new Error("Failed to load sessions"));
            };
            const store = transaction.objectStore(config.storeName);
            const index = store.index("startTime");
            const request = index.getAll();
            request.onerror = () => {
                reject(new Error("Failed to load session records"));
            };
            request.onsuccess = () => {
                // Return newest first
                const sessions = (request.result || []).reverse();
                resolve(sessions);
            };
            transaction.oncomplete = () => {
                db.close();
            };
        });
    }
    catch (e) {
        console.warn("[SessionRecorder] Failed to load persisted sessions:", e);
        return [];
    }
}
/**
 * Clear all persisted sessions from IndexedDB
 */
export async function clearPersistedSessions(config) {
    try {
        const db = await openSessionDB(config);
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([config.storeName], "readwrite");
            transaction.onerror = () => {
                db.close();
                reject(new Error("Failed to clear sessions"));
            };
            const store = transaction.objectStore(config.storeName);
            store.clear();
            transaction.oncomplete = () => {
                db.close();
                resolve();
            };
        });
    }
    catch (e) {
        console.warn("[SessionRecorder] Failed to clear sessions:", e);
    }
}
//# sourceMappingURL=db.js.map