/**
 * Shake Detector Service
 *
 * Detects device shake gestures using DeviceMotion API.
 * Useful for triggering bug report dialogs on mobile devices.
 */
const DEFAULT_THRESHOLD = 25; // m/s²
const DEFAULT_COOLDOWN_MS = 2000;
export class ShakeDetector {
    constructor(config = {}) {
        this.lastShakeTimestamp = 0;
        this.shakeListeners = new Set();
        this.stateListeners = new Set();
        this.motionHandler = null;
        this.config = {
            threshold: config.threshold ?? DEFAULT_THRESHOLD,
            cooldownMs: config.cooldownMs ?? DEFAULT_COOLDOWN_MS,
            enabled: config.enabled ?? false,
        };
        // Check if DeviceMotion is supported
        const isSupported = typeof window !== "undefined" && "DeviceMotionEvent" in window;
        // On Android and older iOS, permission is granted by default
        // Check if requestPermission exists (iOS 13+) - if not, permission is granted by default
        let hasDefaultPermission = false;
        if (isSupported) {
            const DeviceMotionEventTyped = DeviceMotionEvent;
            hasDefaultPermission =
                typeof DeviceMotionEventTyped?.requestPermission !== "function";
        }
        this.state = {
            isSupported,
            hasPermission: hasDefaultPermission,
            lastShakeTime: null,
        };
        // Start listening if enabled and has permission
        if (this.config.enabled && this.state.hasPermission) {
            this.startListening();
        }
    }
    getState() {
        return { ...this.state };
    }
    async requestPermission() {
        if (!this.state.isSupported)
            return false;
        // Ensure DeviceMotionEvent exists before accessing it
        if (typeof DeviceMotionEvent === "undefined")
            return false;
        const DeviceMotionEventTyped = DeviceMotionEvent;
        if (typeof DeviceMotionEventTyped?.requestPermission === "function") {
            try {
                const permission = await DeviceMotionEventTyped.requestPermission();
                const granted = permission === "granted";
                this.updateState({ hasPermission: granted });
                if (granted && this.config.enabled) {
                    this.startListening();
                }
                return granted;
            }
            catch (error) {
                console.error("Failed to request motion permission:", error);
                return false;
            }
        }
        // Permission not required (Android, older iOS)
        this.updateState({ hasPermission: true });
        return true;
    }
    setEnabled(enabled) {
        this.config.enabled = enabled;
        if (enabled && this.state.hasPermission) {
            this.startListening();
        }
        else {
            this.stopListening();
        }
    }
    onShake(callback) {
        this.shakeListeners.add(callback);
        return () => {
            this.shakeListeners.delete(callback);
        };
    }
    onStateChange(callback) {
        this.stateListeners.add(callback);
        return () => {
            this.stateListeners.delete(callback);
        };
    }
    dispose() {
        this.stopListening();
        this.shakeListeners.clear();
        this.stateListeners.clear();
    }
    startListening() {
        if (this.motionHandler || typeof window === "undefined")
            return;
        this.motionHandler = (event) => {
            this.handleMotion(event);
        };
        window.addEventListener("devicemotion", this.motionHandler);
    }
    stopListening() {
        if (this.motionHandler && typeof window !== "undefined") {
            window.removeEventListener("devicemotion", this.motionHandler);
            this.motionHandler = null;
        }
    }
    handleMotion(event) {
        // Prefer acceleration without gravity for cleaner readings
        const acceleration = event.accelerationIncludingGravity || event.acceleration;
        if (!acceleration)
            return;
        const { x, y, z } = acceleration;
        if (x === null || y === null || z === null)
            return;
        // Calculate magnitude of acceleration
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        // Check if magnitude exceeds threshold
        if (magnitude > this.config.threshold) {
            const now = Date.now();
            // Apply cooldown
            if (now - this.lastShakeTimestamp > this.config.cooldownMs) {
                this.lastShakeTimestamp = now;
                this.updateState({ lastShakeTime: now });
                // Notify shake listeners
                for (const callback of this.shakeListeners) {
                    try {
                        callback();
                    }
                    catch (error) {
                        console.error("Error in shake callback:", error);
                    }
                }
            }
        }
    }
    updateState(partial) {
        this.state = { ...this.state, ...partial };
        for (const listener of this.stateListeners) {
            try {
                listener(this.getState());
            }
            catch (error) {
                console.error("Error in state change listener:", error);
            }
        }
    }
}
/**
 * Create a mock shake detector for testing
 */
export function createMockShakeDetector(config = {}) {
    let state = {
        isSupported: true,
        hasPermission: true,
        lastShakeTime: null,
    };
    const shakeListeners = new Set();
    const stateListeners = new Set();
    let enabled = config.enabled ?? false;
    const updateState = (partial) => {
        state = { ...state, ...partial };
        for (const listener of stateListeners) {
            listener({ ...state });
        }
    };
    return {
        getState: () => ({ ...state }),
        requestPermission: async () => {
            updateState({ hasPermission: true });
            return true;
        },
        setEnabled: (value) => {
            enabled = value;
        },
        onShake: (callback) => {
            shakeListeners.add(callback);
            return () => shakeListeners.delete(callback);
        },
        onStateChange: (callback) => {
            stateListeners.add(callback);
            return () => stateListeners.delete(callback);
        },
        dispose: () => {
            shakeListeners.clear();
            stateListeners.clear();
        },
        simulateShake: () => {
            if (!enabled)
                return;
            const now = Date.now();
            updateState({ lastShakeTime: now });
            for (const callback of shakeListeners) {
                callback();
            }
        },
    };
}
//# sourceMappingURL=shake-detector.js.map