FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --filter @sub-convert/web... --frozen-lockfile=false
COPY apps/web apps/web
RUN pnpm --filter @sub-convert/web build

FROM nginx:1.29-alpine AS runner
COPY docker/web.nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
