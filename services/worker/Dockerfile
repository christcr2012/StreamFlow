FROM node:18-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy root package files and tsconfig
COPY package.json package-lock.json tsconfig.json ./

# Copy packages
COPY packages/queue ./packages/queue

# Copy worker service
COPY services/worker ./services/worker

# Install ALL dependencies (including devDependencies needed for build)
RUN npm ci --workspace=cortiware-worker --workspace=@cortiware/queue

# Build queue package
WORKDIR /app/packages/queue
RUN npm run build

# Copy built queue package to worker's node_modules
WORKDIR /app/services/worker
RUN mkdir -p node_modules/@cortiware/queue && \
    cp -r /app/packages/queue/dist node_modules/@cortiware/queue/ && \
    cp /app/packages/queue/package.json node_modules/@cortiware/queue/

# Build worker
RUN npm run build

# Back to app root
WORKDIR /app

# Remove devDependencies after build
RUN npm prune --omit=dev

ENV NODE_ENV=production

WORKDIR /app/services/worker

EXPOSE 8080

CMD ["dumb-init", "node", "dist/server.js"]

