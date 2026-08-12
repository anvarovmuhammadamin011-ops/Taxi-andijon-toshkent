# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/taxi-v2/frontend
COPY taxi-v2/frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY taxi-v2/frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder
WORKDIR /app/taxi-v2/backend
COPY taxi-v2/backend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY taxi-v2/backend/ ./
RUN npm run build

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=backend-builder /app/taxi-v2/backend ./taxi-v2/backend
COPY --from=frontend-builder /app/taxi-v2/frontend/dist ./taxi-v2/frontend/dist

WORKDIR /app/taxi-v2/backend
RUN mkdir -p data

EXPOSE 3000
CMD ["node", "dist/index.js"]
