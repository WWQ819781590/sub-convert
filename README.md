# sub-convert

Node + TypeScript monorepo scaffold with a NestJS server and a Vue 3 web app.

## Structure

```text
apps/server   NestJS HTTP service
apps/web      Vue 3 + Vite web app
public        Runtime config directory
docker        Docker build and nginx config
```

## Local development

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Server: <http://localhost:3000>

Web: <http://localhost:5173>

## Config files

The server reads JSON files from `PUBLIC_DIR`. If `PUBLIC_DIR` is not set, it falls back to the repository `public` directory during local development.

Default endpoint:

```text
GET /api/config
```

Read another JSON file:

```text
GET /api/config?file=another.json
```

## Subscription conversion

`public/config.json` maps a short key to a 3x-ui subscription URL and target format. This file can contain secrets and is ignored by Git. Start from the example file:

```bash
cp public/config.example.json public/config.json
```

```json
{
  "example-key": {
    "url": "https://example.com/subscription",
    "target": "clash"
  }
}
```

Convert a subscription:

```text
GET /api/config/subscribe?key=example-key
```

The server calls `${SUBCONVERTER_URL}/sub?target=clash&url=...` and returns the converted content directly. `SUBCONVERTER_URL` is required and should be set in `.env` or the server environment.

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Web: <http://localhost:8080>

Server: <http://localhost:3000>

To use a different config directory, change the server volume:

```yaml
volumes:
  - ./your-config-dir:/app/public:ro
```

## GitHub Container Registry

Build and push images to GHCR:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

docker build -f docker/server.Dockerfile -t ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-server:latest .
docker build -f docker/web.Dockerfile -t ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-web:latest .

docker push ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-server:latest
docker push ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-web:latest
```

On the server, use the pushed images in `docker-compose.yml`, create `.env`, and keep `public/config.json` only on the server:

```yaml
services:
  server:
    image: ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-server:latest
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      PUBLIC_DIR: /app/public
      SUBCONVERTER_URL: ${SUBCONVERTER_URL:?Set SUBCONVERTER_URL in .env}
    volumes:
      - ./public:/app/public:ro

  web:
    image: ghcr.io/YOUR_GITHUB_USERNAME/sub-convert-web:latest
    ports:
      - "8080:80"
    depends_on:
      - server
```
