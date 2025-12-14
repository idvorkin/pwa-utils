/**
 * Types for SessionRecorder
 */
export interface InteractionEvent {
    type: "click" | "keydown" | "keyup";
    timestamp: number;
    target: string;
    details?: Record<string, unknown>;
}
export interface StateChangeEvent {
    type: string;
    timestamp: number;
    details?: Record<string, unknown>;
}
export interface MemorySnapshot {
    timestamp: number;
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
    usedMB?: number;
    totalMB?: number;
    limitMB?: number;
    percentUsed?: number;
}
export interface EnvironmentInfo {
    buildVersion?: string;
    buildCommit?: string;
    buildTime?: string;
    userAgent: string;
    platform: string;
    language: string;
    cookiesEnabled: boolean;
    onLine: boolean;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    devicePixelRatio: number;
    colorDepth: number;
    hardwareConcurrency?: number;
    deviceMemory?: number;
    webglRenderer?: string;
    webglVendor?: string;
    webglVersion?: string;
    videoCodecs: {
        h264: boolean;
        h265: boolean;
        vp8: boolean;
        vp9: boolean;
        av1: boolean;
        webm: boolean;
    };
    appSettings?: Record<string, unknown>;
}
export interface SessionRecording {
    version: string;
    sessionId: string;
    startTime: number;
    endTime?: number;
    environment: EnvironmentInfo;
    interactions: InteractionEvent[];
    stateChanges: StateChangeEvent[];
    memorySnapshots: MemorySnapshot[];
}
export interface SessionRecorderConfig {
    /** Database name for IndexedDB storage */
    dbName?: string;
    /** Store name within the database */
    storeName?: string;
    /** Maximum number of sessions to keep */
    maxSessions?: number;
    /** Auto-save interval in milliseconds */
    autoSaveIntervalMs?: number;
    /** Memory tracking interval in milliseconds */
    memoryIntervalMs?: number;
    /** Maximum interactions per session */
    maxInteractions?: number;
    /** Maximum state changes per session */
    maxStateChanges?: number;
    /** Maximum memory snapshots per session */
    maxMemorySnapshots?: number;
    /** Build info to include in environment */
    buildInfo?: {
        version?: string;
        commit?: string;
        time?: string;
    };
    /** High memory warning threshold (percentage) */
    highMemoryThreshold?: number;
}
export declare const DEFAULT_CONFIG: Required<SessionRecorderConfig>;
//# sourceMappingURL=types.d.ts.map