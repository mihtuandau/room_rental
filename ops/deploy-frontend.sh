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
  nvm use 22 --silent
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

# Next.js does not automatically load .env.staging. Export the host-only
# environment explicitly so server-side build fetches and NEXT_PUBLIC_* values
# use the same staging configuration as the runtime process.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

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
FRONTEND_PORT="${ROOMRENT_FRONTEND_PORT:-5000}"

echo "Installing frontend dependencies for $DEPLOY_ENV/$RELEASE_SHA..."
cd "$CLIENT_DIR"
pnpm install --frozen-lockfile
pnpm run build

# Next.js is configured with output: standalone. Copy the static assets that
# are not included in the standalone server bundle before starting it.
mkdir -p "$CLIENT_DIR/.next/standalone/.next/static" \
  "$CLIENT_DIR/.next/standalone/public"
cp -a "$CLIENT_DIR/.next/static/." \
  "$CLIENT_DIR/.next/standalone/.next/static/"
cp -a "$CLIENT_DIR/public/." \
  "$CLIENT_DIR/.next/standalone/public/"

# Replace the process after a successful build so an old pnpm/next-start
# command cannot keep using the wrong port or incompatible standalone mode.
if pm2 describe "$PM2_APP_NAME" >/dev/null 2>&1; then
  pm2 delete "$PM2_APP_NAME"
fi

PORT="$FRONTEND_PORT" HOSTNAME=0.0.0.0 pm2 start server.js \
  --name "$PM2_APP_NAME" \
  --cwd "$CLIENT_DIR/.next/standalone"
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

wait_for_http "http://127.0.0.1:${FRONTEND_PORT}"

printf '%s\n' "$RELEASE_SHA" > "$REPO_ROOT/.roomrent-${DEPLOY_ENV}-frontend-release"
echo "Frontend deployment completed successfully: $DEPLOY_ENV/$RELEASE_SHA"
