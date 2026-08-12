#!/usr/bin/env bash
set -euo pipefail

# Frontend site deployment. Backend is deployed separately by deploy-backend.sh.

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

# GitHub Actions connects through a non-interactive SSH session, so .bashrc
# does not reliably load NVM for the CloudPanel site user.
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  set +u
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
  set -u
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Frontend deployment must run from the main branch." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Tracked local changes detected. Deployment stopped." >&2
  git status --short
  exit 1
fi

if [[ ! -f client/.env.production ]]; then
  echo "Missing required file: client/.env.production" >&2
  exit 1
fi

command -v node >/dev/null || { echo "node is required; install Node.js 22 for the frontend site user" >&2; exit 1; }
command -v pnpm >/dev/null || { echo "pnpm is required" >&2; exit 1; }
command -v pm2 >/dev/null || { echo "pm2 is required" >&2; exit 1; }

CLIENT_DIR="$REPO_ROOT/client"
PM2_APP_NAME="roomrent-client"

echo "Pulling frontend site..."
git pull --ff-only origin main

cd "$CLIENT_DIR"
pnpm install --frozen-lockfile
pnpm run build

if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 reload "$PM2_APP_NAME" --update-env
else
  pm2 start pnpm \
    --name "$PM2_APP_NAME" \
    --cwd "$CLIENT_DIR" \
    -- start
fi
pm2 save

wait_for_http() {
  local url="$1"
  local attempts=30

  for ((attempt = 1; attempt <= attempts; attempt++)); do
    if curl --fail --silent --show-error "$url" >/dev/null; then
      return 0
    fi
    sleep 2
  done

  echo "Health check failed: $url" >&2
  return 1
}

wait_for_http http://127.0.0.1:5000
echo "Frontend deployment completed successfully."
