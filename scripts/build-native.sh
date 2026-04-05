#!/bin/bash
# Build standalone bundle for orion-status
# Same approach as Claude Code: esbuild → single self-contained JS → install script

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
VERSION=$(node -e "console.log(require('$ROOT_DIR/package.json').version)")

echo "Building orion-status v${VERSION}..."

# Clean
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Bundle with esbuild into single JS file (zero dependencies)
echo "→ Bundling with esbuild..."
npx esbuild src/index.ts \
  --bundle \
  --platform=node \
  --target=node20 \
  --format=esm \
  --outfile="$BUILD_DIR/orion-status.mjs" \
  --minify \
  --banner:js="#!/usr/bin/env node"

chmod +x "$BUILD_DIR/orion-status.mjs"

# Generate manifest with checksum
echo "→ Generating manifest..."
CHECKSUM=$(shasum -a 256 "$BUILD_DIR/orion-status.mjs" | cut -d' ' -f1)
cat > "$BUILD_DIR/manifest.json" <<EOF
{
  "version": "${VERSION}",
  "files": {
    "orion-status.mjs": {
      "sha256": "${CHECKSUM}"
    }
  }
}
EOF

SIZE=$(ls -lh "$BUILD_DIR/orion-status.mjs" | awk '{print $5}')
echo ""
echo "✓ Built orion-status.mjs ($SIZE)"
echo "  SHA256: $CHECKSUM"
echo ""
echo "Install locally:"
echo "  cp build/orion-status.mjs ~/.local/bin/orion-status"
