# Build with non-slim node image to include build tools like python.
FROM node:lts AS builder

WORKDIR /app

# pnpm 10 aborts node_modules purge prompts without a TTY unless CI is set.
ENV CI=true

RUN corepack enable

COPY package.json pnpm-lock.yaml .npmrc ./
RUN corepack prepare --activate

RUN pnpm fetch --prod
RUN pnpm install -r --offline --prod --frozen-lockfile

# Use slim node for small image.
FROM node:lts-slim

WORKDIR /app

ENV CI=true
ENV NODE_ENV=production

RUN corepack enable

COPY package.json .npmrc ./
RUN corepack prepare --activate

COPY --from=builder /app/node_modules ./node_modules

COPY drizzle.config.js ./drizzle.config.js
COPY ./drizzle ./drizzle
COPY ./build ./build
COPY ./src ./src

EXPOSE 3000
EXPOSE 3001
CMD [ "pnpm", "start" ]
