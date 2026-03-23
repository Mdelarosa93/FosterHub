FROM node:22-bullseye-slim

WORKDIR /app

RUN corepack enable

COPY . .

WORKDIR /app/fosterhub-app

RUN corepack pnpm install --frozen-lockfile
RUN corepack pnpm --filter @fosterhub/api build

EXPOSE 4001

CMD ["sh", "-lc", "cd /app/fosterhub-app && PRISMA_GENERATE_SKIP_AUTOINSTALL=1 corepack pnpm prisma db push --accept-data-loss && cd apps/api && node dist/apps/api/src/main.js"]
