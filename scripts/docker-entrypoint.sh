#!/bin/sh
set -eu

echo "[entrypoint] Running database migrations..."
pnpm db:migrate

echo "[entrypoint] Starting application..."
exec node build
