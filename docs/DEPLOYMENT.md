# Deployment Guide

## Development

```bash
docker-compose -f docker-compose.dev.yml up
```

Accessible at `http://localhost:3000`

## Production with Docker

### Build Image

```bash
docker build -t ecitizen-fe:latest .
```

### Deploy with Compose

```bash
docker-compose -f docker-compose.prod.yml up -d
```

This starts:
- Nginx (port 80, 443) - reverse proxy & static caching
- Next.js app (port 3000)
- BFF (port 3002)
- Microservices (port 3001)

## Nginx Configuration

Edit `nginx.conf` for:
- SSL certificates (update paths in `docker-compose.prod.yml`)
- Rate limiting
- Caching policies
- Health checks

Generate self-signed cert for testing:

```bash
mkdir -p certs
openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes
```

## Environment Variables

Create `.env.production.local`:

```
NEXT_PUBLIC_API_BASE=https://yourdomain.com/api
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws
NEXT_PUBLIC_APP_ENV=production
JWT_SECRET=your-production-secret
```

## Performance

### Caching Strategy

- **Static assets** (/_next/static/) - 365 days
- **Public assets** (.js, .css, .png, etc.) - 30 days
- **HTML pages** - 1 minute
- **API responses** - 5 minutes (configurable)

### Compression

Gzip enabled for:
- text/plain
- text/css
- text/xml
- application/json
- application/javascript

## Security Headers

- HSTS (Strict-Transport-Security)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Permissions-Policy: geolocation=(), microphone=(), camera=()

## Monitoring

### Health Check

```bash
curl https://yourdomain.com/health
```

### Logs

```bash
docker-compose logs -f
docker-compose logs nginx
docker-compose logs app
```

## Scaling

For high traffic, scale horizontally:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale app=3
```

Use load balancer in front of Nginx.

## CI/CD

Example GitHub Actions workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: docker build -t ecitizen-fe:latest .
      - name: Deploy
        run: docker-compose -f docker-compose.prod.yml up -d
```
