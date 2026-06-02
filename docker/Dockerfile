FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV COREPACK_HOME="/pnpm/corepack"
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
    poppler-utils \
    postgresql-client \
    tesseract-ocr \
    tesseract-ocr-deu \
    tesseract-ocr-eng \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
RUN groupadd --system dreaminvoice && useradd --system --gid dreaminvoice --home /app dreaminvoice

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.json eslint.config.mjs ./
COPY apps ./apps
COPY packages ./packages
COPY database ./database
COPY docker/scripts ./docker/scripts
COPY assets ./assets

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dream-invoice/database db:generate
RUN pnpm --filter @dream-invoice/web build
RUN rm -rf apps/demo apps/landing-page docker/Demo.Dockerfile docker/LandingPage.Dockerfile docker/public-site.compose.yml docker/nginx/public-site.conf

EXPOSE 3000

RUN mkdir -p data "$COREPACK_HOME" && chown dreaminvoice:dreaminvoice data

USER dreaminvoice

ENTRYPOINT ["sh", "docker/scripts/docker-entrypoint.sh"]
CMD ["pnpm", "--filter", "@dream-invoice/web", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
