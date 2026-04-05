#!/bin/bash
# Install orion-status — Real-time Artemis II tracker
# Usage: curl -fsSL https://raw.githubusercontent.com/areporeporepo/orion-status/main/install.sh | bash

set -euo pipefail

REPO="areporeporepo/orion-status"
INSTALL_DIR="${HOME}/.local/bin"
BINARY="orion-status"

echo "Installing orion-status..."

# Check for Node.js
if ! command -v node &>/dev/null; then
  echo "Error: Node.js is required (v18+). Install from https://nodejs.org"
  exit 1
fi

# Get latest release tag
LATEST=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
if [ -z "$LATEST" ]; then
  echo "Error: Could not determine latest version"
  exit 1
fi

echo "→ Downloading ${LATEST}..."

DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${LATEST}/orion-status.mjs"
MANIFEST_URL="https://github.com/${REPO}/releases/download/${LATEST}/manifest.json"

mkdir -p "$INSTALL_DIR"
curl -fsSL "$DOWNLOAD_URL" -o "${INSTALL_DIR}/${BINARY}"
chmod +x "${INSTALL_DIR}/${BINARY}"

# Verify checksum
MANIFEST=$(curl -fsSL "$MANIFEST_URL" 2>/dev/null || true)
if [ -n "$MANIFEST" ]; then
  EXPECTED=$(echo "$MANIFEST" | python3 -c "import sys,json; print(json.load(sys.stdin)['files']['orion-status.mjs']['sha256'])" 2>/dev/null || true)
  if [ -n "$EXPECTED" ]; then
    ACTUAL=$(shasum -a 256 "${INSTALL_DIR}/${BINARY}" 2>/dev/null | cut -d' ' -f1 || sha256sum "${INSTALL_DIR}/${BINARY}" 2>/dev/null | cut -d' ' -f1)
    if [ "$EXPECTED" != "$ACTUAL" ]; then
      echo "Error: Checksum verification failed"
      rm -f "${INSTALL_DIR}/${BINARY}"
      exit 1
    fi
    echo "→ Checksum verified ✓"
  fi
fi

# Add to PATH if needed
if ! echo "$PATH" | grep -q "${INSTALL_DIR}"; then
  SHELL_RC=""
  case "${SHELL:-/bin/bash}" in
    */zsh)  SHELL_RC="$HOME/.zshrc" ;;
    */bash) SHELL_RC="$HOME/.bashrc" ;;
  esac
  if [ -n "$SHELL_RC" ] && ! grep -q '.local/bin' "$SHELL_RC" 2>/dev/null; then
    echo '' >> "$SHELL_RC"
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$SHELL_RC"
    echo "→ Added ~/.local/bin to PATH in $(basename "$SHELL_RC")"
  fi
fi

echo ""
echo "✓ orion-status ${LATEST} installed"
echo ""
echo "  Run: orion-status"
