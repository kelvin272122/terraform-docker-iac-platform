FROM node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS build

WORKDIR /app

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci

COPY app/backend/tsconfig.json ./
COPY app/backend/src ./src
RUN npm run build

FROM node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS prod-deps

WORKDIR /app

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci --omit=dev

FROM node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY app/backend/package.json ./package.json

USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
CMD ["node", "dist/server.js"]

FROM node:24.13.1-bookworm-slim@sha256:a81a03dd965b4052269a57fac857004022b522a4bf06e7a739e25e18bce45af2 AS migration

WORKDIR /app

COPY app/backend/package.json app/backend/package-lock.json ./
RUN npm ci

COPY app/database/migrations /database/migrations

USER node
ENTRYPOINT ["node", "node_modules/node-pg-migrate/bin/node-pg-migrate.js"]
CMD ["up", "--migrations-dir", "/database/migrations", "--migrations-table", "pgmigrations", "--database-url-var", "MIGRATION_DATABASE_URL"]
