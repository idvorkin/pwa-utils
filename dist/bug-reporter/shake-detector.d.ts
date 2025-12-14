/**
 * Shake Detector Service
 *
 * Detects device shake gestures using DeviceMotion API.
 * Useful for triggering bug report dialogs on mobile devices.
 */
import type { IShakeDetector, ShakeDetectorConfig, ShakeDetectorState } from "./types";
export declare class ShakeDetector implements IShakeDetector {
    private state;
    private config;
    private lastShakeTimestamp;
    private shakeListeners;
    private stateListeners;
    private motionHandler;
    constructor(config?: ShakeDetectorConfig);
    getState(): ShakeDetectorState;
    requestPermission(): Promise<boolean>;
    setEnabled(enabled: boolean): void;
    onShake(callback: () => void): () => void;
    onStateChange(callback: (state: ShakeDetectorState) => void): () => void;
    dispose(): void;
    private startListening;
    private stopListening;
    private handleMotion;
    private updateState;
}
/**
 * Create a mock shake detector for testing
 */
export declare function createMockShakeDetector(config?: ShakeDetectorConfig): IShakeDetector & {
    simulateShake: () => void;
};
//# sourceMappingURL=shake-detector.d.ts.map