FROM oven/bun:1 AS builder

WORKDIR /app

COPY . .

# Avoid running repo postinstall hooks during image build.
RUN bun install --frozen-lockfile --ignore-scripts
RUN bun run --cwd apps/redirect build

FROM builder AS runner

WORKDIR /app/apps/redirect

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["bun", "run", "start"]
