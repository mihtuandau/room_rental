#!/usr/bin/env bash
set -euo pipefail

# Deploy one exact repository commit. The caller must checkout the commit before
# invoking this script; the script deliberately never pulls the moving main ref.

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  set +u
  # shellcheck source=/dev/null
  source "$NVM_DIR/nvm.sh"
  set -u
fi

DEPLOY_ENV="${1:-production}"
RELEASE_SHA="${2:-${ROOMRENT_RELEASE_SHA:-}}"

if [[ "$DEPLOY_ENV" != "production" && "$DEPLOY_ENV" != "staging" ]]; then
  echo "Usage: $0 <production|staging> <40-character commit SHA>" >&2
  exit 2
fi

if [[ ! "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "A full 40-character release commit SHA is required." >&2
  exit 2
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CURRENT_SHA="$(git rev-parse HEAD)"
if [[ "$CURRENT_SHA" != "$RELEASE_SHA" ]]; then
  echo "Checked out commit $CURRENT_SHA does not match release $RELEASE_SHA." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Tracked local changes detected. Deployment stopped." >&2
  git status --short
  exit 1
fi

ENV_FILE="client/.env.${DEPLOY_ENV}"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing required file: $ENV_FILE" >&2
  exit 1
fi

command -v node >/dev/null || {
  echo "node is required; install Node.js 22 for the frontend site user" >&2
  exit 1
}
command -v pnpm >/dev/null || { echo "pnpm is required" >&2; exit 1; }
command -v pm2 >/dev/null || { echo "pm2 is required" >&2; exit 1; }

CLIENT_DIR="$REPO_ROOT/client"
PM2_APP_NAME="roomrent-client"
if [[ "$DEPLOY_ENV" == "staging" ]]; then
  PM2_APP_NAME="roomrent-client-staging"
fi

echo "Installing frontend dependencies for $DEPLOY_ENV/$RELEASE_SHA..."
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

FRONTEND_PORT="${ROOMRENT_FRONTEND_PORT:-5000}"
wait_for_http "http://127.0.0.1:${FRONTEND_PORT}"

printf '%s\n' "$RELEASE_SHA" > "$REPO_ROOT/.roomrent-${DEPLOY_ENV}-frontend-release"
echo "Frontend deployment completed successfully: $DEPLOY_ENV/$RELEASE_SHA"
