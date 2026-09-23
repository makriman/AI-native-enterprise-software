FROM node:22-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install --frozen-lockfile

FROM deps AS build
ARG APP_PACKAGE
RUN pnpm --filter ${APP_PACKAGE}... build

FROM node:22-alpine AS runtime
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate
WORKDIR /workspace
ARG APP_PACKAGE
COPY --from=build /workspace /workspace
ENV NODE_ENV=production
CMD ["sh", "-lc", "pnpm --filter ${APP_PACKAGE} start"]
