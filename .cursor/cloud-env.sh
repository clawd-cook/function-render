#!/usr/bin/env bash
# Shared runtime setup for logic-render Cloud Agent shells.
#
# Sourced by interactive/agent shells (via ~/.bashrc) and by the environment
# terminals so that:
#   1. Node satisfies the pinned engines requirement (>=22.18.0).
#   2. The workspace-local Vite+ CLI (`vp`) is first on PATH, so `vp` and any
#      nested `vp` calls resolve to the pinned toolchain in node_modules rather
#      than a mismatched global install.

REPO_DIR="/workspace"
NODE_VERSION="22.22.2"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck disable=SC1090
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1

if [ -d "$NVM_DIR/versions/node/v$NODE_VERSION/bin" ]; then
  export PATH="$NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH"
fi

# Local Vite+ binary must win over any global `vp`.
export PATH="$REPO_DIR/node_modules/.bin:$PATH"

# pnpm is provided by corepack (12.5.1 per devEngines.packageManager).
corepack enable >/dev/null 2>&1 || true
