#!/bin/bash
# =============================================================================
# Generate Version Info
# =============================================================================
# Creates a TypeScript file with git commit info and build timestamp.
# Use with BugReporterService to include version info in bug reports.
#
# SETUP:
# 1. Copy this script to your project: scripts/generate-version.sh
# 2. Make it executable: chmod +x scripts/generate-version.sh
# 3. Add to package.json:
#      "scripts": {
#        "predev": "./scripts/generate-version.sh",
#        "prebuild": "./scripts/generate-version.sh"
#      }
# 4. Add to .gitignore:
#      **/generated_version.ts
#
# USAGE:
#   ./scripts/generate-version.sh              # outputs to src/generated_version.ts
#   ./scripts/generate-version.sh lib/ver.ts   # custom output path
#   ./scripts/generate-version.sh -            # outputs to stdout
#
# IN YOUR CODE:
#   import { VERSION_INFO } from "./generated_version";
#   import { BugReporterService } from "@anthropic/pwa-utils";
#
#   const bugReporter = new BugReporterService({
#     repository: "owner/repo",
#     versionInfo: VERSION_INFO,
#   });
#
# GENERATED EXPORTS:
#   - GIT_SHA: string          Full commit hash
#   - GIT_SHA_SHORT: string    Short hash (7 chars)
#   - GIT_COMMIT_URL: string   GitHub link to commit
#   - GIT_CURRENT_URL: string  GitHub link to branch
#   - GIT_BRANCH: string       Branch name
#   - BUILD_TIMESTAMP: string  ISO 8601 build time
#   - VERSION_INFO: object     All of the above as an object
#   - VersionInfo: type        TypeScript type for VERSION_INFO
# =============================================================================

set -e

OUTPUT_FILE="${1:-src/generated_version.ts}"

SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
REPO_URL=$(git remote get-url origin 2>/dev/null | sed 's/\.git$//' | sed 's|git@github.com:|https://github.com/|' || echo "")
COMMIT_URL="${REPO_URL:+$REPO_URL/commit/$SHA}"
CURRENT_URL="${REPO_URL:+$REPO_URL/tree/$BRANCH}"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

CONTENT="// Auto-generated at build time - DO NOT EDIT
export const GIT_SHA: string = \"$SHA\";
export const GIT_SHA_SHORT: string = \"${SHA:0:7}\";
export const GIT_COMMIT_URL: string = \"$COMMIT_URL\";
export const GIT_CURRENT_URL: string = \"$CURRENT_URL\";
export const GIT_BRANCH: string = \"$BRANCH\";
export const BUILD_TIMESTAMP: string = \"$BUILD_TIME\";

/** Version info object for programmatic access */
export const VERSION_INFO = {
  sha: GIT_SHA,
  shaShort: GIT_SHA_SHORT,
  commitUrl: GIT_COMMIT_URL,
  currentUrl: GIT_CURRENT_URL,
  branch: GIT_BRANCH,
  buildTimestamp: BUILD_TIMESTAMP,
} as const;

export type VersionInfo = typeof VERSION_INFO;
"

if [ "$OUTPUT_FILE" = "-" ]; then
  echo "$CONTENT"
else
  # Ensure directory exists
  mkdir -p "$(dirname "$OUTPUT_FILE")"
  echo "$CONTENT" > "$OUTPUT_FILE"
  echo "Generated $OUTPUT_FILE"
  echo "  SHA: ${SHA:0:7}"
  echo "  Branch: $BRANCH"
  echo "  Build time: $BUILD_TIME"
fi
