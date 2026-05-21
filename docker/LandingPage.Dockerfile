FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV="production"
ENV PORT="4174"

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @dream-invoice/landing-page build

EXPOSE 4174

CMD ["pnpm", "--filter", "@dream-invoice/landing-page", "preview"]
