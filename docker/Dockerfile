FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"
ENV PUPPETEER_SKIP_DOWNLOAD="true"
ENV PUPPETEER_EXECUTABLE_PATH="/usr/bin/chromium"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    chromium \
    fonts-liberation \
    openssl \
    postgresql-client \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @invoice-platform/database db:generate
RUN pnpm --filter @invoice-platform/web build

EXPOSE 3000

ENTRYPOINT ["sh", "docker/scripts/docker-entrypoint.sh"]
CMD ["pnpm", "--filter", "@invoice-platform/web", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
