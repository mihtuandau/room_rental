#!/usr/bin/env bash
set -euo pipefail

# Deploy one exact repository commit. The caller must checkout the commit before
# invoking this script; the script deliberately never pulls the moving main ref.

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"

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

if [[ "$DEPLOY_ENV" == "production" ]]; then
  COMPOSE_FILE="docker-compose.prod.yml"
else
  COMPOSE_FILE="docker-compose.staging.yml"
fi
ENV_FILE="server/.env.${DEPLOY_ENV}"
STATE_FILE="${ROOMRENT_RELEASE_STATE_FILE:-$REPO_ROOT/.roomrent-${DEPLOY_ENV}-release}"
IMAGE_TAG="roomrent-${DEPLOY_ENV}-${RELEASE_SHA}"

for required_file in "$ENV_FILE" "$COMPOSE_FILE"; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing required file: $required_file" >&2
    exit 1
  fi
done

command -v docker >/dev/null || {
  echo "docker is required" >&2
  exit 1
}

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is required: docker compose" >&2
  exit 1
fi

COMPOSE_PROJECT="room_rental"
if [[ "$DEPLOY_ENV" == "staging" ]]; then
  COMPOSE_PROJECT="room_rental_staging"
fi

# Keep staging and production containers isolated even when they share one VPS
# and repository directory. Without an explicit project name, Docker Compose
# derives the same project from the directory and staging can replace production.
COMPOSE=(docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE")
export ROOMRENT_RELEASE="$IMAGE_TAG"

previous_release=""
if [[ -f "$STATE_FILE" ]]; then
  previous_release="$(tr -d '[:space:]' < "$STATE_FILE")"
fi

echo "Building migration image for $DEPLOY_ENV/$RELEASE_SHA..."
docker build --network=host \
  --target build \
  -t "roomrent-migrator:$IMAGE_TAG" \
  ./server

echo "Building backend image for $DEPLOY_ENV/$RELEASE_SHA..."
docker build --network=host \
  --target runtime \
  -t "roomrent-server:$IMAGE_TAG" \
  ./server

echo "Starting infrastructure..."
"${COMPOSE[@]}" up -d postgres redis

echo "Applying backward-compatible database migrations..."
"${COMPOSE[@]}" run --rm --no-deps migrate

echo "Replacing backend container..."
"${COMPOSE[@]}" stop backend || true
"${COMPOSE[@]}" rm -f backend || true
"${COMPOSE[@]}" up -d --no-deps --no-build backend

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

if [[ "$DEPLOY_ENV" == "production" ]]; then
  BACKEND_PORT="${ROOMRENT_BACKEND_PORT:-3000}"
else
  BACKEND_PORT="${ROOMRENT_BACKEND_PORT:-3002}"
fi
wait_for_http "http://127.0.0.1:${BACKEND_PORT}/health"

if [[ -n "$previous_release" && "$previous_release" != "$RELEASE_SHA" ]]; then
  printf '%s\n' "$previous_release" > "$STATE_FILE.previous"
fi
printf '%s\n' "$RELEASE_SHA" > "$STATE_FILE"

echo "Backend deployment completed successfully: $DEPLOY_ENV/$RELEASE_SHA"
