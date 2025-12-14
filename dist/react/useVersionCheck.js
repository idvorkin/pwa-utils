/**
 * React hook for checking PWA version updates
 */
import { useCallback, useEffect, useState } from "react";
/**
 * Hook for managing PWA version checks and updates
 *
 * @param versionChecker - The VersionCheckService instance to use
 * @returns Version check state and control functions
 *
 * @example
 * ```tsx
 * const versionChecker = new VersionCheckService({ checkIntervalMs: 30 * 60 * 1000 });
 *
 * function App() {
 *   const { updateAvailable, applyUpdate, dismissUpdate } = useVersionCheck(versionChecker);
 *
 *   if (updateAvailable) {
 *     return <UpdateBanner onUpdate={applyUpdate} onDismiss={dismissUpdate} />;
 *   }
 * }
 * ```
 */
export function useVersionCheck(versionChecker) {
    const [state, setState] = useState(() => {
        const s = versionChecker.getState();
        return {
            updateAvailable: s.updateAvailable,
            isChecking: s.isChecking,
            lastCheckTime: s.lastCheckTime,
        };
    });
    const [dismissed, setDismissed] = useState(false);
    useEffect(() => {
        const unsubscribe = versionChecker.onStateChange((s) => {
            setState({
                updateAvailable: s.updateAvailable,
                isChecking: s.isChecking,
                lastCheckTime: s.lastCheckTime,
            });
            // Reset dismissed when new update available
            if (s.updateAvailable) {
                setDismissed(false);
            }
        });
        // Check on mount
        versionChecker.checkForUpdate();
        return unsubscribe;
    }, [versionChecker]);
    const checkForUpdate = useCallback(async () => {
        await versionChecker.checkForUpdate();
    }, [versionChecker]);
    const applyUpdate = useCallback(() => {
        versionChecker.applyUpdate();
    }, [versionChecker]);
    const dismissUpdate = useCallback(() => {
        setDismissed(true);
    }, []);
    return {
        updateAvailable: state.updateAvailable && !dismissed,
        isChecking: state.isChecking,
        lastCheckTime: state.lastCheckTime,
        checkForUpdate,
        applyUpdate,
        dismissUpdate,
    };
}
//# sourceMappingURL=useVersionCheck.js.map