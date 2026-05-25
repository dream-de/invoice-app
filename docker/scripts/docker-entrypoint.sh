#!/bin/sh
set -eu

echo "Applying database migrations..."
pnpm --filter @dream-invoice/database db:deploy

echo "Starting Dream Invoice..."
exec "$@"
