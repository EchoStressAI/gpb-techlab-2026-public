# --- Этап 1: сборка ---
FROM node:20-alpine AS build

WORKDIR /app

# Сначала только манифесты — слой с npm ci кэшируется,
# пока package.json / package-lock.json не изменились.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite подставляет переменные статически, поэтому адреса попадают
# в бандл на этапе сборки. Меняешь домен — нужна пересборка образа.
ARG VITE_API_URL=/api
ARG VITE_PUBLIC_ORIGIN=

RUN npm run build

# --- Этап 2: раздача статики ---
FROM nginx:1.27-alpine AS runtime

# Убираем дефолтный конфиг. Свой кладём как шаблон: официальный образ
# прогоняет /etc/nginx/templates/*.template через envsubst при старте,
# подставляя PUBLIC_DOMAIN и API_UPSTREAM из окружения.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Корневые сертификаты: апстрим внешний и работает по https,
# без набора УЦ nginx не сможет проверить его сертификат.
RUN apk add --no-cache ca-certificates && update-ca-certificates

COPY --from=build /app/dist /usr/share/nginx/html

# Значения по умолчанию, если переменные не переданы через compose.
ENV PUBLIC_DOMAIN=_
ENV API_UPSTREAM=https://backend.example.com
ENV API_HOST=backend.example.com
# Ограничиваем envsubst только нашими переменными, иначе он затрёт
# внутренние переменные nginx вроде $uri и $host.
ENV NGINX_ENVSUBST_FILTER="^(PUBLIC_DOMAIN|API_UPSTREAM|API_HOST)$"

EXPOSE 80

# Healthcheck ходит на /healthz — единственный путь без basic auth.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
