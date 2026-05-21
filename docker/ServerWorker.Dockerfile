FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV SERVER_WORKER_MODE="scheduled"
ENV SERVER_WORKER_SCHEDULE_FILE="config/schedules.example.json"

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dream-invoice/database db:generate
RUN pnpm --filter @dream-invoice/server-worker typecheck

CMD ["pnpm", "--filter", "@dream-invoice/server-worker", "worker"]
