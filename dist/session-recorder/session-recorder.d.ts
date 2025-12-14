/**
 * SessionRecorder - Flight recorder for PWA debugging
 *
 * Records user interactions, console output, errors, and environment info.
 * Always active, stores in memory AND IndexedDB for crash recovery.
 */
import { type EnvironmentInfo, type InteractionEvent, type SessionRecorderConfig, type SessionRecording, type StateChangeEvent } from "./types";
export declare class SessionRecorder {
    private recording;
    private config;
    private autoSaveInterval;
    private memoryInterval;
    private clickHandler;
    private keydownHandler;
    private errorHandler;
    private rejectionHandler;
    private beforeUnloadHandler;
    private originalConsoleError;
    constructor(config?: SessionRecorderConfig);
    /**
     * Start recording (call this after construction)
     */
    start(): void;
    private createNewRecording;
    private captureEnvironment;
    private getWebGLInfo;
    private checkVideoCodecs;
    private setupEventListeners;
    private describeElement;
    private startAutoSave;
    private persistToStorage;
    private startMemoryTracking;
    private captureMemorySnapshot;
    /**
     * Record a user interaction
     */
    recordInteraction(event: InteractionEvent): void;
    /**
     * Record a state change event
     */
    recordStateChange(event: StateChangeEvent): void;
    /**
     * Set app settings for debugging
     */
    setAppSettings(settings: Record<string, unknown>): void;
    /**
     * Get current environment info
     */
    getEnvironment(): EnvironmentInfo;
    /**
     * Get the current recording
     */
    getRecording(): SessionRecording;
    /**
     * Get recording as downloadable blob
     */
    getRecordingAsBlob(): Blob;
    /**
     * Download the recording
     */
    downloadRecording(filename?: string): void;
    /**
     * Get recording stats
     */
    getStats(): {
        duration: number;
        interactions: number;
        stateChanges: number;
        memorySnapshots: number;
        errors: number;
    };
    /**
     * Get persisted sessions from IndexedDB
     */
    getPersistedSessions(): Promise<SessionRecording[]>;
    /**
     * Clear all persisted sessions
     */
    clearPersistedSessions(): Promise<void>;
    /**
     * Clear and start a new recording
     */
    reset(): void;
    /**
     * Cleanup - remove all event listeners and stop intervals
     */
    dispose(): void;
}
/**
 * Convenience function to record an app event
 */
export declare function createRecordAppEvent(recorder: SessionRecorder): (type: string, details?: Record<string, unknown>) => void;
//# sourceMappingURL=session-recorder.d.ts.map