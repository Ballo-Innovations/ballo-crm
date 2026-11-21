#!/usr/bin/env sh
# Nightly Postgres dump for this environment. Run on the host from the deploy directory
# (cron line in docs/07-dev-setup/environments-and-deployment.md). Keeps 7 days.
set -eu
cd "$(dirname "$0")"

. ./.env
DEST="/var/backups/ballocrm/${APP_ENV}"
mkdir -p "$DEST"
FILE="$DEST/ballocrm-${APP_ENV}-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"

docker compose -f compose.yml exec -T db pg_dump -U ballocrm --clean --if-exists ballocrm | gzip > "$FILE"
find "$DEST" -name '*.sql.gz' -mtime +7 -delete
echo "Wrote $FILE"
