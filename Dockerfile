# Build with non-slim node image to include build tools like python.
FROM node:lts AS builder

WORKDIR /app

RUN corepack enable pnpm && corepack install -g pnpm@latest

# pnpm fetch requires lockfile only
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod

COPY package.json ./
RUN pnpm install -r --offline --prod --frozen-lockfile

# Use slim node for small image.
FROM node:lts-slim

WORKDIR /app

RUN corepack enable pnpm && corepack install -g pnpm@latest

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

COPY drizzle.config.js ./drizzle.config.js
COPY ./drizzle ./drizzle
COPY ./build ./build
COPY ./src ./src

EXPOSE 3000
EXPOSE 3001
CMD [ "pnpm", "start" ]
