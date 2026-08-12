#!/usr/bin/env bash
set -euo pipefail

# Backend site deployment. Frontend is deployed separately by deploy-frontend.sh.

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$PATH"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Backend deployment must run from the main branch." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Tracked local changes detected. Deployment stopped." >&2
  git status --short
  exit 1
fi

for required_file in server/.env.production docker-compose.prod.yml; do
  if [[ ! -f "$required_file" ]]; then
    echo "Missing required file: $required_file" >&2
    exit 1
  fi
done

command -v docker >/dev/null || { echo "docker is required" >&2; exit 1; }
command -v docker-compose >/dev/null || { echo "docker-compose is required" >&2; exit 1; }

echo "Pulling backend site..."
git pull --ff-only origin main

echo "Building migration image..."
docker build --network=host \
  --target build \
  -t roomrent-migrator:prod \
  ./server

echo "Building backend image..."
docker build --network=host \
  --target runtime \
  -t roomrent-server:prod \
  ./server

echo "Starting infrastructure..."
docker-compose -f docker-compose.prod.yml up -d postgres redis

echo "Applying database migrations..."
docker-compose -f docker-compose.prod.yml run --rm --no-deps migrate

echo "Replacing backend container..."
docker-compose -f docker-compose.prod.yml stop backend || true
docker-compose -f docker-compose.prod.yml rm -f backend || true
docker-compose -f docker-compose.prod.yml up -d --no-deps backend

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

wait_for_http http://127.0.0.1:3000/health
echo "Backend deployment completed successfully."
