FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV SERVER_WORKER_MODE="scheduled"
ENV SERVER_WORKER_SCHEDULE_FILE="config/schedules.example.json"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
RUN groupadd --system dreaminvoice && useradd --system --gid dreaminvoice --home /app dreaminvoice

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dream-invoice/database db:generate
RUN pnpm --filter @dream-invoice/server-worker typecheck

RUN mkdir -p data && chown dreaminvoice:dreaminvoice data

USER dreaminvoice

CMD ["pnpm", "--filter", "@dream-invoice/server-worker", "worker"]
