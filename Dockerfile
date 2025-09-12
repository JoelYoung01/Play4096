FROM node:lts-slim

WORKDIR /app

RUN corepack enable pnpm && corepack install -g pnpm@latest

# pnpm fetch requires lockfile only
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod


COPY package.json ./
RUN pnpm install -r --offline --prod --frozen-lockfile

COPY drizzle.config.js ./drizzle.config.js
COPY ./drizzle ./drizzle
COPY ./build ./build


EXPOSE 3000
EXPOSE 3001
CMD [ "pnpm", "start" ]