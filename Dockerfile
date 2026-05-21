# syntax=docker/dockerfile:1.4
# Multi-stage Dockerfile for combining frontend and backend

# Stage 1: Build frontend
FROM node:18 AS build-frontend
ARG VPGA_VERSION=unknown
ENV VITE_VERSION=$VPGA_VERSION
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm install
COPY frontend ./frontend
RUN cd frontend && npm run build

# Stage 2: Build backend and include frontend build
FROM node:18
WORKDIR /app

# Accept VITE_VERSION as build arg and set as env
ARG VITE_VERSION=unknown
ENV VITE_VERSION=$VITE_VERSION

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm install
COPY backend ./backend
RUN --mount=type=bind,source=production.env,target=/tmp/production.env,required=false \
    if [ -f /tmp/production.env ]; then cp /tmp/production.env ./backend/.env; fi
COPY --from=build-frontend /app/frontend/dist ./backend/public

# Start backend (serving frontend as static files)
WORKDIR /app/backend
CMD ["node", "src/index.js"]
