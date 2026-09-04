#!/usr/bin/env bash
#
# Triggers subscription auto-charges by calling the app's cron endpoint.
# Intended to be run periodically by system cron (e.g. once a day).
#
# Configuration is read from the environment; if not already set, it is loaded
# from the project's .env.local then .env. Required:
#   APP_URL       — public base URL of the app (e.g. https://aigymly.example.com)
#   CRON_SECRET   — shared secret; must match the app's CRON_SECRET
#
# Exit codes: 0 on HTTP 2xx, non-zero otherwise (so cron/monitoring can alert).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Load env from .env.local then .env without overriding already-set variables.
load_env() {
  local file="$1"
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|\#*) continue ;;
    esac
    local key="${line%%=*}"
    key="${key#export }"
    key="$(printf '%s' "$key" | tr -d '[:space:]')"
    [ -n "$key" ] || continue
    if [ -z "${!key:-}" ]; then
      local val="${line#*=}"
      val="${val%\"}"; val="${val#\"}"
      val="${val%\'}"; val="${val#\'}"
      export "$key=$val"
    fi
  done < "$file"
}

load_env "$PROJECT_DIR/.env.local"
load_env "$PROJECT_DIR/.env"

: "${APP_URL:?APP_URL is not set}"
: "${CRON_SECRET:?CRON_SECRET is not set}"

URL="${APP_URL%/}/api/cron/charge-subscriptions"

echo "[$(date -Is)] POST $URL"

if ! http_code=$(
  curl -fsS -o /tmp/charge-subscriptions.out -w '%{http_code}' \
    -X POST "$URL" \
    -H "Authorization: Bearer ${CRON_SECRET}" \
    --max-time 120
); then
  rc=$?
  echo "[$(date -Is)] request failed (curl exit $rc)" >&2
  cat /tmp/charge-subscriptions.out >&2 2>/dev/null || true
  exit 1
fi

echo "[$(date -Is)] HTTP $http_code"
cat /tmp/charge-subscriptions.out
echo
