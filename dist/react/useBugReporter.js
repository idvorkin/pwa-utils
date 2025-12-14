import { jsx as _jsx } from "react/jsx-runtime";
/**
 * React context and hook for bug reporting with shake detection
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from "react";
import { BugReporterService, ShakeDetector } from "../bug-reporter/index.js";
import { SessionRecorder } from "../session-recorder/index.js";
import { extractBrowser, formatDuration } from "./utils.js";
const BugReporterContext = createContext(null);
/**
 * Provider component for bug reporter functionality
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <BugReporterProvider
 *       repository="owner/repo"
 *       labels={["bug", "user-reported"]}
 *       versionInfo={versionInfo}
 *       buildInfo={buildInfo}
 *     >
 *       <MyApp />
 *     </BugReporterProvider>
 *   );
 * }
 * ```
 */
export function BugReporterProvider({ children, repository, labels = ["bug"], versionInfo, buildInfo, }) {
    // Initialize services
    const services = useMemo(() => {
        const sessionRecorder = new SessionRecorder({
            buildInfo: buildInfo || {
                version: versionInfo?.shaShort || "dev",
                commit: versionInfo?.sha || "unknown",
                time: versionInfo?.buildTimestamp || new Date().toISOString(),
            },
        });
        sessionRecorder.start();
        const bugReporter = new BugReporterService({
            repository,
            versionInfo,
            labels,
        });
        const shakeDetector = new ShakeDetector({
            threshold: 25,
            cooldownMs: 2000,
            enabled: bugReporter.shakeEnabled,
        });
        return { sessionRecorder, bugReporter, shakeDetector };
    }, [repository, labels, versionInfo, buildInfo]);
    const { sessionRecorder, bugReporter, shakeDetector } = services;
    // Cleanup services on unmount
    useEffect(() => {
        return () => {
            sessionRecorder.dispose();
            shakeDetector.dispose();
        };
    }, [sessionRecorder, shakeDetector]);
    const [shakeEnabled, setShakeEnabledState] = useState(bugReporter.shakeEnabled);
    const [showBugDialog, setShowBugDialog] = useState(false);
    const [shakeState, setShakeState] = useState(shakeDetector.getState());
    // Sync shake detector with bug reporter preference
    useEffect(() => {
        shakeDetector.setEnabled(shakeEnabled);
    }, [shakeEnabled, shakeDetector]);
    // Listen for shake events
    useEffect(() => {
        const unsubscribe = shakeDetector.onShake(() => {
            if (shakeEnabled) {
                setShowBugDialog(true);
            }
        });
        const unsubscribeState = shakeDetector.onStateChange(setShakeState);
        return () => {
            unsubscribe();
            unsubscribeState();
        };
    }, [shakeEnabled, shakeDetector]);
    const setShakeEnabled = useCallback((enabled) => {
        bugReporter.shakeEnabled = enabled;
        setShakeEnabledState(enabled);
    }, [bugReporter]);
    const requestShakePermission = useCallback(async () => {
        const granted = await shakeDetector.requestPermission();
        if (granted) {
            setShakeState(shakeDetector.getState());
        }
        return granted;
    }, [shakeDetector]);
    const submitBugReport = useCallback(async (title = "Bug Report", description = "") => {
        setShowBugDialog(false);
        const stats = sessionRecorder.getStats();
        const enhancedDescription = `${description}

---
**Session Info:**
- Duration: ${Math.round(stats.duration / 1000)}s
- Interactions: ${stats.interactions}
- Errors logged: ${stats.errors}`;
        await bugReporter.submitReport({
            title,
            description: enhancedDescription,
            includeMetadata: true,
        });
    }, [sessionRecorder, bugReporter]);
    const showDialog = useCallback(() => {
        setShowBugDialog(true);
    }, []);
    const dismissBugDialog = useCallback(() => {
        setShowBugDialog(false);
    }, []);
    const getMetadata = useCallback(() => {
        const meta = bugReporter.getMetadata();
        const stats = sessionRecorder.getStats();
        const info = bugReporter.getVersionInfo();
        return {
            device: String(meta.platform || "Unknown"),
            screen: `${meta.screenWidth}×${meta.screenHeight}`,
            browser: extractBrowser(String(meta.userAgent || "")),
            version: info?.shaShort || "dev",
            sessionDuration: formatDuration(stats.duration),
            interactions: stats.interactions,
            errors: stats.errors,
        };
    }, [bugReporter, sessionRecorder]);
    const value = useMemo(() => ({
        shakeEnabled,
        setShakeEnabled,
        isShakeSupported: shakeState.isSupported,
        requestShakePermission,
        submitBugReport,
        showDialog,
        showBugDialog,
        dismissBugDialog,
        getMetadata,
    }), [
        shakeEnabled,
        setShakeEnabled,
        shakeState.isSupported,
        requestShakePermission,
        submitBugReport,
        showDialog,
        showBugDialog,
        dismissBugDialog,
        getMetadata,
    ]);
    return (_jsx(BugReporterContext.Provider, { value: value, children: children }));
}
/**
 * Hook to access bug reporter functionality
 *
 * Must be used within a BugReporterProvider
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const { showDialog, shakeEnabled, setShakeEnabled } = useBugReporter();
 *
 *   return (
 *     <div>
 *       <button onClick={showDialog}>Report Bug</button>
 *       <label>
 *         <input
 *           type="checkbox"
 *           checked={shakeEnabled}
 *           onChange={(e) => setShakeEnabled(e.target.checked)}
 *         />
 *         Shake to report
 *       </label>
 *     </div>
 *   );
 * }
 * ```
 */
export function useBugReporter() {
    const context = useContext(BugReporterContext);
    if (!context) {
        throw new Error("useBugReporter must be used within BugReporterProvider");
    }
    return context;
}
//# sourceMappingURL=useBugReporter.js.map