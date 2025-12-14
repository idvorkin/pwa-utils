#!/bin/bash
# Generate version info at build time
# Usage: ./scripts/generate-version.sh [output-file]
#
# Default output: src/generated_version.ts
# Can also output to stdout with: ./scripts/generate-version.sh -

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
