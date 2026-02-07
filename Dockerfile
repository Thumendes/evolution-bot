FROM oven/bun AS build

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY ./src ./src

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--outfile server \
	src/index.ts

FROM gcr.io/distroless/cc-debian12

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

EXPOSE 3000

CMD ["./server"]
