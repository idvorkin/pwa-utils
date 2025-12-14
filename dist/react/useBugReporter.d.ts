/**
 * React context and hook for bug reporting with shake detection
 */
import type { BugReporterContextType, BugReporterProviderProps } from "./types.js";
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
export declare function BugReporterProvider({ children, repository, labels, versionInfo, buildInfo, }: BugReporterProviderProps): import("react/jsx-runtime").JSX.Element;
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
export declare function useBugReporter(): BugReporterContextType;
//# sourceMappingURL=useBugReporter.d.ts.map