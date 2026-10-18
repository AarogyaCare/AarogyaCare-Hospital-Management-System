# Stage 1: Build application assets
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . ./
RUN npm run build

# Stage 2: Serve application preview
FROM node:20-alpine AS runner

WORKDIR /app
COPY --from=builder /app /app

USER node

EXPOSE 5173

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5173/ || exit 1

CMD ["npm", "run", "preview"]
