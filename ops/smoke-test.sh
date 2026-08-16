#!/usr/bin/env bash
set -euo pipefail

FRONTEND_URL="${1:?Usage: $0 <frontend-url> <api-url> [label]}"
API_URL="${2:?Usage: $0 <frontend-url> <api-url> [label]}"
LABEL="${3:-deployment}"

check_url() {
  local name="$1"
  local url="$2"

  echo "Checking $name: $url"
  curl --fail --silent --show-error --location \
    --retry 3 --retry-delay 2 --connect-timeout 10 --max-time 30 \
    "$url" >/dev/null
}

check_url "${LABEL} frontend" "$FRONTEND_URL"
check_url "${LABEL} API health" "${API_URL%/}/health"
echo "${LABEL} smoke test passed."
