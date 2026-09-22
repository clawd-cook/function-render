#!/usr/bin/env bash
# Idempotent install for the logic-render Vite+ monorepo in a Cloud Agent.
set -euo pipefail

REPO_DIR="/workspace"
NODE_VERSION="22.22.2"
cd "$REPO_DIR"

# --- Node (satisfies engines: node >=22.18.0) -------------------------------
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm install "$NODE_VERSION" >/dev/null 2>&1 || true
nvm use "$NODE_VERSION" >/dev/null
export PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"
echo "Using node $(node -v)"

# --- pnpm via corepack (12.5.1 per devEngines.packageManager) ---------------
corepack enable
corepack prepare pnpm@12.5.1 --activate
echo "Using pnpm $(corepack pnpm -v)"

# --- Workspace dependencies (frozen to the committed lockfile) --------------
corepack pnpm install --frozen-lockfile

# --- Build library packages -------------------------------------------------
# core/runner/catalog expose their built `dist/` via package exports, so they
# must be packed before cross-package imports (node-service, apps, tests)
# resolve. Uses the workspace-local Vite+.
corepack pnpm exec vp run -r build

# --- Make runtime setup available to interactive/agent shells ---------------
SETUP_LINE="source $REPO_DIR/.cursor/cloud-env.sh"
touch "$HOME/.bashrc"
if ! grep -qF "$SETUP_LINE" "$HOME/.bashrc"; then
  printf '\n# logic-render Cloud Agent runtime setup\n%s\n' "$SETUP_LINE" >> "$HOME/.bashrc"
fi

echo "install complete"
