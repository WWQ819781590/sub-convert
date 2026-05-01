FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/package.json
RUN pnpm install --filter @sub-convert/server... --frozen-lockfile=false

FROM deps AS build
COPY apps/server apps/server
RUN pnpm --filter @sub-convert/server build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV PUBLIC_DIR=/app/public
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/server/package.json apps/server/package.json
RUN pnpm install --filter @sub-convert/server --prod --frozen-lockfile=false
COPY --from=build /app/apps/server/dist apps/server/dist
EXPOSE 3000
CMD ["pnpm", "--filter", "@sub-convert/server", "start"]
