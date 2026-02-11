ARG ALPINE_VERSION=3.23
ARG NGINX_VERSION=1.29.5
ARG NODE_VERSION=25.6.0
ARG BASE_IMAGE_PREFIX=docker.io

FROM ${BASE_IMAGE_PREFIX}/library/node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS builder

WORKDIR /app

ARG NPM_CONFIG_REGISTRY
ENV NPM_CONFIG_REGISTRY=${NPM_CONFIG_REGISTRY}
RUN --mount=type=cache,target=/app/node_modules \
    --mount=type=cache,target=/root/.npm \ 
    --mount=type=bind,source=./package.json,target=/app/package.json \
    npm install

COPY . .

RUN --mount=type=cache,target=/app/node_modules \
    --mount=type=cache,target=/root/.npm \
    npm run build

FROM ${BASE_IMAGE_PREFIX}/library/nginx:${NGINX_VERSION}-alpine${ALPINE_VERSION}

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
