import "fake-indexeddb/auto";

// Mock performance.memory (Chrome only API)
Object.defineProperty(performance, "memory", {
	value: {
		usedJSHeapSize: 50 * 1024 * 1024, // 50MB
		totalJSHeapSize: 100 * 1024 * 1024, // 100MB
		jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
	},
	writable: true,
});
