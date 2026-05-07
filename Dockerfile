# ── Stage 1: build Vue frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ── Stage 2: production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# Install backend dependencies (native modules need python/make on alpine)
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY backend/ ./backend/

# Copy built frontend into place (backend serves it via express.static)
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Persistent data directory (mount a volume here)
RUN mkdir -p /data

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/golf.db

CMD ["node", "backend/src/index.js"]
