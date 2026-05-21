#!/bin/sh
set -eu

echo "Generating Prisma client..."
pnpm --filter @dream-invoice/database db:generate

echo "Applying database migrations..."
pnpm --filter @dream-invoice/database db:deploy

echo "Starting Dream Invoice..."
exec "$@"
