/**
 * React integration types for pwa-utils
 */

export interface VersionCheckHookState {
	/** Whether an update is available */
	updateAvailable: boolean;
	/** Whether currently checking for updates */
	isChecking: boolean;
	/** Last time updates were checked */
	lastCheckTime: Date | null;
}

export interface VersionCheckHookReturn extends VersionCheckHookState {
	/** Manually check for updates */
	checkForUpdate: () => Promise<void>;
	/** Apply the update (reloads page) */
	applyUpdate: () => void;
	/** Dismiss the update notification */
	dismissUpdate: () => void;
}

export interface BugReportMetadata {
	device: string;
	screen: string;
	browser: string;
	version: string;
	sessionDuration: string;
	interactions: number;
	errors: number;
}

export interface BugReporterContextType {
	shakeEnabled: boolean;
	setShakeEnabled: (enabled: boolean) => void;
	isShakeSupported: boolean;
	requestShakePermission: () => Promise<boolean>;
	submitBugReport: (title?: string, description?: string) => Promise<void>;
	showDialog: () => void;
	showBugDialog: boolean;
	dismissBugDialog: () => void;
	getMetadata: () => BugReportMetadata;
}

export interface BugReporterProviderProps {
	children: React.ReactNode;
	/** GitHub repository in format "owner/repo" */
	repository: string;
	/** Labels to add to bug reports */
	labels?: string[];
	/** Version info for bug reports */
	versionInfo?: {
		sha: string;
		shaShort: string;
		commitUrl: string;
		currentUrl: string;
		branch: string;
		buildTimestamp: string;
	};
	/** Build info for session recorder */
	buildInfo?: {
		version: string;
		commit: string;
		time: string;
	};
}
