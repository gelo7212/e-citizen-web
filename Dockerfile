FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build
FROM base AS builder
COPY . .
RUN npm run build

# Production image
FROM node:18-alpine AS runtime

WORKDIR /app

# Only copy production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["npm", "start"]
