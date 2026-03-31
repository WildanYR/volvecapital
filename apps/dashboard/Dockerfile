FROM node:24-alpine AS builder

WORKDIR /app

ARG VITE_MASTER_URL=http://localhost:3000

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV VITE_MASTER_URL=$VITE_MASTER_URL

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json apps/dashboard/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY apps/dashboard apps/dashboard
COPY packages packages

RUN pnpm install --filter @volvecapital/dashboard... --frozen-lockfile
RUN pnpm --filter @volvecapital/dashboard build

FROM nginx:1.27-alpine AS runner

COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
