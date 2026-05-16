#!/bin/sh
set -eu

echo "Generating Prisma client..."
pnpm --filter @invoice-platform/database db:generate

echo "Applying database migrations..."
pnpm --filter @invoice-platform/database db:deploy

echo "Starting Invoice Platform..."
exec "$@"
