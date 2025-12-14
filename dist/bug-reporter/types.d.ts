/**
 * Bug Reporter Types
 */
/**
 * Version information generated at build time
 * Use scripts/generate-version.sh to create generated_version.ts
 */
export interface VersionInfo {
    /** Full git SHA */
    sha: string;
    /** Short git SHA (7 chars) */
    shaShort: string;
    /** URL to the commit on GitHub */
    commitUrl: string;
    /** URL to the current branch on GitHub */
    currentUrl: string;
    /** Git branch name */
    branch: string;
    /** Build timestamp in ISO format */
    buildTimestamp: string;
}
export interface ShakeDetectorConfig {
    /** Threshold in m/s² to trigger shake detection (default: 25) */
    threshold?: number;
    /** Cooldown in ms between shake detections (default: 2000) */
    cooldownMs?: number;
    /** Whether shake detection is enabled (default: false) */
    enabled?: boolean;
}
export interface ShakeDetectorState {
    /** Whether the device supports motion detection */
    isSupported: boolean;
    /** Whether we have permission to use motion detection */
    hasPermission: boolean;
    /** Last detected shake timestamp */
    lastShakeTime: number | null;
}
export interface IShakeDetector {
    /** Get current state */
    getState(): ShakeDetectorState;
    /** Request permission for motion detection (required on iOS 13+) */
    requestPermission(): Promise<boolean>;
    /** Enable or disable shake detection */
    setEnabled(enabled: boolean): void;
    /** Register callback for shake events */
    onShake(callback: () => void): () => void;
    /** Register callback for state changes */
    onStateChange(callback: (state: ShakeDetectorState) => void): () => void;
    /** Dispose of the detector and clean up listeners */
    dispose(): void;
}
export interface BugReportConfig {
    /** GitHub repository in format "owner/repo" */
    repository?: string;
    /** Storage key for shake enabled preference */
    shakeEnabledKey?: string;
    /** Labels to add to bug reports */
    labels?: string[];
    /** Version info to include in all bug reports */
    versionInfo?: VersionInfo;
}
export interface BugReportData {
    /** Bug report title */
    title: string;
    /** Bug report description */
    description: string;
    /** Whether to include system metadata */
    includeMetadata?: boolean;
    /** Screenshot data URL (optional) */
    screenshot?: string;
    /** Additional metadata to include */
    metadata?: Record<string, unknown>;
}
export interface ScreenshotCapture {
    /** Whether screenshot capture is supported */
    isSupported: boolean;
    /** Capture a screenshot of the current page */
    capture(): Promise<string | null>;
}
//# sourceMappingURL=types.d.ts.map