FROM node:22-alpine AS base
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
COPY package.json pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
RUN pnpm install

FROM deps AS build
ARG APP_PACKAGE
RUN pnpm --filter ${APP_PACKAGE}... build

FROM node:22-alpine AS runtime
RUN corepack enable
WORKDIR /workspace
ARG APP_PACKAGE
COPY --from=build /workspace /workspace
ENV NODE_ENV=production
CMD ["sh", "-lc", "pnpm --filter ${APP_PACKAGE} start"]
