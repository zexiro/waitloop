FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/waitloop/package.json apps/waitloop/
COPY packages/cli/package.json packages/cli/
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm --dir apps/waitloop build

FROM node:22-alpine AS run
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /repo/apps/waitloop/.next/standalone ./
COPY --from=build /repo/apps/waitloop/.next/static ./apps/waitloop/.next/static
COPY --from=build /repo/apps/waitloop/public ./apps/waitloop/public
COPY --from=build /repo/apps/waitloop/drizzle ./apps/waitloop/drizzle
COPY --from=build /repo/apps/waitloop/content ./apps/waitloop/content
EXPOSE 3000
CMD ["node", "apps/waitloop/server.js"]
