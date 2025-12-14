/**
 * React hook for checking PWA version updates
 */
import type { VersionCheckService } from "../version-check/index.js";
import type { VersionCheckHookReturn } from "./types.js";
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
export declare function useVersionCheck(versionChecker: VersionCheckService): VersionCheckHookReturn;
//# sourceMappingURL=useVersionCheck.d.ts.map