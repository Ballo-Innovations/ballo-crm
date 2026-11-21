#!/usr/bin/env sh
# Deploy one image tag to this environment. Run on the host, from the deploy directory:
#   ./deploy.sh <image-tag>          e.g. ./deploy.sh 3f2a9c1
# Rollback = run it again with the tag in .release.previous.
set -eu
cd "$(dirname "$0")"

TAG="${1:?usage: deploy.sh <image-tag>}"
[ -f .env ] || { echo "Missing .env - copy deploy/.env.example and fill it in." >&2; exit 1; }
export IMAGE_TAG="$TAG"

# Pull only what this host does not already have, so a rollback needs no registry login.
for image in ballo-crm ballo-crm-migrate; do
  docker image inspect "ghcr.io/ballo-innovations/$image:$TAG" > /dev/null 2>&1 ||
    docker pull "ghcr.io/ballo-innovations/$image:$TAG"
done
docker compose -f compose.yml up -d db minio
docker compose -f compose.yml run --rm migrate
docker compose -f compose.yml up -d --remove-orphans --wait app

if [ -f .release ] && [ "$(cat .release)" != "$TAG" ]; then cp .release .release.previous; fi
echo "$TAG" > .release
echo "Deployed $TAG"
